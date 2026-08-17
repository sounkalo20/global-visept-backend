const pool = require('../src/config/db');

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connexion DB établie.');

    // 1. Création de la table company_subscription_history
    console.log('Création de la table company_subscription_history...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS company_subscription_history (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT UNSIGNED NOT NULL,
        plan_id TINYINT UNSIGNED NOT NULL,
        action ENUM('new_subscription', 'renewed', 'upgraded', 'downgraded', 'expired', 'canceled') NOT NULL,
        started_at DATETIME NOT NULL,
        ends_at DATETIME,
        price_paid DECIMAL(12,2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'XOF',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table company_subscription_history créée ou déjà existante.');

    // 2. Initialisation des features JSON pour les plans existants
    console.log('Mise à jour des features des plans existants...');
    
    const [plans] = await connection.query('SELECT id, name, features FROM subscription_plans');
    
    for (let plan of plans) {
      let currentFeatures = {};
      try {
        if (plan.features) {
          currentFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
        }
      } catch (e) {
        currentFeatures = {};
      }

      if (plan.id === 1 || plan.name.toLowerCase().includes('gratuit') || plan.name.toLowerCase().includes('free')) {
        currentFeatures = {
          ...currentFeatures,
          module_returns: false,
          module_employees: false,
          module_warehouses: false,
          advanced_reports: false
        };
      } else {
        currentFeatures = {
          ...currentFeatures,
          module_returns: true,
          module_employees: true,
          module_warehouses: true,
          advanced_reports: true
        };
      }

      await connection.query(
        'UPDATE subscription_plans SET features = ? WHERE id = ?',
        [JSON.stringify(currentFeatures), plan.id]
      );
    }
    console.log('Features mises à jour.');

    console.log('Migration terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrate();
