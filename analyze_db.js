const pool = require('./src/config/db');
async function analyze() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Tables:', tableNames.join(', '));
    
    const relevantTables = tableNames.filter(t => t.includes('user') || t.includes('employe') || t.includes('role') || t.includes('permission') || t.includes('compan') || t.includes('member'));
    console.log('\nRelevant Tables:', relevantTables.join(', '));

    for (const t of relevantTables) {
      const [cols] = await pool.query('SHOW COLUMNS FROM ' + t);
      console.log('\nTable: ' + t);
      console.log(cols.map(c => '  ' + c.Field + ' (' + c.Type + ')').join('\n'));
    }
  } catch(e) { console.error(e); } finally { process.exit(0); }
}
analyze();
