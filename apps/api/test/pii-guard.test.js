const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePayload } = require('../src/domain/privacy/pii-guard');

test('drops pii fields from payload', () => {
  const sanitized = sanitizePayload({
    phone: '010',
    email: 'a@b.com',
    name: 'kim',
    route: [{ x: 1, y: 1 }],
    destination: 'gate-a'
  });

  assert.equal(Object.hasOwn(sanitized, 'phone'), false);
  assert.equal(Object.hasOwn(sanitized, 'email'), false);
  assert.equal(Object.hasOwn(sanitized, 'name'), false);
  assert.equal(sanitized.destination, 'gate-a');
});
