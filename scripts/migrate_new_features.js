const pool = require('../src/config/db');

async function migrateNewFeatures() {
  console.log('🔄 Démarrage de la migration pour F15, F18, F19, F20, F21, F23...');
  const conn = await pool.getConnection();

  try {
    // 1. Table `supplier_orders` : Ajout des colonnes de remises
    console.log('📦 Mise à jour de la table supplier_orders...');
    const [colsOrders] = await conn.query('SHOW COLUMNS FROM `supplier_orders`');
    const existingColsOrders = colsOrders.map(c => c.Field);

    if (!existingColsOrders.includes('discount_type')) {
      await conn.query("ALTER TABLE `supplier_orders` ADD COLUMN `discount_type` ENUM('none', 'percentage', 'fixed') DEFAULT 'none' AFTER `shipping_cost`");
      console.log('  + Colonne discount_type ajoutée');
    }

    if (!existingColsOrders.includes('discount_value')) {
      await conn.query("ALTER TABLE `supplier_orders` ADD COLUMN `discount_value` DECIMAL(12,2) DEFAULT 0.00 AFTER `discount_type`");
      console.log('  + Colonne discount_value ajoutée');
    }

    if (!existingColsOrders.includes('discount_amount')) {
      await conn.query("ALTER TABLE `supplier_orders` ADD COLUMN `discount_amount` DECIMAL(12,2) DEFAULT 0.00 AFTER `discount_value`");
      console.log('  + Colonne discount_amount ajoutée');
    }

    // 2. Table `supplier_credits`
    console.log('📦 Création/vérification de la table supplier_credits...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`supplier_credits\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`company_id\` BIGINT UNSIGNED NOT NULL,
        \`supplier_id\` BIGINT UNSIGNED NOT NULL,
        \`reference\` VARCHAR(50) NOT NULL COMMENT 'AVO-YYYYMM-XXXX',
        \`amount\` DECIMAL(12,2) NOT NULL,
        \`remaining_amount\` DECIMAL(12,2) NOT NULL COMMENT 'Solde restant utilisable',
        \`reason\` VARCHAR(255) DEFAULT NULL,
        \`status\` ENUM('available', 'partially_used', 'used', 'canceled') DEFAULT 'available',
        \`origin_order_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT 'Commande d origine si lié',
        \`created_by\` BIGINT UNSIGNED DEFAULT NULL,
        \`notes\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_supplier_credit_ref\` (\`company_id\`, \`reference\`),
        KEY \`idx_sc_company_supplier\` (\`company_id\`, \`supplier_id\`),
        KEY \`idx_sc_status\` (\`company_id\`, \`status\`),
        KEY \`idx_sc_origin_order\` (\`origin_order_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  + Table supplier_credits prête');

    // 3. Table `supplier_credit_applications`
    console.log('📦 Création/vérification de la table supplier_credit_applications...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`supplier_credit_applications\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`company_id\` BIGINT UNSIGNED NOT NULL,
        \`supplier_credit_id\` BIGINT UNSIGNED NOT NULL,
        \`supplier_order_id\` BIGINT UNSIGNED NOT NULL,
        \`amount_applied\` DECIMAL(12,2) NOT NULL,
        \`applied_by\` BIGINT UNSIGNED DEFAULT NULL,
        \`applied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`notes\` TEXT DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_sca_credit\` (\`supplier_credit_id\`),
        KEY \`idx_sca_order\` (\`supplier_order_id\`),
        KEY \`idx_sca_company\` (\`company_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  + Table supplier_credit_applications prête');

    // 4. Table `notifications`
    console.log('📦 Création/vérification de la table notifications...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`company_id\` BIGINT UNSIGNED NOT NULL,
        \`user_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL = tous les membres concernés',
        \`type\` VARCHAR(100) NOT NULL COMMENT 'low_stock, sale_completed, debt_overdue, order_received, inventory_done, session_anomaly, stock_prediction_alert',
        \`title\` VARCHAR(200) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`severity\` ENUM('info', 'warning', 'critical') DEFAULT 'info',
        \`is_read\` TINYINT(1) DEFAULT 0,
        \`reference_type\` VARCHAR(50) DEFAULT NULL COMMENT 'product, sale, client_debt, supplier_order, inventory_count, cash_session',
        \`reference_id\` BIGINT UNSIGNED DEFAULT NULL,
        \`action_url\` VARCHAR(255) DEFAULT NULL,
        \`read_at\` DATETIME DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_notif_company_user\` (\`company_id\`, \`user_id\`),
        KEY \`idx_notif_read\` (\`company_id\`, \`is_read\`),
        KEY \`idx_notif_created\` (\`company_id\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  + Table notifications prête');

    // 5. Mise à jour des permissions dans la table `permissions`
    console.log('🔐 Mise à jour des permissions système...');
    const permissionsToAdd = [
      { code: 'journal.view', module: 'Comptabilité', name: 'Voir le journal des opérations', description: 'Consulter les flux financiers et le journal des opérations' },
      { code: 'stock_prediction.view', module: 'Stocks', name: 'Voir les prédictions de stock', description: 'Consulter les estimations d\'épuisement et de rupture de stock' },
      { code: 'supplier_credits.manage', module: 'Fournisseurs', name: 'Gérer les avoirs fournisseurs', description: 'Créer, consulter et appliquer les avoirs fournisseurs' },
      { code: 'receipt_settings.manage', module: 'Paramètres', name: 'Personnaliser le reçu', description: 'Configurer le modèle de ticket de caisse et l\'impression' },
      { code: 'notifications.view', module: 'Notifications', name: 'Consulter les notifications', description: 'Voir les alertes et notifications de l\'entreprise' }
    ];

    for (const p of permissionsToAdd) {
      const [existing] = await conn.query('SELECT id FROM permissions WHERE code = ?', [p.code]);
      if (existing.length === 0) {
        const [res] = await conn.query(
          'INSERT INTO permissions (code, module, name, description) VALUES (?, ?, ?, ?)',
          [p.code, p.module, p.name, p.description]
        );
        console.log(`  + Permission ajoutée: ${p.code} (ID: ${res.insertId})`);
      }
    }

    // Assigner ces permissions aux rôles "Propriétaire" et "Gérant" de toutes les entreprises
    const [allPerms] = await conn.query(
      'SELECT id, code FROM permissions WHERE code IN (?)',
      [permissionsToAdd.map(p => p.code)]
    );
    const [allAdminRoles] = await conn.query(
      "SELECT id, name, company_id FROM roles WHERE name IN ('Propriétaire', 'Gérant')"
    );

    for (const role of allAdminRoles) {
      for (const perm of allPerms) {
        const [exists] = await conn.query(
          'SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [role.id, perm.id]
        );
        if (exists.length === 0) {
          await conn.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [role.id, perm.id]
          );
        }
      }
    }
    console.log(`  + Permissions assignées aux rôles Propriétaire et Gérant pour ${allAdminRoles.length} rôles.`);

    // 6. Mise à jour de `subscription_plans.features`
    console.log('💳 Mise à jour des fonctionnalités dans subscription_plans...');
    const [plans] = await conn.query('SELECT id, code, features FROM subscription_plans');

    for (const plan of plans) {
      let features = {};
      try {
        features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
      } catch (e) {
        features = {};
      }

      if (plan.code === 'FREE') {
        features.journal = false;
        features.stock_prediction = false;
        features.receipt_customization = false;
        features.notifications = false;
      } else {
        // STANDARD, PREMIUM, UNLIMITED, ORG
        features.journal = true;
        features.stock_prediction = true;
        features.receipt_customization = true;
        features.notifications = true;
      }

      await conn.query(
        'UPDATE subscription_plans SET features = ? WHERE id = ?',
        [JSON.stringify(features), plan.id]
      );
      console.log(`  + Plan ${plan.code}: features mis à jour`);
    }

    console.log('✅ Migration des nouvelles fonctionnalités terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    conn.release();
  }
}

migrateNewFeatures()
  .then(() => {
    console.log('🎉 Terminé.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
  });
