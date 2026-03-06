const test = require('node:test');
const assert = require('node:assert/strict');
const { createEstimator } = require('../src/features/location/pdr-estimator');

test('updates distance and heading from sample input', () => {
  const est = createEstimator();
  est.pushSample({ steps: 4, stepLengthMeters: 0.7, headingDeltaDeg: 15 });
  assert.equal(est.state.distanceMeters, 2.8);
  assert.equal(est.state.headingDeg, 15);
});
