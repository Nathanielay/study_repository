const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const url = process.env.MYSQL_URL;
  if (!url) {
    throw new Error('MYSQL_URL is not set');
  }

  const connection = await mysql.createConnection(url);
  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const content = fs.readFileSync(sqlPath, 'utf8');
      const statements = content
        .split(/;\s*\n/)
        .map((stmt) => stmt.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await connection.execute(statement);
      }
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
