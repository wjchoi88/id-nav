function startSessionFromQr(payload, nowIso) {
  if (!payload || !payload.anchorId || !payload.tenantId) {
    throw new Error('invalid qr payload');
  }

  return {
    sessionId: `${payload.tenantId}-${payload.anchorId}-${Date.now()}`,
    tenantId: payload.tenantId,
    anchorId: payload.anchorId,
    startedAt: nowIso
  };
}

module.exports = { startSessionFromQr };
