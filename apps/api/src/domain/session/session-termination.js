function shouldTerminateSession(input) {
  const {
    outsideMeters,
    outsideDurationSec,
    gpsAccuracyMeters,
    isReentered
  } = input;

  if (isReentered && outsideMeters <= 50) return false;
  if (gpsAccuracyMeters > 30) return false;

  return outsideMeters >= 60 && outsideDurationSec >= 30;
}

module.exports = { shouldTerminateSession };
