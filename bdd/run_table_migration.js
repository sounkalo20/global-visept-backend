require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bdiadec-db',
    multipleStatements: true,
  });

  console.log('Exécution des DDL restaurant_spaces, restaurant_tables et table_session_logs...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS restaurant_spaces (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_spaces_company (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const addCol = async (sql) => {
    try {
      await conn.query(sql);
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('Info column:', e.message);
      }
    }
  };

  await addCol('ALTER TABLE restaurant_tables ADD COLUMN space_id BIGINT UNSIGNED NULL AFTER company_id');
  await addCol("ALTER TABLE restaurant_tables ADD COLUMN shape ENUM('square', 'round', 'rectangle') NOT NULL DEFAULT 'square' AFTER capacity");
  await addCol('ALTER TABLE restaurant_tables ADD COLUMN width INT NOT NULL DEFAULT 80 AFTER position_y');
  await addCol('ALTER TABLE restaurant_tables ADD COLUMN height INT NOT NULL DEFAULT 80 AFTER width');

  await conn.query("ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('available', 'occupied', 'bill_requested', 'needs_cleaning', 'reserved', 'out_of_service') NOT NULL DEFAULT 'available'");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS table_session_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      table_session_id BIGINT UNSIGNED NOT NULL,
      action_type ENUM('opened', 'order_added', 'bill_requested', 'transferred', 'merged', 'paid', 'cleaned', 'reserved') NOT NULL,
      source_table_id BIGINT UNSIGNED NULL,
      target_table_id BIGINT UNSIGNED NULL,
      staff_id BIGINT UNSIGNED NOT NULL,
      details JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tsl_session (table_session_id),
      INDEX idx_tsl_company (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ Migration Tables & Spaces REUSSIE !');
  await conn.end();
  process.exit(0);
})().catch((e) => {
  console.error('ERREUR:', e.message);
  process.exit(1);
});
