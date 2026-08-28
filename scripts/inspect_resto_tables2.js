require('dotenv').config();
const pool = require('../src/config/db');

async function inspectMoreTables() {
  const tables = ['product_compositions', 'product_variants', 'sales', 'sale_items', 'products'];
  for (const t of tables) {
    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${t}\``);
    console.log(`\nTable: ${t}`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  }
  process.exit(0);
}

inspectMoreTables();
