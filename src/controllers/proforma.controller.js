const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── GÉNÉRER UN NUMÉRO DE PROFORMA UNIQUE ──────────────────
const generateProformaNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `PRF-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

  const [rows] = await connection.query(
    `SELECT proforma_number FROM proformas
     WHERE company_id = ? AND proforma_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [companyId, `${prefix}%`],
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNumber = rows[0].proforma_number;
    const lastSeq = parseInt(lastNumber.split("-").pop());
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(5, "0")}`;
};

// ─── CRÉER UN PROFORMA ────────────────────────────────────
const createProforma = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      client_id,
      client_name,
      items,
      discount_type,
      discount_value,
      notes,
    } = req.body;

    const companyId = req.company.id;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      throw new AppError("Aucun produit dans le proforma.", 400);
    }

    // Validation client
    if (client_id) {
      const [clients] = await connection.query(
        "SELECT id FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
        [client_id, companyId]
      );

      if (clients.length === 0) {
        throw new AppError("Client introuvable.", 404);
      }
    }

    let subtotal = 0;
    const proformaItemsData = [];

    // Traitement des articles (SANS déduction de stock)
    for (const item of items) {
      const [products] = await connection.query(
        `SELECT id, company_id, cost_price, retail_price, wholesale_price,
                wholesale_min_qty, name
         FROM products 
         WHERE id = ? AND deleted_at IS NULL`,
        [item.product_id]
      );

      if (products.length === 0) {
        throw new AppError(`Produit ID ${item.product_id} introuvable.`, 404);
      }

      const product = products[0];

      if (product.company_id !== companyId) {
        throw new AppError(
          `Le produit "${product.name}" n'appartient pas à cette entreprise.`,
          403
        );
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new AppError("La quantité de chaque article doit être supérieure à 0.", 400);
      }

      let unitPrice = Number(item.unit_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new AppError("Le prix unitaire ne peut pas être négatif.", 400);
      }

      const retailPrice = Number(product.retail_price);
      const wholesalePrice = Number(product.wholesale_price);
      let priceType = "custom";

      if (unitPrice === retailPrice) {
        priceType = "retail";
      } else if (unitPrice === wholesalePrice) {
        priceType = "wholesale";
      }

      if (item.price_type === "retail") priceType = "retail";
      if (item.price_type === "wholesale") priceType = "wholesale";
      if (item.price_type === "custom") priceType = "custom";

      const discountAmount = Number(item.discount_amount || 0);
      if (isNaN(discountAmount) || discountAmount < 0 || discountAmount > (unitPrice * quantity)) {
        throw new AppError("La remise d'un article ne peut pas être négative ni dépasser le montant de la ligne.", 400);
      }

      const totalPrice = unitPrice * quantity - discountAmount;
      subtotal += totalPrice;

      proformaItemsData.push({
        product,
        quantity,
        unitPrice,
        priceType,
        discountAmount,
        totalPrice,
        item,
      });
    }

    // Remise globale
    let globalDiscount = 0;
    if (discount_type === "percentage" && discount_value) {
      const discVal = Number(discount_value);
      if (isNaN(discVal) || discVal < 0 || discVal > 100) {
        throw new AppError("Le pourcentage de remise doit être compris entre 0 et 100%.", 400);
      }
      globalDiscount = subtotal * (discVal / 100);
    } else if (discount_type === "fixed" && discount_value) {
      const discVal = Number(discount_value);
      if (isNaN(discVal) || discVal < 0) {
        throw new AppError("Le montant de la remise fixe ne peut pas être négatif.", 400);
      }
      globalDiscount = discVal;
    }

    const totalAmount = subtotal - globalDiscount;
    const roundedTotal = Math.round(totalAmount * 100) / 100;

    if (isNaN(totalAmount) || roundedTotal <= 0) {
      throw new AppError(
        "Le montant total du proforma doit être supérieur à 0 FCFA.",
        400
      );
    }

    // Numéro de proforma unique
    const proformaNumber = await generateProformaNumber(connection, companyId);

    const [proformaResult] = await connection.query(
      `INSERT INTO proformas (
        company_id, proforma_number, client_id, client_name,
        subtotal, discount_amount, discount_type, discount_value,
        tax_amount, total_amount, status, created_by, notes, proforma_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NOW())`,
      [
        companyId,
        proformaNumber,
        client_id || null,
        client_name || null,
        subtotal,
        globalDiscount,
        discount_type || null,
        discount_value || null,
        0,
        roundedTotal,
        userId,
        notes || null,
      ]
    );

    const proformaId = proformaResult.insertId;

    // Insertion des articles du proforma
    for (const data of proformaItemsData) {
      const { product, quantity, unitPrice, priceType, discountAmount, totalPrice } = data;

      await connection.query(
        `INSERT INTO proforma_items (
          proforma_id, product_id, variant_id, quantity, price_type, unit_price,
          retail_price_ref, wholesale_price_ref, total_price,
          discount_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          proformaId,
          product.id,
          data.item.variant_id || null,
          quantity,
          priceType,
          unitPrice,
          product.retail_price,
          product.wholesale_price,
          totalPrice,
          discountAmount,
          data.item.notes || null,
        ]
      );
    }

    await connection.commit();

    const [proformas] = await connection.query(
      `SELECT p.*,
              c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone,
              u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM proformas p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [proformaId]
    );

    const [proformaItems] = await connection.query(
      `SELECT pi.*, pr.name as product_name, pr.image_url, pr.sku
       FROM proforma_items pi
       JOIN products pr ON pi.product_id = pr.id
       WHERE pi.proforma_id = ?`,
      [proformaId]
    );

    return res.status(201).json({
      success: true,
      message: "Proforma créé et enregistré avec succès.",
      data: {
        proforma: {
          ...proformas[0],
          items: proformaItems,
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

// ─── LISTER LES PROFORMAS ────────────────────────────────
const getProformas = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const {
      page = 1,
      limit = 20,
      start_date,
      end_date,
      client_id,
      created_by,
      status,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    let baseQuery = `
      FROM proformas p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN sales s ON p.converted_sale_id = s.id
      WHERE p.company_id = ?
    `;

    const queryParams = [companyId];

    if (start_date) {
      baseQuery += " AND DATE(p.proforma_date) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      baseQuery += " AND DATE(p.proforma_date) <= ?";
      queryParams.push(end_date);
    }

    if (client_id) {
      baseQuery += " AND p.client_id = ?";
      queryParams.push(client_id);
    }

    if (created_by) {
      baseQuery += " AND p.created_by = ?";
      queryParams.push(created_by);
    }

    if (status) {
      baseQuery += " AND p.status = ?";
      queryParams.push(status);
    }

    if (search) {
      baseQuery += `
        AND (
          p.proforma_number LIKE ?
          OR p.client_name LIKE ?
          OR c.full_name LIKE ?
          OR c.first_name LIKE ?
          OR c.last_name LIKE ?
        )
      `;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult?.[0]?.total || 0;

    const allowedSortColumns = ["proforma_date", "total_amount", "proforma_number", "created_at"];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : "created_at";
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const query = `
      SELECT 
        p.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.full_name as client_full_name,
        c.phone as client_phone,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        s.sale_number as converted_sale_number
      ${baseQuery}
      ORDER BY p.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

    const salesParams = [...queryParams, parseInt(limit), offset];
    const [proformas] = await pool.query(query, salesParams);

    for (const pf of proformas) {
      const [itemsCount] = await pool.query(
        "SELECT COUNT(*) as count FROM proforma_items WHERE proforma_id = ?",
        [pf.id]
      );
      pf.items_count = itemsCount?.[0]?.count || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        proformas,
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

// ─── DÉTAILS D'UN PROFORMA ──────────────────────────────
const getProformaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [proformas] = await pool.query(
      `SELECT p.*,
              c.first_name as client_first_name, c.last_name as client_last_name,
              c.full_name as client_full_name, c.phone as client_phone,
              c.email as client_email, c.address as client_address,
              CONCAT(u.first_name, ' ', u.last_name) as creator_name,
              s.sale_number as converted_sale_number,
              CONCAT(uc.first_name, ' ', uc.last_name) as converted_by_name
       FROM proformas p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN sales s ON p.converted_sale_id = s.id
       LEFT JOIN users uc ON p.converted_by = uc.id
       WHERE p.id = ? AND p.company_id = ?`,
      [id, companyId]
    );

    if (proformas.length === 0) {
      throw new AppError("Proforma introuvable.", 404);
    }

    const [items] = await pool.query(
      `SELECT pi.*, pr.name as product_name, pr.image_url as product_image,
              pr.sku as product_sku, pr.barcode as product_barcode,
              mu.symbol as unit_symbol, cat.name as category_name
       FROM proforma_items pi
       JOIN products pr ON pi.product_id = pr.id
       LEFT JOIN measurement_units mu ON pr.unit_id = mu.id
       LEFT JOIN categories cat ON pr.category_id = cat.id
       WHERE pi.proforma_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        proforma: {
          ...proformas[0],
          items,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER / METTRE À JOUR UN PROFORMA ─────────────────
const updateProforma = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const { notes, client_id, client_name, status } = req.body;

    const [proformas] = await pool.query(
      "SELECT * FROM proformas WHERE id = ? AND company_id = ?",
      [id, companyId]
    );

    if (proformas.length === 0) {
      throw new AppError("Proforma introuvable.", 404);
    }

    const pf = proformas[0];
    if (pf.status === "converted") {
      throw new AppError("Impossible de modifier un proforma déjà converti en vente.", 400);
    }

    const updates = [];
    const values = [];

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }
    if (client_id !== undefined) {
      updates.push("client_id = ?");
      values.push(client_id);
    }
    if (client_name !== undefined) {
      updates.push("client_name = ?");
      values.push(client_name);
    }
    if (status !== undefined && ["active", "canceled"].includes(status)) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length > 0) {
      values.push(id, companyId);
      await pool.query(
        `UPDATE proformas SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`,
        values
      );
    }

    res.status(200).json({
      success: true,
      message: "Proforma mis à jour avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── ANNULER UN PROFORMA ────────────────────────────────
const cancelProforma = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [proformas] = await pool.query(
      "SELECT * FROM proformas WHERE id = ? AND company_id = ?",
      [id, companyId]
    );

    if (proformas.length === 0) {
      throw new AppError("Proforma introuvable.", 404);
    }

    if (proformas[0].status === "converted") {
      throw new AppError("Un proforma converti en vente ne peut plus être annulé.", 400);
    }

    await pool.query(
      "UPDATE proformas SET status = 'canceled' WHERE id = ? AND company_id = ?",
      [id, companyId]
    );

    res.status(200).json({
      success: true,
      message: "Proforma annulé avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProforma,
  getProformas,
  getProformaById,
  updateProforma,
  cancelProforma,
};
