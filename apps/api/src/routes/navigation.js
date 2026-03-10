'use strict';

const { pool } = require('../db/pool');
const { aStar } = require('../domain/navigation/a-star');

/**
 * Build adjacency-list graph from DB edges.
 * Each entry: { to: anchorId (string), cost: distance_m, edgeType: edge_type }
 */
async function buildGraph() {
  const { rows } = await pool.query(
    'SELECT from_anchor_id, to_anchor_id, distance_m, edge_type FROM nav_graph_edges'
  );
  const graph = {};
  for (const row of rows) {
    const from = String(row.from_anchor_id);
    const to = String(row.to_anchor_id);
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];
    // Undirected: add both directions
    graph[from].push({ to, cost: Number(row.distance_m), edgeType: row.edge_type });
    graph[to].push({ to: from, cost: Number(row.distance_m), edgeType: row.edge_type });
  }
  return graph;
}

async function navigationRoutes(fastify) {
  /**
   * POST /api/navigation/path
   * body: { sessionId, destinationAnchorId, isMobilityImpaired }
   */
  fastify.post('/api/navigation/path', async (request, reply) => {
    const { sessionId, destinationAnchorId, isMobilityImpaired } = request.body || {};

    if (!sessionId || !destinationAnchorId) {
      return reply.code(400).send({ error: 'sessionId and destinationAnchorId are required' });
    }

    // Load session to get current anchor
    const sessionRes = await pool.query(
      'SELECT current_anchor_id FROM nav_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionRes.rows.length === 0) {
      return reply.code(404).send({ error: 'session not found' });
    }
    const startAnchorId = sessionRes.rows[0].current_anchor_id;

    // Build graph and run A*
    const graph = await buildGraph();
    const result = aStar(
      graph,
      String(startAnchorId),
      String(destinationAnchorId),
      Boolean(isMobilityImpaired)
    );

    if (!result) {
      return reply.code(404).send({ error: 'no path found' });
    }

    // Fetch anchor details for path nodes
    const pathIds = result.path.map(Number);
    const anchorsRes = await pool.query(
      `SELECT id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y
       FROM anchors WHERE id = ANY($1)`,
      [pathIds]
    );
    const anchorMap = {};
    for (const row of anchorsRes.rows) {
      anchorMap[String(row.id)] = row;
    }

    // Build ordered path with edge_type annotation
    const edgesRes = await pool.query(
      `SELECT from_anchor_id, to_anchor_id, edge_type FROM nav_graph_edges`
    );
    const edgeTypeMap = {};
    for (const row of edgesRes.rows) {
      edgeTypeMap[`${row.from_anchor_id}-${row.to_anchor_id}`] = row.edge_type;
      edgeTypeMap[`${row.to_anchor_id}-${row.from_anchor_id}`] = row.edge_type;
    }

    const path = result.path.map((id, idx) => {
      const anchor = anchorMap[id] || {};
      const nextId = result.path[idx + 1];
      const edgeType = nextId ? (edgeTypeMap[`${id}-${nextId}`] || 'walk') : null;
      return {
        id: Number(id),
        anchor_code: anchor.anchor_code,
        label: anchor.label,
        floor: anchor.floor,
        map_x: anchor.map_x,
        map_y: anchor.map_y,
        elev_x: anchor.elev_x,
        elev_y: anchor.elev_y,
        edge_type: edgeType,
      };
    });

    return { path, distanceM: result.distanceM };
  });

  /**
   * GET /api/navigation/destinations
   * Returns is_destination anchors grouped by category.
   */
  fastify.get('/api/navigation/destinations', async (request, reply) => {
    const { rows } = await pool.query(
      `SELECT id, anchor_code, label, floor, destination_category,
              map_x, map_y, elev_x, elev_y
       FROM anchors
       WHERE is_destination = TRUE
       ORDER BY label`
    );

    const grouped = { boarding: [], facility: [], other: [] };
    for (const row of rows) {
      const cat = row.destination_category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }

    return grouped;
  });

  /**
   * GET /api/routes?from=ANCHOR_CODE&dest=ANCHOR_CODE&mobility=0
   * 세션 없이 앵커 코드 기반으로 경로 계산 (stateless)
   */
  fastify.get('/api/routes', async (request, reply) => {
    const { from, dest, mobility } = request.query || {};
    if (!from || !dest) {
      return reply.code(400).send({ error: 'from and dest query params are required' });
    }

    const isMobilityImpaired = mobility === '1' || mobility === 'true';

    // 앵커 코드로 ID 조회
    const anchorRes = await pool.query(
      `SELECT id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y
       FROM anchors WHERE anchor_code = ANY($1)`,
      [[from, dest]]
    );
    const anchorByCode = {};
    for (const row of anchorRes.rows) anchorByCode[row.anchor_code] = row;

    if (!anchorByCode[from]) return reply.code(404).send({ error: `anchor not found: ${from}` });
    if (!anchorByCode[dest]) return reply.code(404).send({ error: `anchor not found: ${dest}` });

    const startId = String(anchorByCode[from].id);
    const goalId  = String(anchorByCode[dest].id);

    const graph = await buildGraph();
    const result = aStar(graph, startId, goalId, isMobilityImpaired);
    if (!result) return reply.code(404).send({ error: 'no path found' });

    // 경로 앵커 상세 조회
    const pathIds = result.path.map(Number);
    const pathAnchorsRes = await pool.query(
      `SELECT id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y
       FROM anchors WHERE id = ANY($1)`,
      [pathIds]
    );
    const anchorMap = {};
    for (const row of pathAnchorsRes.rows) anchorMap[String(row.id)] = row;

    // 엣지 타입 주석
    const edgesRes = await pool.query('SELECT from_anchor_id, to_anchor_id, edge_type FROM nav_graph_edges');
    const edgeTypeMap = {};
    for (const row of edgesRes.rows) {
      edgeTypeMap[`${row.from_anchor_id}-${row.to_anchor_id}`] = row.edge_type;
      edgeTypeMap[`${row.to_anchor_id}-${row.from_anchor_id}`] = row.edge_type;
    }

    const path = result.path.map((id, idx) => {
      const anchor = anchorMap[id] || {};
      const nextId = result.path[idx + 1];
      return {
        id: Number(id),
        anchor_code: anchor.anchor_code,
        label: anchor.label,
        floor: anchor.floor,
        map_x: anchor.map_x,
        map_y: anchor.map_y,
        elev_x: anchor.elev_x,
        elev_y: anchor.elev_y,
        edge_type: nextId ? (edgeTypeMap[`${id}-${nextId}`] || 'walk') : null,
      };
    });

    return { path, distanceM: result.distanceM };
  });

  /**
   * GET /api/test/anchors
   * 테스트 페이지용 — 모든 앵커를 층별로 반환 (인증 불필요)
   */
  fastify.get('/api/test/anchors', async () => {
    const { rows } = await pool.query(
      `SELECT id, anchor_code, label, floor, is_exit, is_elevator, is_destination,
              destination_category, qr_url
       FROM anchors
       ORDER BY floor DESC, anchor_code`
    );
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.floor]) grouped[row.floor] = [];
      grouped[row.floor].push(row);
    }
    return grouped;
  });
}

module.exports = navigationRoutes;
