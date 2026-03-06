const test = require('node:test');
const assert = require('node:assert/strict');
const { toKpiCards } = require('../src/features/kpi/kpi-dashboard');

test('renders required mvp kpi labels', () => {
  const cards = toKpiCards({ arrivalSuccessRate: 91.2, rerouteRate: 13.1 });
  const labels = cards.map((c) => c.label);
  assert.deepEqual(labels, ['도착 성공률', '재탐색 빈도']);
});
