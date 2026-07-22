require('dotenv').config();
const pool = require('../src/config/db');

async function migrate() {
    try {
        console.log('Starting migrations...');

        // 1. Add is_admin_only to subscription_plans
        console.log('Adding is_admin_only to subscription_plans...');
        try {
            await pool.query('ALTER TABLE `subscription_plans` ADD COLUMN `is_admin_only` TINYINT(1) DEFAULT 0 AFTER `is_active`');
            console.log('is_admin_only added successfully.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column is_admin_only already exists.');
            } else {
                throw e;
            }
        }

        // 2. Insert UNLIMITED plan
        console.log('Inserting UNLIMITED plan...');
        try {
            await pool.query(`
                INSERT INTO \`subscription_plans\` (
                    \`code\`, \`name\`, \`price_monthly\`, \`price_yearly\`, 
                    \`features\`, \`max_employees\`, \`max_products\`, \`max_clients\`, 
                    \`is_active\`, \`is_admin_only\`
                ) VALUES (
                    'UNLIMITED', 
                    'Illimité Admin', 
                    0.00, 
                    0.00, 
                    '{"reports": true, "api_access": true, "promotions": true, "suppliers": true, "advanced_stock": true}', 
                    NULL, 
                    NULL, 
                    NULL, 
                    1, 
                    1
                )
            `);
            console.log('UNLIMITED plan inserted successfully.');
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                console.log('UNLIMITED plan already exists.');
            } else {
                throw e;
            }
        }

        // 3. Add has_unlimited_access to users
        console.log('Adding has_unlimited_access to users...');
        try {
            await pool.query('ALTER TABLE `users` ADD COLUMN `has_unlimited_access` TINYINT(1) DEFAULT 0');
            console.log('has_unlimited_access added successfully.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column has_unlimited_access already exists.');
            } else {
                throw e;
            }
        }

        console.log('All migrations completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
