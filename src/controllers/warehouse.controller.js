const pool = require('../config/db');
const AppError = require('../utils/AppError');

exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, description, address } = req.body;
    const owner_id = req.user.id;

    if (!name) {
      throw new AppError("Le nom de l'entrepôt est requis.", 400);
    }

    const [result] = await pool.query(
      `INSERT INTO warehouses (owner_id, name, description, address) VALUES (?, ?, ?, ?)`,
      [owner_id, name, description, address]
    );

    res.status(201).json({
      success: true,
      message: "Entrepôt créé avec succès",
      data: { id: result.insertId, name, description, address }
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouses = async (req, res, next) => {
  try {
    const owner_id = req.user.id;

    const [warehouses] = await pool.query(
      `SELECT * FROM warehouses WHERE owner_id = ? AND status = 'active' ORDER BY created_at DESC`,
      [owner_id]
    );

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouse = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const warehouseId = req.params.id;

    const [warehouses] = await pool.query(
      `SELECT * FROM warehouses WHERE id = ? AND owner_id = ? AND status = 'active'`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    res.json({
      success: true,
      data: warehouses[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const warehouseId = req.params.id;
    const { name, description, address, status } = req.body;

    const [warehouses] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    await pool.query(
      `UPDATE warehouses SET name = ?, description = ?, address = ?, status = COALESCE(?, status) WHERE id = ?`,
      [name, description, address, status, warehouseId]
    );

    res.json({
      success: true,
      message: "Entrepôt mis à jour"
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const warehouseId = req.params.id;

    const [warehouses] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    await pool.query(
      `UPDATE warehouses SET status = 'inactive' WHERE id = ?`,
      [warehouseId]
    );

    res.json({
      success: true,
      message: "Entrepôt supprimé"
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouseStocks = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const warehouseId = req.params.id;

    const [warehouses] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    const [stocks] = await pool.query(
      `SELECT ws.*, p.name as product_name, p.barcode as sku, p.image_url 
       FROM warehouse_stocks ws
       JOIN product_catalog p ON ws.catalog_product_id = p.id
       WHERE ws.warehouse_id = ?`,
      [warehouseId]
    );

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouseMovements = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const warehouseId = req.params.id;

    const [warehouses] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    const [movements] = await pool.query(
      `SELECT wm.*, p.name as product_name, p.barcode as sku, u.first_name, u.last_name, c.name as destination_company_name
       FROM warehouse_movements wm
       JOIN product_catalog p ON wm.catalog_product_id = p.id
       LEFT JOIN users u ON wm.performed_by = u.id
       LEFT JOIN companies c ON wm.destination_company_id = c.id
       WHERE wm.warehouse_id = ?
       ORDER BY wm.created_at DESC`,
      [warehouseId]
    );

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    next(error);
  }
};

exports.transferToShop = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const owner_id = req.user.id;
    const warehouseId = req.params.id;
    const { product_id, quantity, destination_company_id, notes } = req.body;

    if (!product_id || !quantity || quantity <= 0 || !destination_company_id) {
      throw new AppError("Paramètres manquants ou invalides", 400);
    }
    const catalog_product_id = product_id; // Frontend envoie product_id mais c'est le catalog_product_id

    // Vérifier l'entrepôt
    const [warehouses] = await connection.query(
      `SELECT id, name FROM warehouses WHERE id = ? AND owner_id = ? AND status = 'active'`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    // Vérifier l'entreprise (doit appartenir au même owner)
    const [memberships] = await connection.query(
      `SELECT id FROM memberships WHERE user_id = ? AND company_id = ? AND role = 'owner'`,
      [owner_id, destination_company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Vous n'êtes pas propriétaire de cette boutique", 403);
    }

    // Vérifier le stock entrepôt
    const [warehouseStocks] = await connection.query(
      `SELECT id, quantity FROM warehouse_stocks WHERE warehouse_id = ? AND catalog_product_id = ? FOR UPDATE`,
      [warehouseId, catalog_product_id]
    );

    if (warehouseStocks.length === 0 || warehouseStocks[0].quantity < quantity) {
      throw new AppError("Stock insuffisant dans l'entrepôt", 400);
    }

    const warehouseStockBefore = parseFloat(warehouseStocks[0].quantity);
    const warehouseStockAfter = warehouseStockBefore - parseFloat(quantity);

    // Mettre à jour le stock entrepôt
    await connection.query(
      `UPDATE warehouse_stocks SET quantity = ? WHERE id = ?`,
      [warehouseStockAfter, warehouseStocks[0].id]
    );

    // Historiser le mouvement entrepôt
    await connection.query(
      `INSERT INTO warehouse_movements 
       (warehouse_id, catalog_product_id, movement_type, quantity, stock_before, stock_after, reference_type, destination_company_id, performed_by, notes)
       VALUES (?, ?, 'transfer_to_shop', ?, ?, ?, 'manual', ?, ?, ?)`,
      [warehouseId, catalog_product_id, -quantity, warehouseStockBefore, warehouseStockAfter, destination_company_id, req.user.id, notes || 'Transfert vers boutique']
    );

    // Vérifier / Créer / Mettre à jour le stock boutique via ProductCatalogService
    const ProductCatalogService = require('../services/ProductCatalogService');
    const { product: shopProduct, isNew } = await ProductCatalogService.getOrCreateShopProduct(destination_company_id, catalog_product_id, connection);
    
    // Verrouiller la ligne si elle n'est pas nouvelle pour l'update concurrent (Optionnel si isNew)
    const [products] = await connection.query(
      `SELECT id, current_stock FROM products WHERE id = ? FOR UPDATE`,
      [shopProduct.id]
    );

    const shopStockBefore = parseFloat(products[0].current_stock || 0);
    const shopStockAfter = shopStockBefore + parseFloat(quantity);

    await connection.query(
      `UPDATE products SET current_stock = ? WHERE id = ?`,
      [shopStockAfter, shopProduct.id]
    );

    // Historiser le mouvement boutique
    await connection.query(
      `INSERT INTO inventory_movements
       (company_id, product_id, movement_type, quantity, stock_before, stock_after, reference_type, note, performed_by)
       VALUES (?, ?, 'transfer_in', ?, ?, ?, 'warehouse_transfer', ?, ?)`,
      [destination_company_id, shopProduct.id, quantity, shopStockBefore, shopStockAfter, 'Réception depuis entrepôt ' + warehouses[0].name, req.user.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Transfert effectué avec succès"
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

exports.getProductWarehouseStocks = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const { catalog_product_id } = req.params;

    const [stocks] = await pool.query(
      `SELECT w.id as warehouse_id, w.name as warehouse_name, COALESCE(ws.quantity, 0) as quantity
       FROM warehouses w
       LEFT JOIN warehouse_stocks ws ON w.id = ws.warehouse_id AND ws.catalog_product_id = ?
       WHERE w.owner_id = ? AND w.status = 'active'`,
      [catalog_product_id, owner_id]
    );

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
};

exports.searchGlobalProducts = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const [products] = await pool.query(
      `SELECT id as catalog_product_id, name, image_url, barcode, slug 
       FROM product_catalog 
       WHERE owner_id = ? AND name LIKE ? AND deleted_at IS NULL
       ORDER BY name ASC 
       LIMIT 10`,
      [owner_id, searchTerm]
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductWarehouseMovements = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const { catalog_product_id } = req.params;

    const [movements] = await pool.query(
      `SELECT wm.*, w.name as warehouse_name, u.first_name, u.last_name, c.name as destination_company_name
       FROM warehouse_movements wm
       JOIN warehouses w ON wm.warehouse_id = w.id
       LEFT JOIN users u ON wm.performed_by = u.id
       LEFT JOIN companies c ON wm.destination_company_id = c.id
       WHERE w.owner_id = ? AND wm.catalog_product_id = ?
       ORDER BY wm.created_at DESC`,
      [owner_id, catalog_product_id]
    );

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    next(error);
  }
};
