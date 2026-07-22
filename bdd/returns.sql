-- Modification de l'ENUM movement_type dans inventory_movements
ALTER TABLE `inventory_movements` 
MODIFY COLUMN `movement_type` ENUM(
    'purchase',
    'sale',
    'return_customer',
    'return_supplier',
    'adjustment',
    'loss',
    'expiry',
    'transfer_in',
    'transfer_out',
    'production',
    'consumption',
    'return_defective'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Ajout d'une colonne returned_amount à sales pour faciliter le calcul du CA net
ALTER TABLE `sales`
ADD COLUMN `returned_amount` DECIMAL(12,2) DEFAULT 0.00 AFTER `total_amount`;

-- Table sale_returns
CREATE TABLE IF NOT EXISTS `sale_returns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `sale_id` BIGINT UNSIGNED NOT NULL,
  `return_number` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount_returned` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_return_number_company` (`company_id`, `return_number`),
  KEY `idx_sale_returns_sale` (`sale_id`),
  KEY `idx_sale_returns_company` (`company_id`),
  KEY `idx_sale_returns_created_by` (`created_by`),
  CONSTRAINT `fk_sale_returns_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table sale_return_items
CREATE TABLE IF NOT EXISTS `sale_return_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_return_id` BIGINT UNSIGNED NOT NULL,
  `sale_item_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED DEFAULT NULL,
  `quantity` DECIMAL(12,3) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  `return_type` ENUM('reintegrable', 'defective') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reintegrable',
  `reason` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sale_return_items_return` (`sale_return_id`),
  KEY `idx_sale_return_items_sale_item` (`sale_item_id`),
  KEY `idx_sale_return_items_product` (`product_id`),
  CONSTRAINT `fk_sale_return_items_return` FOREIGN KEY (`sale_return_id`) REFERENCES `sale_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
