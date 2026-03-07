'use strict';

const { pool } = require('../db/pool');

async function sessionRoutes(fastify) {
  /**
   * POST /api/session/start
   * body: { anchorCode, isMobilityImpaired }
   * Creates a new nav session and inserts a 'start' event.
   */
  fastify.post('/api/session/start', async (request, reply) => {
    const { anchorCode, isMobilityImpaired } = request.body || {};

    if (!anchorCode) {
      return reply.code(400).send({ error: 'anchorCode is required' });
    }

    const anchorRes = await pool.query(
      'SELECT id, anchor_code, label, floor, map_x, map_y FROM anchors WHERE anchor_code = $1',
      [anchorCode]
    );
    if (anchorRes.rows.length === 0) {
      return reply.code(404).send({ error: 'anchor not found' });
    }
    const anchor = anchorRes.rows[0];

    const sessionRes = await pool.query(
      `INSERT INTO nav_sessions (start_anchor_id, current_anchor_id, is_mobility_impaired)
       VALUES ($1, $1, $2)
       RETURNING id`,
      [anchor.id, Boolean(isMobilityImpaired)]
    );
    const sessionId = sessionRes.rows[0].id;

    await pool.query(
      `INSERT INTO nav_events (session_id, anchor_id, event_type)
       VALUES ($1, $2, 'start')`,
      [sessionId, anchor.id]
    );

    return { sessionId, anchorCode: anchor.anchor_code, anchor };
  });

  /**
   * POST /api/session/scan
   * body: { sessionId, anchorCode }
   * Updates current_anchor_id and inserts a 'scan' event.
   * Returns scannedPath (ordered anchor IDs from session start to now).
   */
  fastify.post('/api/session/scan', async (request, reply) => {
    const { sessionId, anchorCode } = request.body || {};

    if (!sessionId || !anchorCode) {
      return reply.code(400).send({ error: 'sessionId and anchorCode are required' });
    }

    const anchorRes = await pool.query(
      'SELECT id FROM anchors WHERE anchor_code = $1',
      [anchorCode]
    );
    if (anchorRes.rows.length === 0) {
      return reply.code(404).send({ error: 'anchor not found' });
    }
    const anchorId = anchorRes.rows[0].id;

    const updateRes = await pool.query(
      `UPDATE nav_sessions
       SET current_anchor_id = $1, last_seen_at = NOW()
       WHERE id = $2 AND ended_at IS NULL
       RETURNING id`,
      [anchorId, sessionId]
    );
    if (updateRes.rows.length === 0) {
      return reply.code(404).send({ error: 'session not found or already ended' });
    }

    await pool.query(
      `INSERT INTO nav_events (session_id, anchor_id, event_type)
       VALUES ($1, $2, 'scan')`,
      [sessionId, anchorId]
    );

    // Return ordered list of full anchor objects scanned so far
    const eventsRes = await pool.query(
      `SELECT a.id, a.anchor_code, a.label, a.floor, a.map_x, a.map_y, a.elev_x, a.elev_y
       FROM nav_events e
       JOIN anchors a ON a.id = e.anchor_id
       WHERE e.session_id = $1
       ORDER BY e.scanned_at ASC`,
      [sessionId]
    );

    return { ok: true, scannedPath: eventsRes.rows };
  });

  /**
   * POST /api/session/arrive
   * body: { sessionId }
   * Marks session as arrived and ended.
   */
  fastify.post('/api/session/arrive', async (request, reply) => {
    const { sessionId } = request.body || {};

    if (!sessionId) {
      return reply.code(400).send({ error: 'sessionId is required' });
    }

    const sessionRes = await pool.query(
      'SELECT current_anchor_id FROM nav_sessions WHERE id = $1 AND ended_at IS NULL',
      [sessionId]
    );
    if (sessionRes.rows.length === 0) {
      return reply.code(404).send({ error: 'session not found or already ended' });
    }
    const anchorId = sessionRes.rows[0].current_anchor_id;

    await pool.query(
      `UPDATE nav_sessions
       SET arrived_at = NOW(), ended_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    await pool.query(
      `INSERT INTO nav_events (session_id, anchor_id, event_type)
       VALUES ($1, $2, 'arrived')`,
      [sessionId, anchorId]
    );

    return { ok: true };
  });

  /**
   * POST /api/session/destination
   * body: { sessionId, destinationAnchorId }
   * Sets destination on an existing session.
   */
  fastify.post('/api/session/destination', async (request, reply) => {
    const { sessionId, destinationAnchorId } = request.body || {};
    if (!sessionId || !destinationAnchorId) {
      return reply.code(400).send({ error: 'sessionId and destinationAnchorId are required' });
    }
    const { rowCount } = await pool.query(
      `UPDATE nav_sessions SET destination_anchor_id = $1 WHERE id = $2 AND ended_at IS NULL`,
      [destinationAnchorId, sessionId]
    );
    if (rowCount === 0) return reply.code(404).send({ error: 'session not found or ended' });
    return { ok: true };
  });

  /**
   * GET /api/session/:sessionId
   * Returns flat session info (app.js compatible) + scan history.
   */
  fastify.get('/api/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;

    const sessionRes = await pool.query(
      `SELECT s.id, s.is_mobility_impaired, s.created_at, s.last_seen_at,
              s.ended_at, s.arrived_at,
              da.id   AS destination_id,
              da.anchor_code AS destination_anchor_code,
              da.label AS destination_label,
              da.floor AS destination_floor,
              da.map_x AS destination_map_x,
              da.map_y AS destination_map_y
       FROM nav_sessions s
       LEFT JOIN anchors da ON da.id = s.destination_anchor_id
       WHERE s.id = $1`,
      [sessionId]
    );
    if (sessionRes.rows.length === 0) {
      return reply.code(404).send({ error: 'session not found' });
    }
    const row = sessionRes.rows[0];

    // Flatten destination object (app.js reads sess.destination)
    const destination = row.destination_id ? {
      id: row.destination_id,
      anchor_code: row.destination_anchor_code,
      label: row.destination_label,
      floor: row.destination_floor,
      map_x: row.destination_map_x,
      map_y: row.destination_map_y,
    } : null;

    return {
      id: row.id,
      is_mobility_impaired: row.is_mobility_impaired,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
      ended_at: row.ended_at,
      arrived_at: row.arrived_at,
      destination,
    };
  });
}

module.exports = sessionRoutes;
