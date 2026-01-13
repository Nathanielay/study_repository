const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const url = process.env.MYSQL_URL;
  if (!url) {
    throw new Error('MYSQL_URL is not set');
  }

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_progress_tables.sql');
  const content = fs.readFileSync(sqlPath, 'utf8');

  const statements = content
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  const connection = await mysql.createConnection(url);
  try {
    for (const statement of statements) {
      await connection.execute(statement);
    }
  } finally {
    await connection.end();
  }

  console.log('Migrations applied.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
