const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runSeeders() {
  const seedersDir = path.join(__dirname, '../database/seeders');
  const files = fs.readdirSync(seedersDir).sort();

  console.log('🌱 Menjalankan skrip pengisian data awal (seeder)...');
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(seedersDir, file), 'utf8');
      await pool.query(sql);
      console.log(`  🌱 Data seeder berhasil dimasukkan: ${file}`);
    }
  }
  console.log('🎉 Pengisian data awal (seeder) selesai.');
  await pool.end();
}

runSeeders().catch((err) => {
  console.error('❌ Pengisian seeder gagal dilakukan:', err);
  process.exit(1);
});
