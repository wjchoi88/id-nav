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
      if (dist[node] < best) {
        best = dist[node];
        current = node;
      }
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

module.exports = { findShortestPath };
