const pool = require('../config/db');
const AppError = require('../utils/AppError');

const getOwnerId = async (req) => {
  const companyId = req.query?.company_id || req.body?.company_id || req.query?.companyId || req.body?.companyId || req.body?.destination_company_id;
  if (companyId) {
    const [ownerRows] = await pool.query(
      "SELECT user_id FROM memberships WHERE company_id = ? AND role = 'owner' LIMIT 1",
      [companyId]
    );
    if (ownerRows.length > 0) return ownerRows[0].user_id;
  }
  return req.user.id;
};

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
    const owner_id = await getOwnerId(req);

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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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

    const owner_id = await getOwnerId(req);
    const warehouseId = req.params.id;
    const { product_id, quantity, destination_company_id, notes } = req.body;

    if (!product_id || !quantity || quantity <= 0 || !destination_company_id) {
      throw new AppError("Paramètres manquants ou invalides", 400);
    }
    const catalog_product_id = product_id;

    const [warehouses] = await connection.query(
      `SELECT id, name FROM warehouses WHERE id = ? AND owner_id = ? AND status = 'active'`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    const [memberships] = await connection.query(
      `SELECT id FROM memberships WHERE user_id = ? AND company_id = ? AND role = 'owner'`,
      [owner_id, destination_company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Vous n'êtes pas propriétaire de cette boutique", 403);
    }

    const [warehouseStocks] = await connection.query(
      `SELECT id, quantity FROM warehouse_stocks WHERE warehouse_id = ? AND catalog_product_id = ? FOR UPDATE`,
      [warehouseId, catalog_product_id]
    );

    if (warehouseStocks.length === 0 || warehouseStocks[0].quantity < quantity) {
      throw new AppError("Stock insuffisant dans l'entrepôt", 400);
    }

    const warehouseStockBefore = parseFloat(warehouseStocks[0].quantity);
    const warehouseStockAfter = warehouseStockBefore - parseFloat(quantity);

    await connection.query(
      `UPDATE warehouse_stocks SET quantity = ? WHERE id = ?`,
      [warehouseStockAfter, warehouseStocks[0].id]
    );

    await connection.query(
      `INSERT INTO warehouse_movements 
       (warehouse_id, catalog_product_id, movement_type, quantity, stock_before, stock_after, reference_type, destination_company_id, performed_by, notes)
       VALUES (?, ?, 'transfer_to_shop', ?, ?, ?, 'manual', ?, ?, ?)`,
      [warehouseId, catalog_product_id, -quantity, warehouseStockBefore, warehouseStockAfter, destination_company_id, req.user.id, notes || 'Transfert vers boutique']
    );

    const ProductCatalogService = require('../services/ProductCatalogService');
    const { product: shopProduct, isNew } = await ProductCatalogService.getOrCreateShopProduct(destination_company_id, catalog_product_id, connection);

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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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
    const owner_id = await getOwnerId(req);
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

// ─── AJUSTEMENT MANUEL DE STOCK DANS UN ENTREPÔT ──────
exports.adjustWarehouseStock = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const owner_id = await getOwnerId(req);
    const warehouseId = req.params.id;
    const {
      catalog_product_id,
      quantity,
      reason,
      notes
    } = req.body;

    if (!catalog_product_id) {
      throw new AppError("L'ID du produit catalogue est requis.", 400);
    }

    if (quantity === undefined || quantity === null || quantity === 0) {
      throw new AppError("La quantité doit être différente de 0.", 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError("Un motif d'ajustement est requis.", 400);
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum)) {
      throw new AppError("La quantité doit être un nombre valide.", 400);
    }

    const [warehouses] = await connection.query(
      `SELECT id, name FROM warehouses WHERE id = ? AND owner_id = ? AND status = 'active'`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable ou inactif.", 404);
    }

    const [catalogProducts] = await connection.query(
      `SELECT id, name FROM product_catalog WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`,
      [catalog_product_id, owner_id]
    );

    if (catalogProducts.length === 0) {
      throw new AppError("Produit catalogue introuvable.", 404);
    }

    const [stockRows] = await connection.query(
      `SELECT id, quantity, reserved_quantity 
       FROM warehouse_stocks 
       WHERE warehouse_id = ? AND catalog_product_id = ? 
       FOR UPDATE`,
      [warehouseId, catalog_product_id]
    );

    let stockBefore = 0;
    let stockId = null;

    if (stockRows.length > 0) {
      stockBefore = parseFloat(stockRows[0].quantity);
      stockId = stockRows[0].id;
    }

    const stockAfter = stockBefore + quantityNum;

    if (quantityNum < 0 && stockAfter < 0) {
      throw new AppError(
        `Stock insuffisant. Stock actuel : ${stockBefore}, déduction demandée : ${Math.abs(quantityNum)}`,
        400
      );
    }

    if (stockId) {
      await connection.query(
        `UPDATE warehouse_stocks SET quantity = ? WHERE id = ?`,
        [stockAfter, stockId]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO warehouse_stocks (warehouse_id, catalog_product_id, quantity, reserved_quantity) 
         VALUES (?, ?, ?, 0)`,
        [warehouseId, catalog_product_id, stockAfter]
      );
      stockId = result.insertId;
    }

    await connection.query(
      `INSERT INTO warehouse_movements 
       (warehouse_id, catalog_product_id, movement_type, quantity, stock_before, stock_after, 
        reference_type, performed_by, notes)
       VALUES (?, ?, 'adjustment', ?, ?, ?, 'manual', ?, ?)`,
      [
        warehouseId,
        catalog_product_id,
        quantityNum,
        stockBefore,
        stockAfter,
        req.user.id,
        `[${reason}] ${notes || ''}`.trim()
      ]
    );

    await connection.commit();

    const [updatedStock] = await connection.query(
      `SELECT ws.*, p.name as product_name, p.barcode, p.image_url
       FROM warehouse_stocks ws
       JOIN product_catalog p ON ws.catalog_product_id = p.id
       WHERE ws.id = ?`,
      [stockId]
    );

    res.status(200).json({
      success: true,
      message: `Ajustement de stock effectué avec succès.`,
      data: {
        warehouse: warehouses[0].name,
        product: updatedStock[0],
        adjustment: {
          quantity: quantityNum,
          reason: reason,
          stock_before: stockBefore,
          stock_after: stockAfter,
          notes: notes || null
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── RÉCUPÉRER LES MOTIFS D'AJUSTEMENT DISPONIBLES ──
exports.getAdjustmentReasons = async (req, res, next) => {
  try {
    const reasons = [
      { code: 'STOCK_INITIAL', label: 'Stock initial', type: 'both' },
      { code: 'INVENTORY_COUNT', label: 'Inventaire physique', type: 'both' },
      { code: 'DAMAGED', label: 'Produit endommagé', type: 'negative' },
      { code: 'EXPIRED', label: 'Produit périmé', type: 'negative' },
      { code: 'LOST', label: 'Perte / Vol', type: 'negative' },
      { code: 'FOUND', label: 'Produit retrouvé', type: 'positive' },
      { code: 'RETURN', label: 'Retour produit', type: 'positive' },
      { code: 'SAMPLE', label: 'Échantillon / Démonstration', type: 'negative' },
      { code: 'GIFT', label: 'Cadeau / Don', type: 'negative' },
      { code: 'TRANSFER_ERROR', label: 'Erreur de transfert', type: 'both' },
      { code: 'MANUAL_CORRECTION', label: 'Correction manuelle', type: 'both' },
      { code: 'OTHER', label: 'Autre', type: 'both' }
    ];

    res.status(200).json({
      success: true,
      data: reasons
    });
  } catch (error) {
    next(error);
  }
};

// ─── RÉCUPÉRER LES AJUSTEMENTS D'UN ENTREPÔT ──────────
exports.getWarehouseAdjustments = async (req, res, next) => {
  try {
    const owner_id = await getOwnerId(req);
    const warehouseId = req.params.id;
    const {
      start_date,
      end_date,
      reason,
      page = 1,
      limit = 50
    } = req.query;

    const [warehouses] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
      [warehouseId, owner_id]
    );

    if (warehouses.length === 0) {
      throw new AppError("Entrepôt introuvable", 404);
    }

    let query = `
      SELECT wm.*, 
             p.name as product_name, 
             p.barcode, 
             p.image_url,
             u.first_name, 
             u.last_name
      FROM warehouse_movements wm
      JOIN product_catalog p ON wm.catalog_product_id = p.id
      LEFT JOIN users u ON wm.performed_by = u.id
      WHERE wm.warehouse_id = ? 
        AND wm.movement_type = 'adjustment'
    `;

    const queryParams = [warehouseId];

    let countQuery = `
      SELECT COUNT(*) as total
      FROM warehouse_movements
      WHERE warehouse_id = ? 
        AND movement_type = 'adjustment'
    `;
    const countParams = [warehouseId];

    if (start_date) {
      query += ` AND DATE(wm.created_at) >= ?`;
      queryParams.push(start_date);
      countQuery += ` AND DATE(created_at) >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(wm.created_at) <= ?`;
      queryParams.push(end_date);
      countQuery += ` AND DATE(created_at) <= ?`;
      countParams.push(end_date);
    }

    if (reason) {
      query += ` AND wm.notes LIKE ?`;
      queryParams.push(`%[${reason}]%`);
      countQuery += ` AND notes LIKE ?`;
      countParams.push(`%[${reason}]%`);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult && countResult[0] ? parseInt(countResult[0].total) : 0;

    query += ` ORDER BY wm.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryParams.push(parseInt(limit), offset);

    const [movements] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: movements || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: total > 0 ? Math.ceil(total / parseInt(limit)) : 1
      }
    });

  } catch (error) {
    next(error);
  }
};

// ─── RÉCUPÉRER LES AJUSTEMENTS D'UN PRODUIT SPÉCIFIQUE ──
exports.getProductAdjustments = async (req, res, next) => {
  try {
    const owner_id = await getOwnerId(req);
    const { catalog_product_id } = req.params;
    const {
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT wm.*, 
             w.name as warehouse_name,
             u.first_name, 
             u.last_name
      FROM warehouse_movements wm
      JOIN warehouses w ON wm.warehouse_id = w.id
      LEFT JOIN users u ON wm.performed_by = u.id
      WHERE w.owner_id = ? 
        AND wm.catalog_product_id = ?
        AND wm.movement_type = 'adjustment'
    `;

    const queryParams = [owner_id, catalog_product_id];

    let countQuery = `
      SELECT COUNT(*) as total
      FROM warehouse_movements wm
      JOIN warehouses w ON wm.warehouse_id = w.id
      WHERE w.owner_id = ? 
        AND wm.catalog_product_id = ?
        AND wm.movement_type = 'adjustment'
    `;
    const countParams = [owner_id, catalog_product_id];

    if (start_date) {
      query += ` AND DATE(wm.created_at) >= ?`;
      queryParams.push(start_date);
      countQuery += ` AND DATE(wm.created_at) >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(wm.created_at) <= ?`;
      queryParams.push(end_date);
      countQuery += ` AND DATE(wm.created_at) <= ?`;
      countParams.push(end_date);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult && countResult[0] ? parseInt(countResult[0].total) : 0;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedQuery = query + ` ORDER BY wm.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    const [movements] = await pool.query(paginatedQuery, queryParams);

    res.status(200).json({
      success: true,
      data: movements || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: total > 0 ? Math.ceil(total / parseInt(limit)) : 1
      }
    });

  } catch (error) {
    next(error);
  }
};