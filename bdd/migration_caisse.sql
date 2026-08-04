-- 1. Table des Caisses physiques
CREATE TABLE IF NOT EXISTS `cash_registers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Ex: Caisse Principale, Caisse 2',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des Sessions de Caisse
CREATE TABLE IF NOT EXISTS `cash_sessions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `cash_register_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL COMMENT 'Caissier',
  `company_id` bigint UNSIGNED NOT NULL,
  `status` enum('open','closed') DEFAULT 'open',
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `opening_amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Fond de caisse',
  `expected_closing_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'Calculé par le système',
  `actual_closing_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'Compté par le caissier',
  `difference_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'actual - expected',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des Mouvements de Caisse
CREATE TABLE IF NOT EXISTS `cash_movements` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` bigint UNSIGNED NOT NULL,
  `type` enum('sale_in', 'sale_refund', 'manual_in', 'manual_out') NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','card','other') DEFAULT 'cash',
  `amount` decimal(12,2) NOT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID de la vente ou du retour (sale_id)',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table des Paiements Multiples pour les Ventes (Split Payments)
CREATE TABLE IF NOT EXISTS `sale_payments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_id` bigint UNSIGNED NOT NULL,
  `cash_session_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Peut être NULL si vente libre',
  `payment_method` enum('cash','mobile_money','bank_transfer','card','other') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Migration des données existantes (Rétrocompatibilité)
-- On copie le 'payment_method' et 'amount_paid' de toutes les ventes existantes vers la nouvelle table 'sale_payments'
INSERT INTO `sale_payments` (`sale_id`, `payment_method`, `amount`, `created_at`)
SELECT id, payment_method, amount_paid, created_at
FROM `sales`
WHERE id NOT IN (SELECT sale_id FROM `sale_payments`);

-- (Optionnel: on pourrait modifier l'enum payment_method dans sales pour ajouter 'card', on le fera si nécessaire)
ALTER TABLE `sales` MODIFY COLUMN `payment_method` enum('cash','mobile_money','bank_transfer','card','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash';
