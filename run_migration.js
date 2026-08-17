const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visept_db',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'bdd', 'update_caisse_rbac.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    for (let stmt of statements) {
      if (stmt.trim()) {
        console.log('Executing:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
        await connection.query(stmt);
      }
    }
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

run();
