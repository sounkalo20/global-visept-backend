-- ============================================================
-- VISEPT — Migration Module Carte, Menus & Modificateurs
-- Restaurant — Phase 1 BDD
-- Date : 2026-08-28
-- ============================================================

-- ── 1. Groupes de modificateurs ──────────────────────────────
CREATE TABLE IF NOT EXISTS `modifier_groups` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`  BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(150) NOT NULL,
  `description` TEXT,
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `min_choices` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `max_choices` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_modifier_groups_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Options d'un groupe ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `modifier_options` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `modifier_group_id` BIGINT UNSIGNED NOT NULL,
  `name`              VARCHAR(150) NOT NULL,
  `extra_price`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sort_order`        INT NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_modifier_options_group` (`modifier_group_id`),
  CONSTRAINT `fk_modifier_options_group`
    FOREIGN KEY (`modifier_group_id`) REFERENCES `modifier_groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Association Plat <-> Groupe de modificateurs ──────────
CREATE TABLE IF NOT EXISTS `product_modifier_groups` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`        BIGINT UNSIGNED NOT NULL,
  `modifier_group_id` BIGINT UNSIGNED NOT NULL,
  `sort_order`        INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_group` (`product_id`, `modifier_group_id`),
  INDEX `idx_pmg_product` (`product_id`),
  INDEX `idx_pmg_group`   (`modifier_group_id`),
  CONSTRAINT `fk_pmg_product` FOREIGN KEY (`product_id`)
    REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pmg_group`   FOREIGN KEY (`modifier_group_id`)
    REFERENCES `modifier_groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Choix reels au moment de la commande ──────────────────
CREATE TABLE IF NOT EXISTS `sale_item_modifier_choices` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_item_id`       BIGINT UNSIGNED NOT NULL,
  `modifier_group_id`  BIGINT UNSIGNED NOT NULL,
  `modifier_option_id` BIGINT UNSIGNED NOT NULL,
  `group_name`         VARCHAR(150) NOT NULL,
  `option_name`        VARCHAR(150) NOT NULL,
  `extra_price`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at`         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_simc_sale_item` (`sale_item_id`),
  CONSTRAINT `fk_simc_sale_item`
    FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Formules / Menus ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `restaurant_menus` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`  BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price`       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `image_url`   VARCHAR(500),
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_menus_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Sections d'une formule ────────────────────────────────
CREATE TABLE IF NOT EXISTS `restaurant_menu_sections` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_id`     BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(200) NOT NULL,
  `min_choices` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `max_choices` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `sort_order`  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_rms_menu` (`menu_id`),
  CONSTRAINT `fk_rms_menu` FOREIGN KEY (`menu_id`)
    REFERENCES `restaurant_menus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Plats eligibles par section ───────────────────────────
CREATE TABLE IF NOT EXISTS `restaurant_menu_section_dishes` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `section_id`  BIGINT UNSIGNED NOT NULL,
  `product_id`  BIGINT UNSIGNED NOT NULL,
  `extra_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_section_dish` (`section_id`, `product_id`),
  CONSTRAINT `fk_rmsd_section` FOREIGN KEY (`section_id`)
    REFERENCES `restaurant_menu_sections`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rmsd_product` FOREIGN KEY (`product_id`)
    REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Extension sale_items (safe) ───────────────────────────
ALTER TABLE `sale_items`
  ADD COLUMN IF NOT EXISTS `modifiers_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    AFTER `discount_amount`;
