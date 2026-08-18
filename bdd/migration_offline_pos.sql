-- Migration : Mode Hors-Ligne POS, Idempotence, Anomalies de Stock et Sessions de Caisse
-- Base de données : visept_db

-- 1. Table `sales` : Ajout des colonnes de traçabilité offline et d'idempotence
ALTER TABLE `sales`
  ADD COLUMN `offline_uuid` VARCHAR(36) NULL UNIQUE AFTER `id`,
  ADD COLUMN `device_id` VARCHAR(64) NULL AFTER `offline_uuid`,
  ADD COLUMN `is_offline_sync` TINYINT(1) NOT NULL DEFAULT 0 AFTER `device_id`,
  ADD COLUMN `offline_created_at` DATETIME NULL AFTER `is_offline_sync`,
  ADD INDEX `idx_sales_device_id` (`device_id`);

-- 2. Table `stock_anomalies` : Journalisation des écarts et surventes en mode offline
CREATE TABLE IF NOT EXISTS `stock_anomalies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `sale_id` BIGINT UNSIGNED NULL,
  `offline_uuid` VARCHAR(36) NULL,
  `device_id` VARCHAR(64) NULL,
  `system_stock_at_sync` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `sold_quantity` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `oversell_quantity` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `status` ENUM('pending', 'resolved_by_restock', 'resolved_by_inventory', 'dismissed') NOT NULL DEFAULT 'pending',
  `resolved_at` DATETIME NULL,
  `resolved_by` BIGINT UNSIGNED NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_stock_anomalies_company_status` (`company_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table `cash_sessions` : Traçabilité des mouvements arrivés après clôture
ALTER TABLE `cash_sessions`
  ADD COLUMN `post_closing_adjustments` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `difference_amount`;
