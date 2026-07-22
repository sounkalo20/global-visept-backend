require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'visept_db',
      multipleStatements: true
    });

    const sqlPath = path.join(__dirname, 'bdd', 'returns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL...');
    await connection.query(sql);
    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

run();
