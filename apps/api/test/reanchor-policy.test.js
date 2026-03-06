const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequestReanchor } = require('../src/domain/location/reanchor-policy');

test('requests reanchor when drift risk is high', () => {
  assert.equal(
    shouldRequestReanchor({
      distanceFromLastAnchorMeters: 95,
      secFromLastAnchor: 150,
      headingStabilityScore: 0.3,
      cooldownSec: 0
    }),
    true
  );
});

test('does not request reanchor during cooldown', () => {
  assert.equal(
    shouldRequestReanchor({
      distanceFromLastAnchorMeters: 95,
      secFromLastAnchor: 150,
      headingStabilityScore: 0.3,
      cooldownSec: 10
    }),
    false
  );
});
