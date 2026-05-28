require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur di .env.');
  }

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  await client.query(schema);
  await client.end();

  console.log('Database schema Electra Tech berhasil disiapkan.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
