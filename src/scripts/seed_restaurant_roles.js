const pool = require('../config/db');

async function seedRestaurantRoles() {
  try {
    console.log('🚀 Démarrage du seed des rôles système Restaurant...');

    // Sélectionner toutes les entreprises ayant du contenu restaurant ou business_type_id = 2
    const [companies] = await pool.query(
      "SELECT id, name FROM companies WHERE deleted_at IS NULL"
    );

    for (const company of companies) {
      const companyId = company.id;

      // 1. Rôle Serveur
      const [existingWaiter] = await pool.query(
        "SELECT id FROM roles WHERE company_id = ? AND name = 'Serveur'",
        [companyId]
      );
      if (existingWaiter.length === 0) {
        const [res] = await pool.query(
          "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, 'Serveur', 'Service en salle et prise de commande', 1)",
          [companyId]
        );
        const roleId = res.insertId;
        const [perms] = await pool.query("SELECT id FROM permissions WHERE code IN ('tables.view', 'tables.open', 'sales.create', 'sales.view', 'sales.edit')");
        if (perms.length > 0) {
          await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?', [perms.map(p => [roleId, p.id])]);
        }
        console.log(`✅ Rôle Serveur créé pour ${company.name}`);
      }

      // 2. Rôle Cuisinier
      const [existingCook] = await pool.query(
        "SELECT id FROM roles WHERE company_id = ? AND name = 'Cuisinier'",
        [companyId]
      );
      if (existingCook.length === 0) {
        const [res] = await pool.query(
          "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, 'Cuisinier', 'Gestion de l écran cuisine KDS', 1)",
          [companyId]
        );
        const roleId = res.insertId;
        const [perms] = await pool.query("SELECT id FROM permissions WHERE code IN ('kitchen.view', 'kitchen.manage', 'products.view')");
        if (perms.length > 0) {
          await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?', [perms.map(p => [roleId, p.id])]);
        }
        console.log(`✅ Rôle Cuisinier créé pour ${company.name}`);
      }

      // 3. Rôle Barman
      const [existingBartender] = await pool.query(
        "SELECT id FROM roles WHERE company_id = ? AND name = 'Barman'",
        [companyId]
      );
      if (existingBartender.length === 0) {
        const [res] = await pool.query(
          "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, 'Barman', 'Gestion des consommations et bar', 1)",
          [companyId]
        );
        const roleId = res.insertId;
        const [perms] = await pool.query("SELECT id FROM permissions WHERE code IN ('kitchen.view', 'kitchen.manage', 'products.view')");
        if (perms.length > 0) {
          await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?', [perms.map(p => [roleId, p.id])]);
        }
        console.log(`✅ Rôle Barman créé pour ${company.name}`);
      }
    }

    console.log('🎉 Seed des rôles système restaurant accompli avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du seed des rôles restaurant:', err);
    process.exit(1);
  }
}

seedRestaurantRoles();
