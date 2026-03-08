'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const path = require('path');
const fastify = require('fastify')({ logger: true });

// plugins
fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../../mobile-web/public'),
  prefix: '/',
  decorateReply: false
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../../admin-web/public'),
  prefix: '/admin/',
  decorateReply: false
});
fastify.register(require('@fastify/cookie'));

// routes
fastify.register(require('./routes/scan'));
fastify.register(require('./routes/navigation'));
fastify.register(require('./routes/session'));
fastify.register(require('./routes/admin'));

// admin redirect: /admin → /admin/login.html
fastify.get('/admin', async (req, reply) => reply.redirect('/admin/login.html'));

// test page: /test → /test.html
fastify.get('/test', async (req, reply) => reply.redirect('/test.html'));

// health
fastify.get('/health', async () => ({ ok: true }));

// start — only bind when this file is the direct entry point
if (require.main === module) {
  const PORT = parseInt(process.env.PORT || '3100', 10);
  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) { fastify.log.error(err); process.exit(1); }
  });
}

// Legacy export kept for unit tests (server-routes.test.js)
const { findShortestPath } = require('./domain/navigation/a-star');
const { shouldTerminateSession } = require('./domain/session/session-termination');
const { sanitizePayload } = require('./domain/privacy/pii-guard');

function handleApiRequest(method, url, body) {
  if (method === 'POST' && url === '/api/navigation/path') {
    return {
      status: 200,
      body: findShortestPath(body.graph || {}, body.source, body.destination)
    };
  }
  if (method === 'POST' && url === '/api/session/terminate') {
    return {
      status: 200,
      body: { terminate: shouldTerminateSession(body) }
    };
  }
  if (method === 'POST' && url === '/api/privacy/sanitize') {
    return {
      status: 200,
      body: sanitizePayload(body)
    };
  }
  return { status: 404, body: { error: 'not found' } };
}

module.exports = { fastify, handleApiRequest };
