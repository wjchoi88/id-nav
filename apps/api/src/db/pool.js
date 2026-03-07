'use strict';

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });

const isDocker = process.env.NODE_ENV === 'production' || process.env.DB_HOST === 'idnav-db';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (isDocker ? '5432' : '5433'), 10),
  database: process.env.DB_NAME || 'idnav',
  user: process.env.DB_USER || 'idnav',
  password: process.env.DB_PASSWORD || 'idnav_dev',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[pool] unexpected error on idle client', err.message);
});

module.exports = { pool };
