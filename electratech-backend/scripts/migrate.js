const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('🚀 Menjalankan skrip migrasi skema database...');
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`  ✅ Tabel/Skema berhasil diperbarui: ${file}`);
    }
  }
  console.log('🎉 Proses migrasi tabel selesai.');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('❌ Migrasi gagal dilakukan:', err);
  process.exit(1);
});
