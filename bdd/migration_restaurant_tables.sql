-- ============================================================
-- VISEPT — Migration Module Gestion des Tables & Salle
-- Restaurant — Phase 1 BDD
-- Date : 2026-09-01
-- ============================================================

-- ── 1. Création de la table des espaces de salle ─────────────
CREATE TABLE IF NOT EXISTS `restaurant_spaces` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`  BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_spaces_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Mise à jour de la table restaurant_tables ─────────────
ALTER TABLE `restaurant_tables`
  ADD COLUMN IF NOT EXISTS `space_id` BIGINT UNSIGNED NULL AFTER `company_id`,
  ADD COLUMN IF NOT EXISTS `shape` ENUM('square', 'round', 'rectangle') NOT NULL DEFAULT 'square' AFTER `capacity`,
  ADD COLUMN IF NOT EXISTS `width` INT NOT NULL DEFAULT 80 AFTER `position_y`,
  ADD COLUMN IF NOT EXISTS `height` INT NOT NULL DEFAULT 80 AFTER `width`;

-- Modifier la colonne status pour inclure bill_requested
ALTER TABLE `restaurant_tables`
  MODIFY COLUMN `status` ENUM('available', 'occupied', 'bill_requested', 'needs_cleaning', 'reserved', 'out_of_service') NOT NULL DEFAULT 'available';

-- ── 3. Table des logs de session de table ────────────────────
CREATE TABLE IF NOT EXISTS `table_session_logs` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`       BIGINT UNSIGNED NOT NULL,
  `table_session_id` BIGINT UNSIGNED NOT NULL,
  `action_type`      ENUM('opened', 'order_added', 'bill_requested', 'transferred', 'merged', 'paid', 'cleaned', 'reserved') NOT NULL,
  `source_table_id`  BIGINT UNSIGNED NULL,
  `target_table_id`  BIGINT UNSIGNED NULL,
  `staff_id`         BIGINT UNSIGNED NOT NULL,
  `details`          JSON NULL,
  `created_at`       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tsl_session` (`table_session_id`),
  INDEX `idx_tsl_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ✅ Migration terminée — aucune donnée existante altérée
-- ============================================================
