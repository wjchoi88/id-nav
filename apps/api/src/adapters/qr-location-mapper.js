function mapLocationRow(row) {
  return {
    anchorId: String(row.id),
    tenantId: `building-${row.building_id}`,
    sectionCode: row.section_id,
    floor: row.floor || null,
    label: row.place_description || row.place_name || row.address || 'unknown',
    lat: row.gps_latitude ?? null,
    lng: row.gps_longitude ?? null
  };
}

function mapScanLogRow(row) {
  return {
    eventId: String(row.id),
    type: 'qr_scan',
    anchorId: String(row.location_id),
    sessionId: row.session_id || null,
    timestamp: row.scan_time,
    gpsAccuracy: row.gps_accuracy ?? null
  };
}

function mapLiveLocationRow(row) {
  return {
    anchorId: String(row.location_id),
    sessionId: row.session_id,
    position: {
      lat: row.latitude,
      lng: row.longitude
    },
    updatedAt: row.updated_at
  };
}

module.exports = {
  mapLocationRow,
  mapScanLogRow,
  mapLiveLocationRow
};
