/**
 * Script de migration pour le module d'inventaire physique
 * Lance ce script depuis le backend : node src/bdd/migrate_inventory.js
 */
const pool = require('../config/db');

async function runMigration() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Démarrage des migrations inventaire...');

    // ─── inventory_counts ────────────────────────────────────────────────────
    // 1. Ajouter la colonne reference
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`reference\` VARCHAR(50) NULL AFTER \`id\``).catch(() => {});
    // 2. Ajouter scope_type
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`scope_type\` ENUM('all_products','by_category','by_supplier','manual') DEFAULT 'all_products' AFTER \`name\``).catch(() => {});
    // 3. Ajouter scope_ids
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`scope_ids\` JSON NULL AFTER \`scope_type\``).catch(() => {});
    // 4. Ajouter total_products
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`total_products\` INT DEFAULT 0 AFTER \`notes\``).catch(() => {});
    // 5. Ajouter total_discrepancies
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`total_discrepancies\` INT DEFAULT 0 AFTER \`total_products\``).catch(() => {});
    // 6. Ajouter total_discrepancy_value
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`total_discrepancy_value\` DECIMAL(14,2) DEFAULT 0 AFTER \`total_discrepancies\``).catch(() => {});
    // 7. Ajouter canceled_at
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`canceled_at\` DATETIME NULL AFTER \`total_discrepancy_value\``).catch(() => {});
    // 8. Ajouter canceled_by
    await conn.query(`ALTER TABLE \`inventory_counts\` ADD COLUMN IF NOT EXISTS \`canceled_by\` BIGINT UNSIGNED NULL AFTER \`canceled_at\``).catch(() => {});
    // 9. Modifier le statut pour inclure 'canceled'
    await conn.query(`ALTER TABLE \`inventory_counts\` MODIFY COLUMN \`status\` ENUM('draft','in_progress','completed','validated','canceled') DEFAULT 'draft'`).catch(() => {});
    console.log('✅ inventory_counts migré');

    // ─── inventory_count_items ───────────────────────────────────────────────
    // 1. Ajouter unit_cost
    await conn.query(`ALTER TABLE \`inventory_count_items\` ADD COLUMN IF NOT EXISTS \`unit_cost\` DECIMAL(12,2) NULL AFTER \`note\``).catch(() => {});
    // 2. Ajouter discrepancy_value
    await conn.query(`ALTER TABLE \`inventory_count_items\` ADD COLUMN IF NOT EXISTS \`discrepancy_value\` DECIMAL(14,2) NULL AFTER \`unit_cost\``).catch(() => {});
    // 3. Ajouter justification
    await conn.query(`ALTER TABLE \`inventory_count_items\` ADD COLUMN IF NOT EXISTS \`justification\` ENUM('breakage','theft','loss','found','data_entry_error','supplier_error','other') NULL AFTER \`discrepancy_value\``).catch(() => {});
    // 4. Ajouter justification_note
    await conn.query(`ALTER TABLE \`inventory_count_items\` ADD COLUMN IF NOT EXISTS \`justification_note\` TEXT NULL AFTER \`justification\``).catch(() => {});
    // 5. Ajouter counted_at
    await conn.query(`ALTER TABLE \`inventory_count_items\` ADD COLUMN IF NOT EXISTS \`counted_at\` DATETIME NULL AFTER \`justification_note\``).catch(() => {});
    console.log('✅ inventory_count_items migré');

    console.log('🎉 Toutes les migrations ont été appliquées avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
