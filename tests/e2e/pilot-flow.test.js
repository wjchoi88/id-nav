'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Pilot scenario: QR scan → navigate → session terminate → admin KPI
// Imports will fail until implementation is in place
const { startSessionFromQr } = require('../../apps/mobile-web/src/features/session/qr-start');
const { handleApiRequest } = require('../../apps/api/src/server');
const { toKpiCards } = require('../../apps/admin-web/src/features/kpi/kpi-dashboard');
const { shouldTerminateSession } = require('../../apps/api/src/domain/session/session-termination');

test('pilot: qr start creates valid session', () => {
  const session = startSessionFromQr(
    { tenantId: 'mall-a', anchorId: 'QR-01' },
    new Date().toISOString()
  );
  assert.ok(session.sessionId.startsWith('mall-a-QR-01-'));
  assert.equal(session.tenantId, 'mall-a');
});

test('pilot: navigation path returns route from anchor to destination', () => {
  const res = handleApiRequest('POST', '/api/navigation/path', {
    graph: {
      'QR-01': [{ to: 'HALL', cost: 10 }, { to: 'FOOD', cost: 3 }],
      HALL: [{ to: 'EXIT', cost: 5 }],
      FOOD: [{ to: 'EXIT', cost: 8 }],
      EXIT: []
    },
    source: 'QR-01',
    destination: 'EXIT'
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.nodes.length > 1, 'path must have more than one node');
  assert.equal(res.body.nodes[0], 'QR-01');
  assert.equal(res.body.nodes[res.body.nodes.length - 1], 'EXIT');
});

test('pilot: session terminates when user leaves building', () => {
  const shouldTerminate = shouldTerminateSession({
    outsideMeters: 80,
    outsideDurationSec: 40,
    gpsAccuracyMeters: 6,
    isReentered: false
  });
  assert.equal(shouldTerminate, true);
});

test('pilot: admin kpi dashboard shows required mvp metrics', () => {
  const cards = toKpiCards({ arrivalSuccessRate: 90, rerouteRate: 10 });
  const labels = cards.map(c => c.label);
  assert.ok(labels.includes('도착 성공률'), '도착 성공률 KPI missing');
  assert.ok(labels.includes('재탐색 빈도'), '재탐색 빈도 KPI missing');
});

test('pilot: pii is stripped before persistence', () => {
  const res = handleApiRequest('POST', '/api/privacy/sanitize', {
    phone: '010-1234-5678',
    email: 'user@mall.com',
    sessionId: 'mall-a-QR-01-123',
    destination: 'EXIT'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.phone, undefined);
  assert.equal(res.body.email, undefined);
  assert.equal(res.body.sessionId, 'mall-a-QR-01-123');
  assert.equal(res.body.destination, 'EXIT');
});
