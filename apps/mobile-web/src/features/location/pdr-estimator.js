function createEstimator() {
  const state = {
    distanceMeters: 0,
    headingDeg: 0
  };

  return {
    state,
    pushSample(sample) {
      state.distanceMeters = Number((state.distanceMeters + (sample.steps * sample.stepLengthMeters)).toFixed(2));
      state.headingDeg = Number((state.headingDeg + sample.headingDeltaDeg).toFixed(2));
    }
  };
}

module.exports = { createEstimator };
