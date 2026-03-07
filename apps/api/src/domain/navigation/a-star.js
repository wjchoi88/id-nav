'use strict';

/**
 * A* pathfinding over an adjacency-list graph.
 *
 * Graph format (both call sites):
 *   { [nodeId]: [ { to, cost, edgeType? }, ... ], ... }
 *
 * Edge weights for mobility rules:
 *   isMobilityImpaired=true  → elevator normal, stairs ×10
 *   isMobilityImpaired=false → stairs normal, elevator ×10
 *
 * Returns:
 *   { path: [id, ...], distanceM: number }  — new API callers
 *   { nodes: [id, ...], distanceMeters: number }  — legacy callers (findShortestPath)
 *   null when no path exists (new API only)
 */

function _effectiveCost(edge, isMobilityImpaired) {
  const type = edge.edgeType || edge.edge_type || 'walk';
  const base = edge.cost != null ? edge.cost : (edge.distance_m != null ? Number(edge.distance_m) : 1);

  if (isMobilityImpaired) {
    if (type === 'stairs') return base * 10;
    return base;
  } else {
    if (type === 'elevator') return base * 10;
    return base;
  }
}

/**
 * Core A* (with trivial heuristic — degrades to Dijkstra).
 * Returns { path, distanceM } or null if unreachable.
 */
function aStar(graph, startId, goalId, isMobilityImpaired) {
  const startStr = String(startId);
  const goalStr = String(goalId);

  const dist = new Map();
  const prev = new Map();
  // Min-heap via a simple priority queue (array + sort — acceptable for ≤20 nodes)
  const open = new Map(); // nodeId → fScore

  dist.set(startStr, 0);
  open.set(startStr, 0);

  while (open.size > 0) {
    // Pop node with lowest fScore
    let current = null;
    let best = Infinity;
    for (const [id, f] of open) {
      if (f < best) { best = f; current = id; }
    }
    open.delete(current);

    if (current === goalStr) {
      // Reconstruct path
      const path = [];
      let cursor = goalStr;
      while (cursor !== undefined) {
        path.unshift(cursor);
        cursor = prev.get(cursor);
      }
      return { path, distanceM: dist.get(goalStr) };
    }

    const neighbors = graph[current] || [];
    for (const edge of neighbors) {
      const neighbor = String(edge.to);
      const cost = _effectiveCost(edge, isMobilityImpaired);
      const newDist = (dist.get(current) || 0) + cost;

      if (!dist.has(neighbor) || newDist < dist.get(neighbor)) {
        dist.set(neighbor, newDist);
        prev.set(neighbor, current);
        open.set(neighbor, newDist); // heuristic = 0 (no coordinates needed)
      }
    }
  }

  return null; // no path
}

/**
 * Legacy API — keeps existing tests green.
 * findShortestPath(graph, source, destination) → { nodes, distanceMeters }
 *
 * Uses Dijkstra (no mobility weighting, no A* heuristic) to match original behaviour.
 */
function findShortestPath(graph, source, destination) {
  const dist = {};
  const prev = {};
  const unvisited = new Set(Object.keys(graph));

  for (const node of unvisited) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[source] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let best = Infinity;
    for (const node of unvisited) {
      if (dist[node] < best) { best = dist[node]; current = node; }
    }

    if (current === null || current === destination) break;
    unvisited.delete(current);

    for (const edge of graph[current] || []) {
      const alt = dist[current] + edge.cost;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = current;
      }
    }
  }

  if (dist[destination] === Infinity) {
    return { nodes: [], distanceMeters: Infinity };
  }

  const nodes = [];
  let cursor = destination;
  while (cursor) {
    nodes.unshift(cursor);
    cursor = prev[cursor];
  }

  return { nodes, distanceMeters: dist[destination] };
}

module.exports = { findShortestPath, aStar };
