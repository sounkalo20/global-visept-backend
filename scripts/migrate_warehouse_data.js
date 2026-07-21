const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Adjust if env file is not found

async function main() {
    console.log('Connecting to database...');
    const pool = require('../src/config/db'); 
    
    try {
        
        console.log('1. Creating Backup tables...');
        await pool.query(`CREATE TABLE IF NOT EXISTS warehouse_movements_backup_20260721 AS SELECT * FROM warehouse_movements`);
        await pool.query(`CREATE TABLE IF NOT EXISTS warehouse_stocks_backup_20260721 AS SELECT * FROM warehouse_stocks`);
        console.log('Backup created.');

        console.log('2. Cleaning up supplier_order_items...');
        // Identify affected items
        const [rows] = await pool.query(`
            SELECT wm.reference_id as order_id, wm.product_id, wm.quantity as qty_to_remove 
            FROM warehouse_movements wm 
            WHERE wm.reference_type = 'supplier_order'
        `);
        
        if (rows.length === 0) {
            console.log('No supplier_order movements found in warehouse_movements. Nothing to clean.');
        } else {
            console.log(`Found ${rows.length} warehouse movements linked to supplier orders.`);
            for (const row of rows) {
                console.log(`- Order ${row.order_id}, Product ${row.product_id}: removing ${row.qty_to_remove} received.`);
                await pool.query(`
                    UPDATE supplier_order_items 
                    SET quantity_received = GREATEST(0, quantity_received - ?) 
                    WHERE order_id = ? AND product_id = ?
                `, [row.qty_to_remove, row.order_id, row.product_id]);
            }
            
            console.log('3. Updating supplier_orders status based on new quantities...');
            const [orderRows] = await pool.query(`
                SELECT id FROM supplier_orders 
                WHERE id IN (SELECT DISTINCT reference_id FROM warehouse_movements WHERE reference_type = 'supplier_order')
            `);
            for (const o of orderRows) {
                const [items] = await pool.query(`SELECT SUM(quantity_ordered) as ordered, SUM(quantity_received) as rcvd FROM supplier_order_items WHERE order_id = ?`, [o.id]);
                const ordered = items[0].ordered || 0;
                const rcvd = items[0].rcvd || 0;
                let newStatus = 'partially_received';
                if (rcvd === 0) newStatus = 'ordered';
                else if (rcvd >= ordered) newStatus = 'received';
                
                console.log(`- Order ${o.id}: ordered=${ordered}, received=${rcvd}. Setting status to ${newStatus}`);
                await pool.query(`UPDATE supplier_orders SET status = ? WHERE id = ?`, [newStatus, o.id]);
            }
        }
        
        console.log('Done! Ready to TRUNCATE.');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
