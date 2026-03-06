function shouldRequestReanchor(input) {
  const {
    distanceFromLastAnchorMeters,
    secFromLastAnchor,
    headingStabilityScore,
    cooldownSec = 0
  } = input;

  if (cooldownSec > 0) return false;

  return (
    distanceFromLastAnchorMeters >= 80 ||
    secFromLastAnchor >= 120 ||
    headingStabilityScore < 0.5
  );
}

module.exports = { shouldRequestReanchor };
