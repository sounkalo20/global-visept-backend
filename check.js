const pool = require('./src/config/db');

async function check() {
  try {
    const [roles] = await pool.query("SELECT * FROM role_permissions rp JOIN roles r ON rp.role_id = r.id JOIN permissions p ON rp.permission_id = p.id WHERE r.name = 'Caissier'");
    console.log(roles);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

check();
