const test = require('node:test');
const assert = require('node:assert/strict');
const { startSessionFromQr } = require('../src/features/session/qr-start');

test('starts session when qr payload is valid', () => {
  const now = '2026-03-06T07:00:00.000Z';
  const session = startSessionFromQr({ anchorId: 'entry-a', tenantId: 'mall-1' }, now);
  assert.equal(session.anchorId, 'entry-a');
  assert.equal(session.tenantId, 'mall-1');
  assert.equal(session.startedAt, now);
});
