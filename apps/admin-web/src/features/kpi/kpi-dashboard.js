function toKpiCards(input) {
  return [
    { label: '도착 성공률', value: `${input.arrivalSuccessRate}%` },
    { label: '재탐색 빈도', value: `${input.rerouteRate}%` }
  ];
}

module.exports = { toKpiCards };
