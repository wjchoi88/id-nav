const test = require('node:test');
const assert = require('node:assert/strict');
const { handleApiRequest } = require('../src/server');

test('POST /api/navigation/path returns shortest path', async () => {
  const res = handleApiRequest('POST', '/api/navigation/path', {
    graph: {
      A: [{ to: 'B', cost: 5 }, { to: 'C', cost: 1 }],
      B: [{ to: 'D', cost: 1 }],
      C: [{ to: 'D', cost: 10 }],
      D: []
    },
    source: 'A',
    destination: 'D'
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.nodes, ['A', 'B', 'D']);
  assert.equal(res.body.distanceMeters, 6);
});

test('POST /api/session/terminate evaluates hybrid termination rule', async () => {
  const res = handleApiRequest('POST', '/api/session/terminate', {
    outsideMeters: 66,
    outsideDurationSec: 35,
    gpsAccuracyMeters: 9,
    isReentered: false
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.terminate, true);
});

test('POST /api/privacy/sanitize removes pii', async () => {
  const res = handleApiRequest('POST', '/api/privacy/sanitize', {
    phone: '010',
    email: 'x@y.com',
    destination: 'gate'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.phone, undefined);
  assert.equal(res.body.destination, 'gate');
});
