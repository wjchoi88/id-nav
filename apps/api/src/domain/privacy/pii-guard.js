function sanitizePayload(payload) {
  const { phone, email, name, adId, ...rest } = payload;
  return rest;
}

module.exports = { sanitizePayload };
