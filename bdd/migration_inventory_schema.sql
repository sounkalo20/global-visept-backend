-- ==========================================================
-- Migration : Ajout de la colonne reference et colonnes associées
-- Tables impactées : inventory_counts, inventory_count_items
-- ==========================================================

-- 1. Table inventory_counts
ALTER TABLE `inventory_counts`
  ADD COLUMN `reference` VARCHAR(30) NULL AFTER `company_id`,
  ADD COLUMN `scope_type` VARCHAR(50) DEFAULT 'all_products' AFTER `name`,
  ADD COLUMN `scope_ids` JSON NULL AFTER `scope_type`,
  ADD COLUMN `total_products` INT DEFAULT 0,
  ADD COLUMN `total_discrepancies` INT DEFAULT 0,
  ADD COLUMN `total_discrepancy_value` DECIMAL(15,2) DEFAULT 0;

-- Index d'unicité sur la référence par entreprise
ALTER TABLE `inventory_counts`
  ADD UNIQUE KEY `uq_inventory_ref` (`company_id`, `reference`);

-- 2. Table inventory_count_items
ALTER TABLE `inventory_count_items`
  ADD COLUMN `unit_cost` DECIMAL(15,2) NULL,
  ADD COLUMN `discrepancy_value` DECIMAL(15,2) NULL,
  ADD COLUMN `justification` VARCHAR(100) NULL,
  ADD COLUMN `justification_note` TEXT NULL,
  ADD COLUMN `counted_at` DATETIME NULL;
