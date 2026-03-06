const test = require('node:test');
const assert = require('node:assert/strict');
const { findShortestPath } = require('../src/domain/navigation/a-star');

test('returns shortest path and distance', () => {
  const graph = {
    N1: [{ to: 'N2', cost: 5 }, { to: 'N3', cost: 2 }],
    N2: [{ to: 'N4', cost: 3 }],
    N3: [{ to: 'N4', cost: 10 }],
    N4: []
  };

  const result = findShortestPath(graph, 'N1', 'N4');
  assert.deepEqual(result.nodes, ['N1', 'N2', 'N4']);
  assert.equal(result.distanceMeters, 8);
});
