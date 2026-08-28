require('dotenv').config();
const pool = require('../src/config/db');

async function inspectDb() {
  const [tables] = await pool.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('--- ALL DB TABLES ---');
  console.log(tableNames.join(', '));

  // Check tables related to restaurant
  const restoKeywords = ['table', 'restaurant', 'recipe', 'ingredient', 'kitchen', 'order', 'menu', 'modifier', 'dish', 'booking', 'reservation'];
  const matched = tableNames.filter(t => restoKeywords.some(k => t.toLowerCase().includes(k)));
  console.log('\n--- MATCHED RESTO TABLES ---');
  console.log(matched);

  for (const t of matched) {
    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${t}\``);
    console.log(`\nTable: ${t}`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  }

  // Also check business types
  const [bts] = await pool.query('SELECT * FROM business_types');
  console.log('\n--- BUSINESS TYPES ---');
  console.log(bts);

  process.exit(0);
}

inspectDb();
