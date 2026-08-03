const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bdiadec-db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log("Starting database migration...");

    // 1. Add owner_id to categories if it doesn't exist
    console.log("Checking categories table...");
    const [cols] = await connection.query(`SHOW COLUMNS FROM categories LIKE 'owner_id'`);
    if (cols.length === 0) {
      console.log("Adding owner_id to categories...");
      await connection.query(`ALTER TABLE categories ADD COLUMN owner_id bigint UNSIGNED NULL AFTER company_id`);
      
      // Populate owner_id based on memberships
      console.log("Populating owner_id in categories...");
      await connection.query(`
        UPDATE categories c
        JOIN memberships m ON c.company_id = m.company_id AND m.role = 'owner'
        SET c.owner_id = m.user_id
      `);
      
      console.log("Making owner_id NOT NULL and removing company_id...");
      await connection.query(`ALTER TABLE categories MODIFY COLUMN company_id bigint UNSIGNED NULL`);
    }

    // 2. Add category_id to product_catalog if it doesn't exist
    console.log("Checking product_catalog table...");
    const [catCols] = await connection.query(`SHOW COLUMNS FROM product_catalog LIKE 'category_id'`);
    if (catCols.length === 0) {
      console.log("Adding category_id to product_catalog...");
      await connection.query(`ALTER TABLE product_catalog ADD COLUMN category_id bigint UNSIGNED NULL AFTER unit_id`);
      
      // Populate category_id from products (take the first available category_id for this catalog product)
      console.log("Populating category_id in product_catalog...");
      await connection.query(`
        UPDATE product_catalog pc
        JOIN (
          SELECT catalog_product_id, MIN(category_id) as category_id
          FROM products
          WHERE catalog_product_id IS NOT NULL AND category_id IS NOT NULL
          GROUP BY catalog_product_id
        ) p ON pc.id = p.catalog_product_id
        SET pc.category_id = p.category_id
      `);
    }

    console.log("Migration completed successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

runMigration();
