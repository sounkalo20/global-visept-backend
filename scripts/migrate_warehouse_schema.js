const mysql = require('mysql2/promise');

async function main() {
    const pool = require('../src/config/db'); 
    
    try {
        console.log('1. Creating product_catalog table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`product_catalog\` (
              \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
              \`owner_id\` bigint UNSIGNED NOT NULL,
              \`name\` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
              \`slug\` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
              \`barcode\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              \`description\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
              \`image_url\` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              \`unit_id\` smallint UNSIGNED NOT NULL DEFAULT '1',
              \`is_active\` tinyint(1) DEFAULT '1',
              \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              \`deleted_at\` datetime DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`uq_product_catalog_slug\` (\`owner_id\`, \`slug\`),
              UNIQUE KEY \`uq_product_catalog_barcode\` (\`owner_id\`, \`barcode\`),
              KEY \`idx_product_catalog_owner\` (\`owner_id\`),
              CONSTRAINT \`fk_product_catalog_owner\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
              CONSTRAINT \`fk_product_catalog_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`measurement_units\` (\`id\`) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('2. Altering products table...');
        try {
            await pool.query(`
                ALTER TABLE \`products\`
                ADD COLUMN \`catalog_product_id\` bigint UNSIGNED DEFAULT NULL AFTER \`company_id\`,
                ADD CONSTRAINT \`fk_products_catalog\` FOREIGN KEY (\`catalog_product_id\`) REFERENCES \`product_catalog\` (\`id\`) ON DELETE SET NULL,
                ADD UNIQUE KEY \`uq_products_company_catalog\` (\`company_id\`, \`catalog_product_id\`);
            `);
        } catch (e) {
            console.log('Altering products table warning (might exist):', e.message);
        }

        console.log('3. Truncating warehouse tables...');
        await pool.query(`SET FOREIGN_KEY_CHECKS = 0;`);
        await pool.query(`TRUNCATE TABLE \`warehouse_movements\`;`);
        await pool.query(`TRUNCATE TABLE \`warehouse_stocks\`;`);
        await pool.query(`SET FOREIGN_KEY_CHECKS = 1;`);

        console.log('4. Altering warehouse_stocks...');
        try {
            await pool.query(`
                ALTER TABLE \`warehouse_stocks\`
                DROP FOREIGN KEY \`fk_ws_product\`,
                DROP INDEX \`uq_warehouse_product\`,
                DROP INDEX \`idx_warehouse_stocks_product\`,
                CHANGE COLUMN \`product_id\` \`catalog_product_id\` bigint UNSIGNED NOT NULL,
                ADD UNIQUE KEY \`uq_warehouse_catalog_product\` (\`warehouse_id\`, \`catalog_product_id\`),
                ADD KEY \`idx_warehouse_stocks_catalog_product\` (\`catalog_product_id\`),
                ADD CONSTRAINT \`fk_ws_catalog_product\` FOREIGN KEY (\`catalog_product_id\`) REFERENCES \`product_catalog\` (\`id\`) ON DELETE CASCADE;
            `);
        } catch (e) {
            console.log('Altering warehouse_stocks warning:', e.message);
        }

        console.log('5. Altering warehouse_movements...');
        try {
            await pool.query(`
                ALTER TABLE \`warehouse_movements\`
                DROP FOREIGN KEY \`fk_wm_product\`,
                DROP INDEX \`idx_wm_product\`,
                CHANGE COLUMN \`product_id\` \`catalog_product_id\` bigint UNSIGNED NOT NULL,
                ADD KEY \`idx_wm_catalog_product\` (\`catalog_product_id\`),
                ADD CONSTRAINT \`fk_wm_catalog_product\` FOREIGN KEY (\`catalog_product_id\`) REFERENCES \`product_catalog\` (\`id\`) ON DELETE CASCADE;
            `);
        } catch (e) {
            console.log('Altering warehouse_movements warning:', e.message);
        }

        console.log('Migration successful!');
        process.exit(0);
    } catch (e) {
        console.error('Error during migration:', e);
        process.exit(1);
    }
}

main();
