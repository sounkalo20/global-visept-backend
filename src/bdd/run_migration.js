/**
 * Script de migration FIABLE pour le module d'inventaire physique
 * Execute: node src/bdd/run_migration.js
 */
const pool = require('../config/db');

const migrations = [
  // inventory_counts
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`reference\` VARCHAR(50) NULL AFTER \`id\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`scope_type\` ENUM('all_products','by_category','by_supplier','manual') DEFAULT 'all_products' AFTER \`name\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`scope_ids\` JSON NULL AFTER \`scope_type\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`total_products\` INT DEFAULT 0 AFTER \`notes\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`total_discrepancies\` INT DEFAULT 0 AFTER \`total_products\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`total_discrepancy_value\` DECIMAL(14,2) DEFAULT 0 AFTER \`total_discrepancies\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`canceled_at\` DATETIME NULL AFTER \`total_discrepancy_value\``,
  `ALTER TABLE \`inventory_counts\` ADD COLUMN \`canceled_by\` BIGINT UNSIGNED NULL AFTER \`canceled_at\``,
  `ALTER TABLE \`inventory_counts\` MODIFY COLUMN \`status\` ENUM('draft','in_progress','completed','validated','canceled') DEFAULT 'draft'`,

  // inventory_count_items
  `ALTER TABLE \`inventory_count_items\` ADD COLUMN \`unit_cost\` DECIMAL(12,2) NULL AFTER \`note\``,
  `ALTER TABLE \`inventory_count_items\` ADD COLUMN \`discrepancy_value\` DECIMAL(14,2) NULL AFTER \`unit_cost\``,
  `ALTER TABLE \`inventory_count_items\` ADD COLUMN \`justification\` ENUM('breakage','theft','loss','found','data_entry_error','supplier_error','other') NULL AFTER \`discrepancy_value\``,
  `ALTER TABLE \`inventory_count_items\` ADD COLUMN \`justification_note\` TEXT NULL AFTER \`justification\``,
  `ALTER TABLE \`inventory_count_items\` ADD COLUMN \`counted_at\` DATETIME NULL AFTER \`justification_note\``,
];

async function runMigration() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Migration démarrant...\n');
    for (const sql of migrations) {
      try {
        await conn.query(sql);
        console.log('✅', sql.substring(0, 70) + '...');
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME' || (e.message && e.message.includes('Duplicate column'))) {
          console.log('⏭️  Déjà existant:', sql.substring(0, 60));
        } else {
          console.error('❌ Erreur:', e.message);
          console.error('   SQL:', sql);
        }
      }
    }

    // Vérification finale
    const [cols1] = await conn.query('SHOW COLUMNS FROM `inventory_counts`');
    const [cols2] = await conn.query('SHOW COLUMNS FROM `inventory_count_items`');
    console.log('\n📋 inventory_counts colonnes:', cols1.map(c => c.Field).join(', '));
    console.log('📋 inventory_count_items colonnes:', cols2.map(c => c.Field).join(', '));
    console.log('\n🎉 Migration terminée !');
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
