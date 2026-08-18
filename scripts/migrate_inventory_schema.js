const pool = require('../src/config/db');

async function migrateInventorySchema() {
  console.log('🔄 Démarrage de la migration du schéma des inventaires...');
  const conn = await pool.getConnection();

  try {
    // 1. Vérification et ajout des colonnes sur inventory_counts
    console.log('📦 Mise à jour de la table inventory_counts...');
    const [colsCounts] = await conn.query('SHOW COLUMNS FROM `inventory_counts`');
    const existingColsCounts = colsCounts.map(c => c.Field);

    if (!existingColsCounts.includes('reference')) {
      await conn.query('ALTER TABLE `inventory_counts` ADD COLUMN `reference` VARCHAR(30) NULL AFTER `company_id`');
      console.log('  + Colonne reference ajoutée');
    }

    if (!existingColsCounts.includes('scope_type')) {
      await conn.query("ALTER TABLE `inventory_counts` ADD COLUMN `scope_type` VARCHAR(50) DEFAULT 'all_products' AFTER `name`");
      console.log('  + Colonne scope_type ajoutée');
    }

    if (!existingColsCounts.includes('scope_ids')) {
      await conn.query('ALTER TABLE `inventory_counts` ADD COLUMN `scope_ids` JSON NULL AFTER `scope_type`');
      console.log('  + Colonne scope_ids ajoutée');
    }

    if (!existingColsCounts.includes('total_products')) {
      await conn.query('ALTER TABLE `inventory_counts` ADD COLUMN `total_products` INT DEFAULT 0');
      console.log('  + Colonne total_products ajoutée');
    }

    if (!existingColsCounts.includes('total_discrepancies')) {
      await conn.query('ALTER TABLE `inventory_counts` ADD COLUMN `total_discrepancies` INT DEFAULT 0');
      console.log('  + Colonne total_discrepancies ajoutée');
    }

    if (!existingColsCounts.includes('total_discrepancy_value')) {
      await conn.query('ALTER TABLE `inventory_counts` ADD COLUMN `total_discrepancy_value` DECIMAL(15,2) DEFAULT 0');
      console.log('  + Colonne total_discrepancy_value ajoutée');
    }

    // Index d'unicité sur la référence
    const [indexes] = await conn.query('SHOW INDEX FROM `inventory_counts` WHERE Key_name = "uq_inventory_ref"');
    if (indexes.length === 0) {
      try {
        await conn.query('ALTER TABLE `inventory_counts` ADD UNIQUE KEY `uq_inventory_ref` (`company_id`, `reference`)');
        console.log('  + Index uq_inventory_ref ajouté');
      } catch (e) {
        console.log('  ! Note index:', e.message);
      }
    }

    // 2. Vérification et ajout des colonnes sur inventory_count_items
    console.log('📦 Mise à jour de la table inventory_count_items...');
    const [colsItems] = await conn.query('SHOW COLUMNS FROM `inventory_count_items`');
    const existingColsItems = colsItems.map(c => c.Field);

    if (!existingColsItems.includes('unit_cost')) {
      await conn.query('ALTER TABLE `inventory_count_items` ADD COLUMN `unit_cost` DECIMAL(15,2) NULL');
      console.log('  + Colonne unit_cost ajoutée');
    }

    if (!existingColsItems.includes('discrepancy_value')) {
      await conn.query('ALTER TABLE `inventory_count_items` ADD COLUMN `discrepancy_value` DECIMAL(15,2) NULL');
      console.log('  + Colonne discrepancy_value ajoutée');
    }

    if (!existingColsItems.includes('justification')) {
      await conn.query('ALTER TABLE `inventory_count_items` ADD COLUMN `justification` VARCHAR(100) NULL');
      console.log('  + Colonne justification ajoutée');
    }

    if (!existingColsItems.includes('justification_note')) {
      await conn.query('ALTER TABLE `inventory_count_items` ADD COLUMN `justification_note` TEXT NULL');
      console.log('  + Colonne justification_note ajoutée');
    }

    if (!existingColsItems.includes('counted_at')) {
      await conn.query('ALTER TABLE `inventory_count_items` ADD COLUMN `counted_at` DATETIME NULL');
      console.log('  + Colonne counted_at ajoutée');
    }

    console.log('✅ Migration du schéma des inventaires terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des inventaires :', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrateInventorySchema();
