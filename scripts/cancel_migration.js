const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bdiadec-db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log("Starting database migration for warehouse_movements...");

    const [cols] = await connection.query(`SHOW COLUMNS FROM warehouse_movements LIKE 'is_cancelled'`);
    if (cols.length === 0) {
      console.log("Adding is_cancelled to warehouse_movements...");
      await connection.query(`ALTER TABLE warehouse_movements ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE`);
      console.log("is_cancelled column added.");
    } else {
      console.log("is_cancelled column already exists.");
    }

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

runMigration();
