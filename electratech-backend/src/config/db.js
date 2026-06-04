// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Memastikan koneksi otomatis terputus jika idle terlalu lama 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000,
});

// Verifikasi koneksi saat aplikasi pertama kali menyala
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Gagal terhubung ke PostgreSQL:', err.message);
  } else {
    console.log('✅ PostgreSQL Terhubung pada:', res.rows[0].now);
  }
});

module.exports = pool;
