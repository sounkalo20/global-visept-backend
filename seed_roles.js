const pool = require('./src/config/db');

async function run() {
  try {
    const [[perm_open_close]] = await pool.query("SELECT id FROM permissions WHERE code = 'cash.sessions.manage' LIMIT 1");
    const [[perm_registers]] = await pool.query("SELECT id FROM permissions WHERE code = 'cash.registers.manage' LIMIT 1");
    const [[perm_sessions]] = await pool.query("SELECT id FROM permissions WHERE code = 'cash.sessions.view' LIMIT 1");

    const [caissiers] = await pool.query("SELECT id FROM roles WHERE name = 'Caissier'");
    for (const caissier of caissiers) {
      if (perm_open_close) {
        await pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [caissier.id, perm_open_close.id]);
      }
    }

    const [proprietaires] = await pool.query("SELECT id FROM roles WHERE name = 'Propriétaire'");
    for (const prop of proprietaires) {
      if (perm_open_close) await pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [prop.id, perm_open_close.id]);
      if (perm_registers) await pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [prop.id, perm_registers.id]);
      if (perm_sessions) await pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [prop.id, perm_sessions.id]);
    }
    
    console.log("Permissions seeded successfully for all companies.");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

run();
