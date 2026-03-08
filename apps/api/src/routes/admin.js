'use strict';
const { pool } = require('../db/pool');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const QRCode = require('qrcode');

const QR_HMAC_KEY = process.env.QR_HMAC_KEY || 'idnav_qr_hmac_key_change_in_production';
const QR_BASE_URL = process.env.QR_BASE_URL || 'https://id-nav.databuilder.co.kr';

// HMAC 서명
function signAnchor(anchorCode) {
  return crypto.createHmac('sha256', QR_HMAC_KEY).update(anchorCode).digest('hex');
}

async function adminRoutes(fastify) {
  // 인증 미들웨어
  function requireAdmin(request, reply, done) {
    if (!request.cookies?.idnav_admin) return reply.code(401).send({ error: '인증 필요' });
    try {
      const data = JSON.parse(Buffer.from(request.cookies.idnav_admin, 'base64').toString());
      if (data.isAdmin !== true) return reply.code(401).send({ error: '인증 필요' });
      done();
    } catch { reply.code(401).send({ error: '인증 필요' }); }
  }

  // POST /api/admin/login
  fastify.post('/api/admin/login', async (request, reply) => {
    const { username, password } = request.body || {};
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (rows.length === 0) return reply.code(401).send({ error: '아이디 또는 비밀번호가 틀렸습니다' });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return reply.code(401).send({ error: '아이디 또는 비밀번호가 틀렸습니다' });
    const token = Buffer.from(JSON.stringify({ isAdmin: true, username })).toString('base64');
    reply.setCookie('idnav_admin', token, { path: '/', httpOnly: true, sameSite: 'lax' });
    return { ok: true };
  });

  // GET /api/admin/logout
  fastify.get('/api/admin/logout', async (request, reply) => {
    reply.clearCookie('idnav_admin', { path: '/' });
    return reply.redirect('/admin/login.html');
  });

  // GET /api/admin/anchors
  fastify.get('/api/admin/anchors', { preHandler: requireAdmin }, async () => {
    const { rows } = await pool.query(
      'SELECT id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y, is_exit, is_elevator, is_destination, destination_category, qr_url, created_at FROM anchors ORDER BY floor, anchor_code'
    );
    return rows;
  });

  // POST /api/admin/anchors
  fastify.post('/api/admin/anchors', { preHandler: requireAdmin }, async (request, reply) => {
    const { anchorCode, label, floor, mapX, mapY, elevX, elevY, isExit, isElevator, isDestination, destinationCategory } = request.body || {};
    if (!anchorCode || !label || !floor) return reply.code(400).send({ error: 'anchorCode, label, floor 필수' });
    const sig = signAnchor(anchorCode);
    const qrUrl = `${QR_BASE_URL}/scan/${anchorCode}`;
    const qrSvg = await QRCode.toString(qrUrl, { type: 'svg' });
    const { rows } = await pool.query(
      `INSERT INTO anchors (anchor_code, label, floor, map_x, map_y, elev_x, elev_y, is_exit, is_elevator, is_destination, destination_category, qr_url, qr_hmac_sig, qr_code_svg)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, anchor_code, label, floor, qr_url`,
      [anchorCode, label, floor, mapX||0, mapY||0, elevX||0, elevY||0,
       !!isExit, !!isElevator, !!isDestination, destinationCategory||null, qrUrl, sig, qrSvg]
    );
    return { anchor: rows[0], qrUrl, qrSvg };
  });

  // DELETE /api/admin/anchors/:id
  fastify.delete('/api/admin/anchors/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    await pool.query('DELETE FROM nav_graph_edges WHERE from_anchor_id=$1 OR to_anchor_id=$1', [id]);
    const { rowCount } = await pool.query('DELETE FROM anchors WHERE id=$1', [id]);
    if (rowCount === 0) return reply.code(404).send({ error: 'not found' });
    return { ok: true };
  });

  // GET /api/admin/anchors/:id/qr
  fastify.get('/api/admin/anchors/:id/qr', { preHandler: requireAdmin }, async (request, reply) => {
    const { rows } = await pool.query('SELECT anchor_code, qr_code_svg FROM anchors WHERE id=$1', [request.params.id]);
    if (rows.length === 0) return reply.code(404).send({ error: 'not found' });
    if (!rows[0].qr_code_svg) {
      // regenerate
      const sig = signAnchor(rows[0].anchor_code);
      const qrUrl = `${QR_BASE_URL}/scan/${rows[0].anchor_code}`;
      const qrSvg = await QRCode.toString(qrUrl, { type: 'svg' });
      await pool.query('UPDATE anchors SET qr_code_svg=$1, qr_hmac_sig=$2, qr_url=$3 WHERE id=$4', [qrSvg, sig, qrUrl, request.params.id]);
      return reply.type('image/svg+xml').send(qrSvg);
    }
    return reply.type('image/svg+xml').send(rows[0].qr_code_svg);
  });

  // GET /api/admin/sessions/stats (최근 7일)
  fastify.get('/api/admin/sessions/stats', { preHandler: requireAdmin }, async () => {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total_sessions,
        COUNT(arrived_at) AS arrived_count,
        ROUND(COUNT(arrived_at)::numeric / NULLIF(COUNT(*),0) * 100, 1) AS arrival_rate,
        ROUND(AVG(EXTRACT(EPOCH FROM (arrived_at - created_at))/60)::numeric, 1) AS avg_minutes
      FROM nav_sessions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const anchorStats = await pool.query(`
      SELECT floor, COUNT(*) AS cnt FROM anchors GROUP BY floor ORDER BY floor
    `);
    const totalAnchors = await pool.query('SELECT COUNT(*) AS cnt FROM anchors');
    const s = rows[0];
    return {
      totalSessions: Number(s.total_sessions),
      arrivedSessions: Number(s.arrived_count),
      arrivalSuccessRate: s.arrival_rate != null ? Number(s.arrival_rate) : null,
      avgDurationSeconds: s.avg_minutes != null ? Number(s.avg_minutes) * 60 : null,
      anchors: {
        total: totalAnchors.rows[0].cnt,
        byFloor: anchorStats.rows
      }
    };
  });

  // GET /api/admin/sessions (목록)
  fastify.get('/api/admin/sessions', { preHandler: requireAdmin }, async () => {
    const { rows } = await pool.query(`
      SELECT s.id, s.is_mobility_impaired, s.created_at, s.arrived_at,
        sa.anchor_code AS start_anchor_id, sa.label AS start_anchor_label,
        da.anchor_code AS destination_anchor_id, da.label AS destination_anchor_label,
        ROUND(EXTRACT(EPOCH FROM (s.arrived_at - s.created_at))/60::numeric, 1) AS duration_min
      FROM nav_sessions s
      LEFT JOIN anchors sa ON sa.id = s.start_anchor_id
      LEFT JOIN anchors da ON da.id = s.destination_anchor_id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);
    return rows;
  });
}

module.exports = adminRoutes;
