const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({host:'localhost', user:'root', database:'bdiadec-db'});
  await conn.query("ALTER TABLE warehouse_movements MODIFY COLUMN movement_type ENUM('in_from_supplier','transfer_to_shop','transfer_to_warehouse','adjustment','manual','transfer_cancel') NOT NULL");
  console.log('Enum updated');
  conn.end();
}
run();
