const http = require('node:http');
const { findShortestPath } = require('./domain/navigation/a-star');
const { shouldTerminateSession } = require('./domain/session/session-termination');
const { sanitizePayload } = require('./domain/privacy/pii-guard');

function sendJson(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

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

  return {
    status: 404,
    body: { error: 'not found' }
  };
}

function createApiServer() {
  return http.createServer(async (req, res) => {
    try {
      const body = await readJsonBody(req);
      const result = handleApiRequest(req.method, req.url, body);
      return sendJson(res, result.status, result.body);
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  });
}

module.exports = { createApiServer, handleApiRequest };
