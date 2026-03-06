const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldTerminateSession } = require('../src/domain/session/session-termination');

test('terminates when outside threshold long enough with good gps accuracy', () => {
  const terminate = shouldTerminateSession({
    outsideMeters: 68,
    outsideDurationSec: 45,
    gpsAccuracyMeters: 8,
    isReentered: false
  });
  assert.equal(terminate, true);
});

test('does not terminate when gps accuracy is poor', () => {
  const terminate = shouldTerminateSession({
    outsideMeters: 70,
    outsideDurationSec: 50,
    gpsAccuracyMeters: 80,
    isReentered: false
  });
  assert.equal(terminate, false);
});
