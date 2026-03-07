'use strict';

async function scanRoutes(fastify) {
  fastify.get('/scan/:anchorCode', async (request, reply) => {
    const { anchorCode } = request.params;
    const { session } = request.query;
    const { pool } = require('../db/pool');
    const { rows } = await pool.query('SELECT id FROM anchors WHERE anchor_code = $1', [anchorCode]);
    if (rows.length === 0) {
      return reply.code(404).type('text/html').send('<h1>유효하지 않은 QR 코드입니다</h1>');
    }
    const qs = session ? `anchor=${anchorCode}&session=${session}` : `anchor=${anchorCode}`;
    return reply.redirect(`/?${qs}`);
  });
}

module.exports = scanRoutes;
