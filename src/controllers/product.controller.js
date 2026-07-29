const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── CRÉER UN PRODUIT ───────────────────────────────────
const createProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
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
      product_type = 'product',
      compositions,
      warehouse_stocks,
    } = req.body;

    const companyId = req.company.id;

    // Valider le type de produit
    const allowedTypes = ['product', 'service', 'dish', 'ingredient', 'raw_material'];
    if (!allowedTypes.includes(product_type)) {
      throw new AppError('Type de produit invalide. Types autorisés : ' + allowedTypes.join(', '), 400);
    }

    // Générer le slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();

    // Vérifier l'unicité du nom pour cette entreprise
    const [existing] = await connection.query(
      'SELECT id FROM products WHERE company_id = ? AND name = ? AND deleted_at IS NULL',
      [companyId, name]
    );

    if (existing.length > 0) {
      throw new AppError('Un produit avec ce nom existe déjà dans votre entreprise.', 409);
    }

    // Vérifier l'unicité du barcode si fourni
    if (barcode) {
      const [existingBarcode] = await connection.query(
        'SELECT id FROM products WHERE company_id = ? AND barcode = ? AND deleted_at IS NULL',
        [companyId, barcode]
      );

      if (existingBarcode.length > 0) {
        throw new AppError('Un produit avec ce code-barres existe déjà.', 409);
      }
    }

    // Vérifier l'unicité du SKU si fourni
    if (sku) {
      const [existingSku] = await connection.query(
        'SELECT id FROM products WHERE company_id = ? AND sku = ? AND deleted_at IS NULL',
        [companyId, sku]
      );

      if (existingSku.length > 0) {
        throw new AppError('Un produit avec ce SKU existe déjà.', 409);
      }
    }

    // Vérifier que la catégorie existe et appartient à la même entreprise
    if (category_id) {
      const [categories] = await connection.query(
        'SELECT id FROM categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [category_id, companyId]
      );

      if (categories.length === 0) {
        throw new AppError('La catégorie spécifiée est introuvable.', 404);
      }
    }

    // Vérifier que l'unité existe
    if (unit_id) {
      const [units] = await connection.query(
        'SELECT id FROM measurement_units WHERE id = ?',
        [unit_id]
      );

      if (units.length === 0) {
        throw new AppError("L'unité de mesure spécifiée est introuvable.", 404);
      }
    }

    // Vérifier les ingrédients si compositions fournies
    if (product_type === 'dish' && compositions && Array.isArray(compositions) && compositions.length > 0) {
      for (const comp of compositions) {
        // Vérifier que l'ingrédient existe
        const [ingredients] = await connection.query(
          "SELECT id FROM products WHERE id = ? AND company_id = ? AND product_type = 'ingredient' AND deleted_at IS NULL",
          [comp.ingredient_id, companyId]
        );

        if (ingredients.length === 0) {
          throw new AppError(
            `L'ingrédient #${comp.ingredient_id} est introuvable ou n'est pas un ingrédient.`,
            404
          );
        }

        // Vérifier l'unité
        if (comp.unit_id) {
          const [units] = await connection.query(
            'SELECT id FROM measurement_units WHERE id = ?',
            [comp.unit_id]
          );

          if (units.length === 0) {
            throw new AppError(`L'unité #${comp.unit_id} est introuvable.`, 404);
          }
        }
      }
    }

    // URL de l'image si uploadée
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    }

    await connection.beginTransaction();

    let catalogProductId = null;
    if (product_type === 'product' || product_type === 'ingredient' || product_type === 'raw_material') {
      const [ownerRows] = await connection.query("SELECT user_id FROM memberships WHERE company_id = ? AND role = 'owner' LIMIT 1", [companyId]);
      if (ownerRows.length > 0) {
        const ProductCatalogService = require("../services/ProductCatalogService");
        const catalogProduct = await ProductCatalogService.findOrCreateCatalogProduct(ownerRows[0].user_id, {
          name, barcode, description, image_url: imageUrl, unit_id: unit_id || 1
        }, connection);
        catalogProductId = catalogProduct.id;
      }
    }

    // Insérer le produit
    const [result] = await connection.query(
      `INSERT INTO products (
        company_id, catalog_product_id, category_id, unit_id, name, slug, description,
        barcode, sku, cost_price, retail_price, wholesale_price,
        wholesale_min_qty, allow_custom_price, product_type, manage_stock,
        current_stock, low_stock_threshold, is_active, is_available, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        catalogProductId,
        category_id || null,
        unit_id || 1,
        name,
        slug,
        description || null,
        barcode || null,
        sku || null,
        parseFloat(cost_price) || 0,
        parseFloat(retail_price) || 0,
        parseFloat(wholesale_price) || 0,
        parseInt(wholesale_min_qty) || 1,
        allow_custom_price === 'true' || allow_custom_price === true || allow_custom_price === 1 ? 1 : 0,
        product_type,
        manage_stock === 'false' || manage_stock === false || manage_stock === 0 ? 0 : 1,
        parseFloat(current_stock) || 0,
        parseFloat(low_stock_threshold) || 10,
        is_active === 'false' || is_active === false || is_active === 0 ? 0 : 1,
        is_available === 'false' || is_available === false || is_available === 0 ? 0 : 1,
        imageUrl,
      ]
    );

    const productId = result.insertId;

    // Insérer les compositions si c'est un plat
    if (product_type === 'dish' && compositions && Array.isArray(compositions) && compositions.length > 0) {
      for (const comp of compositions) {
        await connection.query(
          `INSERT INTO product_compositions (
            parent_product_id, ingredient_id, quantity_used, unit_id, is_optional
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            productId,
            comp.ingredient_id,
            parseFloat(comp.quantity_used) || 0,
            comp.unit_id || 1,
            comp.is_optional === 'true' || comp.is_optional === true || comp.is_optional === 1 ? 1 : 0,
          ]
        );
      }
    }

    // Gérer le stock initial en entrepôt
    let parsedWarehouseStocks = [];
    if (warehouse_stocks) {
      if (typeof warehouse_stocks === 'string') {
        try {
          parsedWarehouseStocks = JSON.parse(warehouse_stocks);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(warehouse_stocks)) {
        parsedWarehouseStocks = warehouse_stocks;
      }
    }

    if (parsedWarehouseStocks.length > 0) {
      const owner_id = req.user.id;
      for (const stock of parsedWarehouseStocks) {
        if (stock.quantity && parseFloat(stock.quantity) > 0) {
          // Vérifier que l'entrepôt appartient au proprio
          const [warehouses] = await connection.query(
            `SELECT id FROM warehouses WHERE id = ? AND owner_id = ?`,
            [stock.warehouse_id, owner_id]
          );

          if (warehouses.length > 0 && catalogProductId) {
            await connection.query(
              `INSERT INTO warehouse_stocks (warehouse_id, catalog_product_id, quantity) VALUES (?, ?, ?)`,
              [stock.warehouse_id, catalogProductId, parseFloat(stock.quantity)]
            );

            await connection.query(
              `INSERT INTO warehouse_movements 
               (warehouse_id, catalog_product_id, movement_type, quantity, stock_before, stock_after, reference_type, performed_by, notes)
               VALUES (?, ?, 'in_from_supplier', ?, 0, ?, 'manual', ?, 'Stock initial')`,
              [stock.warehouse_id, catalogProductId, parseFloat(stock.quantity), parseFloat(stock.quantity), owner_id]
            );
          }
        }
      }
    }

    await connection.commit();

    // Récupérer le produit créé avec sa catégorie et unité
    const [products] = await connection.query(
      `SELECT p.*, 
              c.name as category_name, 
              u.name as unit_name, 
              u.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       WHERE p.id = ?`,
      [productId]
    );

    // Récupérer les compositions si plat
    let productCompositions = [];
    if (product_type === 'dish') {
      const [comps] = await connection.query(
        `SELECT pc.*, p.name as ingredient_name, mu.name as unit_name, mu.symbol as unit_symbol
         FROM product_compositions pc
         JOIN products p ON pc.ingredient_id = p.id
         JOIN measurement_units mu ON pc.unit_id = mu.id
         WHERE pc.parent_product_id = ?`,
        [productId]
      );
      productCompositions = comps;
    }

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès.',
      data: {
        product: {
          ...products[0],
          compositions: productCompositions,
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

// ─── LISTER LES PRODUITS ────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      category_id,
      type = '',
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

    // Filtre par type de produit
    if (type) {
      const allowedTypes = ['product', 'service', 'dish', 'ingredient'];
      if (allowedTypes.includes(type)) {
        query += ' AND p.product_type = ?';
        queryParams.push(type);
      }
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
      throw new AppError('Produit introuvable.', 404);
    }

    const product = products[0];

    // Récupérer les variantes
    const [variants] = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [id],
    );

    // Récupérer les compositions si c'est un plat
    let compositions = [];
    if (product.product_type === 'dish') {
      const [comps] = await pool.query(
        `SELECT pc.*, 
                p.name as ingredient_name, 
                p.current_stock as ingredient_stock,
                p.retail_price as ingredient_price,
                mu.name as unit_name, 
                mu.symbol as unit_symbol
         FROM product_compositions pc
         JOIN products p ON pc.ingredient_id = p.id
         JOIN measurement_units mu ON pc.unit_id = mu.id
         WHERE pc.parent_product_id = ?`,
        [id]
      );
      compositions = comps;
    }

    res.status(200).json({
      success: true,
      data: {
        product: {
          ...product,
          variants: variants || [],
          compositions: compositions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// controllers/product.controller.js (REMPLACER updateProduct)

// ─── MODIFIER UN PRODUIT (AVEC SYNC MULTI-ENTREPÔTS) ───
const updateProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
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
      product_type,
      manage_stock,
      current_stock,
      low_stock_threshold,
      is_active,
      is_available,
      category_id,
      unit_id,
      compositions,
    } = req.body;

    // Vérifier que le produit existe
    const [products] = await connection.query(
      'SELECT * FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError('Produit introuvable.', 404);
    }

    const product = products[0];

    // Vérifications d'unicité...
    if (name && name !== product.name) {
      const [existing] = await connection.query(
        'SELECT id FROM products WHERE company_id = ? AND name = ? AND id != ? AND deleted_at IS NULL',
        [companyId, name, id],
      );
      if (existing.length > 0) {
        throw new AppError('Un produit avec ce nom existe déjà.', 409);
      }
    }

    if (barcode && barcode !== product.barcode) {
      const [existingBarcode] = await connection.query(
        'SELECT id FROM products WHERE company_id = ? AND barcode = ? AND id != ? AND deleted_at IS NULL',
        [companyId, barcode, id],
      );
      if (existingBarcode.length > 0) {
        throw new AppError('Un produit avec ce code-barres existe déjà.', 409);
      }
    }

    if (sku && sku !== product.sku) {
      const [existingSku] = await connection.query(
        'SELECT id FROM products WHERE company_id = ? AND sku = ? AND id != ? AND deleted_at IS NULL',
        [companyId, sku, id],
      );
      if (existingSku.length > 0) {
        throw new AppError('Un produit avec ce SKU existe déjà.', 409);
      }
    }

    if (product_type) {
      const allowedTypes = ['product', 'service', 'dish', 'ingredient', 'raw_material'];
      if (!allowedTypes.includes(product_type)) {
        throw new AppError('Type de produit invalide.', 400);
      }
    }

    if (category_id !== undefined && category_id !== null) {
      const [categories] = await connection.query(
        'SELECT id FROM categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [category_id, companyId],
      );
      if (categories.length === 0) {
        throw new AppError('La catégorie spécifiée est introuvable.', 404);
      }
    }

    if (unit_id) {
      const [units] = await connection.query(
        'SELECT id FROM measurement_units WHERE id = ?',
        [unit_id],
      );
      if (units.length === 0) {
        throw new AppError("L'unité de mesure spécifiée est introuvable.", 404);
      }
    }

    // Vérifier les ingrédients...
    if ((product_type || product.product_type) === 'dish' && compositions && Array.isArray(compositions)) {
      for (const comp of compositions) {
        if (comp.ingredient_id) {
          const [ingredients] = await connection.query(
            "SELECT id FROM products WHERE id = ? AND company_id = ? AND product_type = 'ingredient' AND deleted_at IS NULL",
            [comp.ingredient_id, companyId],
          );
          if (ingredients.length === 0) {
            throw new AppError(
              `L'ingrédient #${comp.ingredient_id} est introuvable ou n'est pas un ingrédient.`,
              404,
            );
          }
        }
      }
    }

    await connection.beginTransaction();

    // URL de l'image si uploadée
    let imageUrl = product.image_url;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    }

    // 🔥 GESTION DU CATALOGUE POUR MULTI-ENTREPÔTS
    const finalProductType = product_type || product.product_type;
    const isCatalogable = ['product', 'ingredient', 'raw_material'].includes(finalProductType);

    let catalogProductId = product.catalog_product_id;

    if (isCatalogable) {
      // Récupérer l'owner de l'entreprise
      const [ownerRows] = await connection.query(
        "SELECT user_id FROM memberships WHERE company_id = ? AND role = 'owner' LIMIT 1",
        [companyId]
      );

      if (ownerRows.length > 0) {
        const ownerId = ownerRows[0].user_id;

        if (catalogProductId) {
          // 🔥 MISE À JOUR DU CATALOGUE (impacte TOUS les entrepôts)
          await connection.query(
            `UPDATE product_catalog 
             SET name = ?, 
                 description = ?, 
                 barcode = ?, 
                 image_url = ?, 
                 unit_id = ?
             WHERE id = ? AND owner_id = ?`,
            [
              name || product.name,
              description || product.description,
              barcode || product.barcode,
              imageUrl || product.image_url,
              unit_id || product.unit_id || 1,
              catalogProductId,
              ownerId
            ]
          );
        } else {
          // Créer une nouvelle entrée dans le catalogue
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' +
            Date.now();

          const [catalogResult] = await connection.query(
            `INSERT INTO product_catalog (owner_id, name, slug, barcode, description, image_url, unit_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              ownerId,
              name || product.name,
              slug,
              barcode || null,
              description || null,
              imageUrl || null,
              unit_id || product.unit_id || 1
            ]
          );

          catalogProductId = catalogResult.insertId;

          // Mettre à jour le produit avec le nouveau catalog_product_id
          await connection.query(
            'UPDATE products SET catalog_product_id = ? WHERE id = ?',
            [catalogProductId, id]
          );
        }
      }
    }

    // Mise à jour du produit...
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      updateFields.push('name = ?', 'slug = ?');
      updateValues.push(name, slug);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }

    if (barcode !== undefined) {
      updateFields.push('barcode = ?');
      updateValues.push(barcode || null);
    }

    if (sku !== undefined) {
      updateFields.push('sku = ?');
      updateValues.push(sku || null);
    }

    if (cost_price !== undefined) {
      updateFields.push('cost_price = ?');
      updateValues.push(parseFloat(cost_price) || 0);
    }

    if (retail_price !== undefined) {
      updateFields.push('retail_price = ?');
      updateValues.push(parseFloat(retail_price) || 0);
    }

    if (wholesale_price !== undefined) {
      updateFields.push('wholesale_price = ?');
      updateValues.push(parseFloat(wholesale_price) || 0);
    }

    if (wholesale_min_qty !== undefined) {
      updateFields.push('wholesale_min_qty = ?');
      updateValues.push(parseInt(wholesale_min_qty) || 1);
    }

    if (allow_custom_price !== undefined) {
      updateFields.push('allow_custom_price = ?');
      updateValues.push(allow_custom_price === 'true' || allow_custom_price === true || allow_custom_price === 1 ? 1 : 0);
    }

    if (product_type !== undefined) {
      updateFields.push('product_type = ?');
      updateValues.push(product_type);
    }

    if (manage_stock !== undefined) {
      updateFields.push('manage_stock = ?');
      updateValues.push(manage_stock === 'false' || manage_stock === false || manage_stock === 0 ? 0 : 1);
    }

    if (current_stock !== undefined) {
      updateFields.push('current_stock = ?');
      updateValues.push(parseFloat(current_stock) || 0);
    }

    if (low_stock_threshold !== undefined) {
      updateFields.push('low_stock_threshold = ?');
      updateValues.push(parseFloat(low_stock_threshold) || 10);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active === 'false' || is_active === false || is_active === 0 ? 0 : 1);
    }

    if (is_available !== undefined) {
      updateFields.push('is_available = ?');
      updateValues.push(is_available === 'false' || is_available === false || is_available === 0 ? 0 : 1);
    }

    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id || null);
    }

    if (unit_id !== undefined) {
      updateFields.push('unit_id = ?');
      updateValues.push(unit_id || 1);
    }

    if (imageUrl !== product.image_url) {
      updateFields.push('image_url = ?');
      updateValues.push(imageUrl);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues,
      );
    }

    // Mettre à jour les compositions...
    if (finalProductType === 'dish' && compositions !== undefined) {
      await connection.query('DELETE FROM product_compositions WHERE parent_product_id = ?', [id]);
      if (Array.isArray(compositions)) {
        for (const comp of compositions) {
          if (comp.ingredient_id) {
            await connection.query(
              `INSERT INTO product_compositions (parent_product_id, ingredient_id, quantity_used, unit_id, is_optional)
               VALUES (?, ?, ?, ?, ?)`,
              [
                id,
                comp.ingredient_id,
                parseFloat(comp.quantity_used) || 0,
                comp.unit_id || 1,
                comp.is_optional === 'true' || comp.is_optional === true || comp.is_optional === 1 ? 1 : 0,
              ]
            );
          }
        }
      }
    }

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

    // Récupérer les compositions
    let productCompositions = [];
    if (updatedProducts[0].product_type === 'dish') {
      const [comps] = await connection.query(
        `SELECT pc.*, p.name as ingredient_name, mu.name as unit_name, mu.symbol as unit_symbol
         FROM product_compositions pc
         JOIN products p ON pc.ingredient_id = p.id
         JOIN measurement_units mu ON pc.unit_id = mu.id
         WHERE pc.parent_product_id = ?`,
        [id]
      );
      productCompositions = comps;
    }

    // 🔥 RÉCUPÉRER LES STOCKS DANS TOUS LES ENTREPÔTS
    const [warehouseStocks] = await connection.query(
      `SELECT ws.*, w.name as warehouse_name
       FROM warehouse_stocks ws
       JOIN warehouses w ON ws.warehouse_id = w.id
       WHERE ws.catalog_product_id = ?`,
      [catalogProductId]
    );

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès.',
      data: {
        product: {
          ...updatedProducts[0],
          compositions: productCompositions,
        },
        warehouse_stocks: warehouseStocks, // 🔥 Ajout des stocks par entrepôt
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
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

// ─── SUPPRIMER UN PRODUIT (AVEC NETTOYAGE ENTREPÔTS) ──
const deleteProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le produit existe
    const [products] = await connection.query(
      "SELECT * FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    const product = products[0];

    // 🔥 VÉRIFIER SI LE PRODUIT EST UTILISÉ DANS DES VENTES
    const [saleItems] = await connection.query(
      "SELECT id FROM sale_items WHERE product_id = ? LIMIT 1",
      [id],
    );

    if (saleItems.length > 0) {
      throw new AppError(
        "Impossible de supprimer ce produit car il est lié à des ventes. Désactivez-le plutôt.",
        400,
      );
    }

    // 🔥 VÉRIFIER SI LE PRODUIT EST UTILISÉ DANS DES COMMANDES FOURNISSEURS
    const [orderItems] = await connection.query(
      "SELECT id FROM supplier_order_items WHERE product_id = ? LIMIT 1",
      [id],
    );

    if (orderItems.length > 0) {
      throw new AppError(
        "Impossible de supprimer ce produit car il est lié à des commandes fournisseurs.",
        400,
      );
    }

    // 🔥 VÉRIFIER SI LE PRODUIT EST UTILISÉ COMME INGRÉDIENT
    const [compositions] = await connection.query(
      "SELECT id FROM product_compositions WHERE ingredient_id = ? LIMIT 1",
      [id],
    );

    if (compositions.length > 0) {
      throw new AppError(
        "Impossible de supprimer ce produit car il est utilisé comme ingrédient dans un plat.",
        400,
      );
    }

    await connection.beginTransaction();

    // 🔥 1. SUPPRIMER LES STOCKS DANS TOUS LES ENTREPÔTS
    if (product.catalog_product_id) {
      // Supprimer les mouvements d'entrepôt
      await connection.query(
        "DELETE FROM warehouse_movements WHERE catalog_product_id = ?",
        [product.catalog_product_id]
      );

      // Supprimer les stocks d'entrepôt
      await connection.query(
        "DELETE FROM warehouse_stocks WHERE catalog_product_id = ?",
        [product.catalog_product_id]
      );

      // 🔥 VÉRIFIER SI D'AUTRES PRODUITS UTILISENT CE CATALOG_PRODUCT_ID
      const [otherProducts] = await connection.query(
        "SELECT id FROM products WHERE catalog_product_id = ? AND id != ? AND deleted_at IS NULL",
        [product.catalog_product_id, id]
      );

      // Si aucun autre produit n'utilise ce catalogue, on le supprime aussi
      if (otherProducts.length === 0) {
        await connection.query(
          "DELETE FROM product_catalog WHERE id = ?",
          [product.catalog_product_id]
        );
      }
    }

    // 🔥 2. SUPPRIMER LES COMPOSITIONS (si le produit est un plat)
    await connection.query(
      "DELETE FROM product_compositions WHERE parent_product_id = ? OR ingredient_id = ?",
      [id, id]
    );

    // 🔥 3. SUPPRIMER LES VARIANTES
    await connection.query(
      "DELETE FROM product_variants WHERE product_id = ?",
      [id]
    );

    // 🔥 4. SUPPRIMER LES MOUVEMENTS DE STOCK
    await connection.query(
      "DELETE FROM inventory_movements WHERE product_id = ?",
      [id]
    );

    // 🔥 5. SOFT DELETE DU PRODUIT
    await connection.query(
      "UPDATE products SET deleted_at = NOW() WHERE id = ? AND company_id = ?",
      [id, companyId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès. Toutes les données associées ont été nettoyées.',
      data: {
        deleted_product_id: id,
        catalog_cleaned: product.catalog_product_id ? true : false,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── RÉCUPÉRER LES MOUVEMENTS DE STOCK ──────────────────
const getStockMovements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le produit existe et obtenir le catalog_product_id
    const [products] = await pool.query(
      "SELECT id, catalog_product_id FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (products.length === 0) {
      throw new AppError("Produit introuvable.", 404);
    }

    const product = products[0];

    // Mouvements boutique (achats directs, ventes, ajustements...)
    const [boutiqueMovements] = await pool.query(
      `SELECT im.*, u.first_name as performed_by_name
       FROM inventory_movements im
       LEFT JOIN users u ON im.performed_by = u.id
       WHERE im.product_id = ? AND im.company_id = ?
       ORDER BY im.created_at DESC`,
      [id, companyId],
    );

    // Mouvements d'entrepôt liés à ce produit via le catalogue global
    let warehouseMovements = [];
    if (product.catalog_product_id) {
      [warehouseMovements] = await pool.query(
        `SELECT wm.*, w.name as warehouse_name, u.first_name as performed_by_name, c.name as destination_company_name
         FROM warehouse_movements wm
         JOIN warehouses w ON wm.warehouse_id = w.id
         LEFT JOIN users u ON wm.performed_by = u.id
         LEFT JOIN companies c ON wm.destination_company_id = c.id
         WHERE wm.catalog_product_id = ?
         ORDER BY wm.created_at DESC`,
        [product.catalog_product_id]
      );
    }

    res.status(200).json({
      success: true,
      data: {
        boutiqueMovements,
        warehouseMovements,
        totalBoutique: boutiqueMovements.length,
        totalWarehouse: warehouseMovements.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── RÉCUPÉRER LES COMPOSITIONS D'UN PLAT ──────────────
const getProductCompositions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le produit existe et est un plat
    const [products] = await pool.query(
      "SELECT id, name, product_type FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId]
    );

    if (products.length === 0) {
      throw new AppError('Produit introuvable.', 404);
    }

    if (products[0].product_type !== 'dish') {
      throw new AppError("Ce produit n'est pas un plat.", 400);
    }

    // Récupérer les compositions
    const [compositions] = await pool.query(
      `SELECT pc.*, 
              p.name as ingredient_name, 
              p.current_stock as ingredient_stock,
              p.retail_price as ingredient_price,
              mu.name as unit_name, 
              mu.symbol as unit_symbol
       FROM product_compositions pc
       JOIN products p ON pc.ingredient_id = p.id
       JOIN measurement_units mu ON pc.unit_id = mu.id
       WHERE pc.parent_product_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        product: products[0],
        compositions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── METTRE À JOUR LES COMPOSITIONS D'UN PLAT ──────────
const updateProductCompositions = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const { compositions } = req.body; // [{ ingredient_id, quantity_used, unit_id, is_optional }]

    // Vérifier que le produit existe et est un plat
    const [products] = await connection.query(
      "SELECT id, name, product_type FROM products WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId]
    );

    if (products.length === 0) {
      throw new AppError('Produit introuvable.', 404);
    }

    if (products[0].product_type !== 'dish') {
      throw new AppError("Les compositions ne sont disponibles que pour les plats.", 400);
    }

    if (!compositions || !Array.isArray(compositions)) {
      throw new AppError('Le champ compositions (tableau) est requis.', 400);
    }

    await connection.beginTransaction();

    // Supprimer les anciennes compositions
    await connection.query(
      'DELETE FROM product_compositions WHERE parent_product_id = ?',
      [id]
    );

    // Insérer les nouvelles compositions
    for (const comp of compositions) {
      // Vérifier que l'ingrédient existe et appartient à la même entreprise
      const [ingredients] = await connection.query(
        "SELECT id, product_type FROM products WHERE id = ? AND company_id = ? AND product_type = 'ingredient' AND deleted_at IS NULL",
        [comp.ingredient_id, companyId]
      );

      if (ingredients.length === 0) {
        throw new AppError(
          `L'ingrédient #${comp.ingredient_id} est introuvable ou n'est pas un ingrédient.`,
          404
        );
      }

      // Vérifier l'unité
      const [units] = await connection.query(
        'SELECT id FROM measurement_units WHERE id = ?',
        [comp.unit_id || 1]
      );

      if (units.length === 0) {
        throw new AppError(`L'unité #${comp.unit_id} est introuvable.`, 404);
      }

      await connection.query(
        `INSERT INTO product_compositions (
          parent_product_id, ingredient_id, quantity_used, unit_id, is_optional
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          comp.ingredient_id,
          comp.quantity_used || 0,
          comp.unit_id || 1,
          comp.is_optional || false,
        ]
      );
    }

    await connection.commit();

    // Récupérer les compositions mises à jour
    const [updatedCompositions] = await connection.query(
      `SELECT pc.*, p.name as ingredient_name, mu.name as unit_name, mu.symbol as unit_symbol
       FROM product_compositions pc
       JOIN products p ON pc.ingredient_id = p.id
       JOIN measurement_units mu ON pc.unit_id = mu.id
       WHERE pc.parent_product_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Compositions mises à jour avec succès.',
      data: {
        compositions: updatedCompositions,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
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
  getProductCompositions,
  updateProductCompositions,
};
