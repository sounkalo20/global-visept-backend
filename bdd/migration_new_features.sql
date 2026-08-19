-- ================================================================
-- VISEPT : Migration New Features (F15, F18, F19, F20, F21, F23)
-- ================================================================

-- 1. Mise à jour de la table `supplier_orders` pour les remises
ALTER TABLE `supplier_orders`
  ADD COLUMN IF NOT EXISTS `discount_type` ENUM('none', 'percentage', 'fixed') DEFAULT 'none' AFTER `shipping_cost`,
  ADD COLUMN IF NOT EXISTS `discount_value` DECIMAL(12,2) DEFAULT 0.00 AFTER `discount_type`,
  ADD COLUMN IF NOT EXISTS `discount_amount` DECIMAL(12,2) DEFAULT 0.00 AFTER `discount_value`;

-- 2. Création de la table `supplier_credits` (Avoirs Fournisseurs)
CREATE TABLE IF NOT EXISTS `supplier_credits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `supplier_id` BIGINT UNSIGNED NOT NULL,
  `reference` VARCHAR(50) NOT NULL COMMENT 'AVO-YYYYMM-XXXX',
  `amount` DECIMAL(12,2) NOT NULL,
  `remaining_amount` DECIMAL(12,2) NOT NULL COMMENT 'Solde restant utilisable',
  `reason` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('available', 'partially_used', 'used', 'canceled') DEFAULT 'available',
  `origin_order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'Commande d origine si lié',
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_credit_ref` (`company_id`, `reference`),
  KEY `idx_sc_company_supplier` (`company_id`, `supplier_id`),
  KEY `idx_sc_status` (`company_id`, `status`),
  KEY `idx_sc_origin_order` (`origin_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Création de la table `supplier_credit_applications` (Traçabilité des applications d'avoir)
CREATE TABLE IF NOT EXISTS `supplier_credit_applications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `supplier_credit_id` BIGINT UNSIGNED NOT NULL,
  `supplier_order_id` BIGINT UNSIGNED NOT NULL,
  `amount_applied` DECIMAL(12,2) NOT NULL,
  `applied_by` BIGINT UNSIGNED DEFAULT NULL,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sca_credit` (`supplier_credit_id`),
  KEY `idx_sca_order` (`supplier_order_id`),
  KEY `idx_sca_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Création de la table `notifications` (Système de notifications en temps réel)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL = tous les membres concernés',
  `type` VARCHAR(100) NOT NULL COMMENT 'low_stock, sale_completed, debt_overdue, order_received, inventory_done, session_anomaly, stock_prediction_alert',
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `reference_type` VARCHAR(50) DEFAULT NULL COMMENT 'product, sale, client_debt, supplier_order, inventory_count, cash_session',
  `reference_id` BIGINT UNSIGNED DEFAULT NULL,
  `action_url` VARCHAR(255) DEFAULT NULL,
  `read_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_company_user` (`company_id`, `user_id`),
  KEY `idx_notif_read` (`company_id`, `is_read`),
  KEY `idx_notif_created` (`company_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
