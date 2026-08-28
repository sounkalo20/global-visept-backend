-- Migration SQL pour la gestion des Proformas dans VISEPT

-- 1. Création de la table proformas
CREATE TABLE IF NOT EXISTS `proformas` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED NOT NULL,
  `proforma_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` bigint UNSIGNED DEFAULT NULL,
  `client_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `discount_type` enum('none','percentage','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `discount_value` decimal(12,2) DEFAULT NULL,
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','converted','canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `converted_sale_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Lien vers la vente créée lors de la conversion',
  `converted_at` datetime DEFAULT NULL,
  `converted_by` bigint UNSIGNED DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL COMMENT 'Utilisateur/Caissier créateur du proforma',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `proforma_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_proforma_number` (`company_id`, `proforma_number`),
  KEY `fk_proformas_company` (`company_id`),
  KEY `fk_proformas_client` (`client_id`),
  KEY `fk_proformas_creator` (`created_by`),
  KEY `fk_proformas_converted_sale` (`converted_sale_id`),
  CONSTRAINT `fk_proformas_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proformas_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proformas_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proformas_converted_sale` FOREIGN KEY (`converted_sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proformas_converted_by` FOREIGN KEY (`converted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Création de la table proforma_items
CREATE TABLE IF NOT EXISTS `proforma_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `proforma_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `price_type` enum('retail','wholesale','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'retail',
  `unit_price` decimal(12,2) NOT NULL,
  `retail_price_ref` decimal(12,2) DEFAULT NULL,
  `wholesale_price_ref` decimal(12,2) DEFAULT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_proforma_items_proforma` (`proforma_id`),
  KEY `fk_proforma_items_product` (`product_id`),
  KEY `fk_proforma_items_variant` (`variant_id`),
  CONSTRAINT `fk_proforma_items_proforma` FOREIGN KEY (`proforma_id`) REFERENCES `proformas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proforma_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_proforma_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Modification de la table sales pour la traçabilité croisée avec proformas
ALTER TABLE `sales` ADD COLUMN `proforma_id` bigint UNSIGNED DEFAULT NULL AFTER `seller_id`;

ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_proforma` FOREIGN KEY (`proforma_id`) REFERENCES `proformas` (`id`) ON DELETE SET NULL;
