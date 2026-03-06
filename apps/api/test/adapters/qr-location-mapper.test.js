const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mapLocationRow,
  mapScanLogRow,
  mapLiveLocationRow
} = require('../../src/adapters/qr-location-mapper');

test('maps qr-location Location row to mvp anchor', () => {
  const mapped = mapLocationRow({
    id: 12,
    building_id: 3,
    section_id: 'B1-A-03',
    floor: 'B1',
    place_description: '지하주차장 A-03',
    gps_latitude: 37.123,
    gps_longitude: 127.456
  });

  assert.deepEqual(mapped, {
    anchorId: '12',
    tenantId: 'building-3',
    sectionCode: 'B1-A-03',
    floor: 'B1',
    label: '지하주차장 A-03',
    lat: 37.123,
    lng: 127.456
  });
});

test('maps qr-location ScanLog row to mvp event', () => {
  const mapped = mapScanLogRow({
    id: 100,
    location_id: 12,
    scan_time: '2026-03-06T01:00:00Z',
    session_id: 'abc',
    gps_accuracy: 12.3
  });

  assert.equal(mapped.type, 'qr_scan');
  assert.equal(mapped.anchorId, '12');
  assert.equal(mapped.sessionId, 'abc');
});

test('maps qr-location LiveLocation row to mvp tracking point', () => {
  const mapped = mapLiveLocationRow({
    location_id: 12,
    session_id: 'abc',
    latitude: 37.11,
    longitude: 127.77,
    updated_at: '2026-03-06T01:01:00Z'
  });

  assert.equal(mapped.anchorId, '12');
  assert.equal(mapped.sessionId, 'abc');
  assert.equal(mapped.position.lat, 37.11);
});
