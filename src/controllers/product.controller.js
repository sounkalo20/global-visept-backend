const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── CRÉER UN PRODUIT ───────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      barcode,
      sku,
      cost_price,
      retail_price,
      wholesale_price,
      wholesale_min_qty,
      allow_custom_price,
      manage_stock,
      current_stock,
      low_stock_threshold,
      is_active,
      is_available,
      category_id,
      unit_id,
    } = req.body;

    const companyId = req.company.id;

    // Générer le slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    // Vérifier l'unicité du nom pour cette entreprise
    const [existing] = await pool.query(
      "SELECT id FROM products WHERE company_id = ? AND name = ? AND deleted_at IS NULL",
      [companyId, name],
    );

    if (existing.length > 0) {
      throw new AppError(
        "Un produit avec ce nom existe déjà dans votre entreprise.",
        409,
      );
    }

    // Vérifier l'unicité du barcode si fourni
    if (barcode) {
      const [existingBarcode] = await pool.query(
        "SELECT id FROM products WHERE company_id = ? AND barcode = ? AND deleted_at IS NULL",
        [companyId, barcode],
      );

      if (existingBarcode.length > 0) {
        throw new AppError("Un produit avec ce code-barres existe déjà.", 409);
      }
    }

    // Vérifier l'unicité du SKU si fourni
    if (sku) {
      const [existingSku] = await pool.query(
        "SELECT id FROM products WHERE company_id = ? AND sku = ? AND deleted_at IS NULL",
        [companyId, sku],
      );

      if (existingSku.length > 0) {
        throw new AppError("Un produit avec ce SKU existe déjà.", 409);
      }
    }

    // Vérifier que la catégorie existe et appartient à la même entreprise
    if (category_id) {
      const [categories] = await pool.query(
        "SELECT id FROM categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
        [category_id, companyId],
      );

      if (categories.length === 0) {
        throw new AppError("La catégorie spécifiée est introuvable.", 404);
      }
    }

    // Vérifier que l'unité existe
    if (unit_id) {
      const [units] = await pool.query(
        "SELECT id FROM measurement_units WHERE id = ?",
        [unit_id],
      );

      if (units.length === 0) {
        throw new AppError("L'unité de mesure spécifiée est introuvable.", 404);
      }
    }

    // URL de l'image si uploadée
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`;
    }

    // Insérer le produit
    const [result] = await pool.query(
      `INSERT INTO products (
        company_id, category_id, unit_id, name, slug, description,
        barcode, sku, cost_price, retail_price, wholesale_price,
        wholesale_min_qty, allow_custom_price, manage_stock,
        current_stock, low_stock_threshold, is_active, is_available, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        category_id || null,
        unit_id || 1,
        name,
        slug,
        description || null,
        barcode || null,
        sku || null,
        cost_price || 0,
        retail_price || 0,
        wholesale_price || 0,
        wholesale_min_qty || 1,
        allow_custom_price || false,
        manage_stock !== undefined ? manage_stock : true,
        current_stock || 0,
        low_stock_threshold || 10,
        is_active !== undefined ? is_active : true,
        is_available !== undefined ? is_available : true,
        imageUrl,
      ],
    );

    // Récupérer le produit créé avec sa catégorie et unité
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       WHERE p.id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès.",
      data: {
        product: products[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTER LES PRODUITS ────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      category_id,
      search,
      is_active,
      is_available,
      low_stock,
      sort_by = "created_at",
      sort_order = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    // Construire la requête avec filtres
    let query = `
      SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN measurement_units u ON p.unit_id = u.id
      WHERE p.company_id = ? AND p.deleted_at IS NULL
    `;
    const queryParams = [companyId];

    // Filtre par catégorie
    if (category_id) {
      query += " AND p.category_id = ?";
      queryParams.push(category_id);
    }

    // Recherche par nom, barcode ou SKU
    if (search) {
      query += " AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Filtre actif/inactif
    if (is_active !== undefined) {
      query += " AND p.is_active = ?";
      queryParams.push(is_active === "true" ? 1 : 0);
    }

    // Filtre disponible/indisponible
    if (is_available !== undefined) {
      query += " AND p.is_available = ?";
      queryParams.push(is_available === "true" ? 1 : 0);
    }

    // Filtre stock bas
    if (low_stock === "true") {
      query +=
        " AND p.manage_stock = 1 AND p.current_stock <= p.low_stock_threshold";
    }

    // Compter le total avant pagination
    const countQuery = query.replace(
      "SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol",
      "SELECT COUNT(*) as total",
    );
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Tri
    const allowedSortColumns = [
      "name",
      "retail_price",
      "current_stock",
      "created_at",
    ];
    const sortColumn = allowedSortColumns.includes(sort_by)
      ? sort_by
      : "created_at";
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY p.${sortColumn} ${order}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    const [products] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAILS D'UN PRODUIT ───────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       WHERE p.id = ? AND p.company_id = ? AND p.deleted_at IS NULL`,
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    // Récupérer les variantes
    const [variants] = await pool.query(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [id],
    );

    res.status(200).json({
      success: true,
      data: {
        product: {
          ...products[0],
          variants: variants || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UN PRODUIT ────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const {
      name,
      description,
      barcode,
      sku,
      cost_price,
      retail_price,
      wholesale_price,
      wholesale_min_qty,
      allow_custom_price,
      manage_stock,
      current_stock,
      low_stock_threshold,
      is_active,
      is_available,
      category_id,
      unit_id,
    } = req.body;

    // Vérifier que le produit existe et appartient à l'entreprise
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    const product = products[0];

    // Vérifier l'unicité du nom si modifié
    if (name && name !== product.name) {
      const [existing] = await pool.query(
        "SELECT id FROM products WHERE company_id = ? AND name = ? AND id != ? AND deleted_at IS NULL",
        [companyId, name, id],
      );

      if (existing.length > 0) {
        throw new AppError("Un produit avec ce nom existe déjà.", 409);
      }
    }

    // Vérifier l'unicité du barcode si modifié
    if (barcode && barcode !== product.barcode) {
      const [existingBarcode] = await pool.query(
        "SELECT id FROM products WHERE company_id = ? AND barcode = ? AND id != ? AND deleted_at IS NULL",
        [companyId, barcode, id],
      );

      if (existingBarcode.length > 0) {
        throw new AppError("Un produit avec ce code-barres existe déjà.", 409);
      }
    }

    // Vérifier l'unicité du SKU si modifié
    if (sku && sku !== product.sku) {
      const [existingSku] = await pool.query(
        "SELECT id FROM products WHERE company_id = ? AND sku = ? AND id != ? AND deleted_at IS NULL",
        [companyId, sku, id],
      );

      if (existingSku.length > 0) {
        throw new AppError("Un produit avec ce SKU existe déjà.", 409);
      }
    }

    // Vérifier la catégorie si modifiée
    if (category_id !== undefined) {
      if (category_id !== null) {
        const [categories] = await pool.query(
          "SELECT id FROM categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
          [category_id, companyId],
        );

        if (categories.length === 0) {
          throw new AppError("La catégorie spécifiée est introuvable.", 404);
        }
      }
    }

    // Vérifier l'unité si modifiée
    if (unit_id) {
      const [units] = await pool.query(
        "SELECT id FROM measurement_units WHERE id = ?",
        [unit_id],
      );

      if (units.length === 0) {
        throw new AppError("L'unité de mesure spécifiée est introuvable.", 404);
      }
    }

    // URL de l'image si uploadée
    let imageUrl = product.image_url;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`;
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now();
      updateFields.push("name = ?", "slug = ?");
      updateValues.push(name, slug);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }

    if (barcode !== undefined) {
      updateFields.push("barcode = ?");
      updateValues.push(barcode);
    }

    if (sku !== undefined) {
      updateFields.push("sku = ?");
      updateValues.push(sku);
    }

    if (cost_price !== undefined) {
      updateFields.push("cost_price = ?");
      updateValues.push(cost_price);
    }

    if (retail_price !== undefined) {
      updateFields.push("retail_price = ?");
      updateValues.push(retail_price);
    }

    if (wholesale_price !== undefined) {
      updateFields.push("wholesale_price = ?");
      updateValues.push(wholesale_price);
    }

    if (wholesale_min_qty !== undefined) {
      updateFields.push("wholesale_min_qty = ?");
      updateValues.push(wholesale_min_qty);
    }

    if (allow_custom_price !== undefined) {
      updateFields.push("allow_custom_price = ?");
      updateValues.push(allow_custom_price);
    }

    if (manage_stock !== undefined) {
      updateFields.push("manage_stock = ?");
      updateValues.push(manage_stock);
    }

    if (current_stock !== undefined) {
      updateFields.push("current_stock = ?");
      updateValues.push(current_stock);
    }

    if (low_stock_threshold !== undefined) {
      updateFields.push("low_stock_threshold = ?");
      updateValues.push(low_stock_threshold);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }

    if (is_available !== undefined) {
      updateFields.push("is_available = ?");
      updateValues.push(is_available);
    }

    if (category_id !== undefined) {
      updateFields.push("category_id = ?");
      updateValues.push(category_id);
    }

    if (unit_id !== undefined) {
      updateFields.push("unit_id = ?");
      updateValues.push(unit_id);
    }

    if (imageUrl !== product.image_url) {
      updateFields.push("image_url = ?");
      updateValues.push(imageUrl);
    }

    if (updateFields.length === 0) {
      throw new AppError("Aucun champ à mettre à jour.", 400);
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    // Récupérer le produit mis à jour
    const [updatedProducts] = await pool.query(
      `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       WHERE p.id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès.",
      data: {
        product: updatedProducts[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── METTRE À JOUR LE STOCK ─────────────────────────────
const updateStock = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const { quantity, movement_type, unit_cost, note } = req.body;

    // Vérifier que le produit existe
    const [products] = await connection.query(
      "SELECT * FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    const product = products[0];

    if (!product.manage_stock) {
      throw new AppError(
        "La gestion de stock n'est pas activée pour ce produit.",
        400,
      );
    }

    const stockBefore = parseFloat(product.current_stock);

    // Calculer le nouveau stock selon le type de mouvement
    let quantityChange = parseFloat(quantity);
    const entryTypes = ["purchase", "adjustment", "return_customer"];
    const exitTypes = ["loss", "expiry"];

    if (exitTypes.includes(movement_type)) {
      quantityChange = -Math.abs(quantityChange);
    }

    const stockAfter = stockBefore + quantityChange;

    if (stockAfter < 0) {
      throw new AppError(
        "Stock insuffisant pour effectuer cette opération.",
        400,
      );
    }

    // Mettre à jour le stock du produit
    await connection.query(
      "UPDATE products SET current_stock = ? WHERE id = ?",
      [stockAfter, id],
    );

    // Enregistrer le mouvement de stock
    await connection.query(
      `INSERT INTO inventory_movements (
        company_id, product_id, movement_type, quantity,
        stock_before, stock_after, unit_cost, note, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        id,
        movement_type,
        quantityChange,
        stockBefore,
        stockAfter,
        unit_cost || product.cost_price,
        note || null,
        req.user.id,
      ],
    );

    await connection.commit();

    // Récupérer le produit mis à jour
    const [updatedProducts] = await connection.query(
      `SELECT p.*, c.name as category_name, u.name as unit_name, u.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       WHERE p.id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Stock mis à jour avec succès.",
      data: {
        product: updatedProducts[0],
        stock_movement: {
          type: movement_type,
          quantity: quantityChange,
          stock_before: stockBefore,
          stock_after: stockAfter,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── SUPPRIMER UN PRODUIT ───────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le produit existe
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    // Vérifier si le produit est utilisé dans des ventes
    const [saleItems] = await pool.query(
      "SELECT id FROM sale_items WHERE product_id = ? LIMIT 1",
      [id],
    );

    if (saleItems.length > 0) {
      throw new AppError(
        "Impossible de supprimer ce produit car il est lié à des ventes. Désactivez-le plutôt.",
        400,
      );
    }

    // Soft delete
    await pool.query(
      "UPDATE products SET deleted_at = NOW() WHERE id = ? AND company_id = ?",
      [id, companyId],
    );

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── RÉCUPÉRER LES MOUVEMENTS DE STOCK ──────────────────
const getStockMovements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le produit existe
    const [products] = await pool.query(
      "SELECT id FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    const [movements] = await pool.query(
      `SELECT im.*, u.first_name as performed_by_name
       FROM inventory_movements im
       LEFT JOIN users u ON im.performed_by = u.id
       WHERE im.product_id = ? AND im.company_id = ?
       ORDER BY im.created_at DESC`,
      [id, companyId],
    );

    res.status(200).json({
      success: true,
      data: {
        movements,
        total: movements.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
  getStockMovements,
};
