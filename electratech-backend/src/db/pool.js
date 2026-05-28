const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL belum diatur. Salin .env.example ke .env lalu sesuaikan koneksi PostgreSQL.');
}

const pool = new Pool({
  connectionString,
});

module.exports = pool;
