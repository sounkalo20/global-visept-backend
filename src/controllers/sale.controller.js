const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── GÉNÉRER UN NUMÉRO DE VENTE UNIQUE ──────────────────
const generateSaleNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `VTE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

  // Récupérer le dernier numéro pour cette entreprise
  const [rows] = await connection.query(
    `SELECT sale_number FROM sales
     WHERE company_id = ? AND sale_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [companyId, `${prefix}%`],
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNumber = rows[0].sale_number;
    const lastSeq = parseInt(lastNumber.split("-").pop());
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(5, "0")}`;
};

// ─── CRÉER UNE VENTE ────────────────────────────────────
const createSale = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      client_id,
      client_name,
      items,
      discount_type,
      discount_value,
      payment_status,
      amount_paid,
      payment_method,
      payment_reference,
      notes,
    } = req.body;

    const companyId = req.company.id;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      throw new AppError("Aucun produit dans la vente.", 400);
    }

    // 🔎 validation client
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
    const saleItemsData = [];

    // ===============================
    // 🧠 ITEMS PROCESSING
    // ===============================
    for (const item of items) {
      const [products] = await connection.query(
        `SELECT id, company_id, cost_price, retail_price, wholesale_price,
                wholesale_min_qty, manage_stock, current_stock, name
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

      // ===============================
      // 💰 PRICE TYPE LOGIC FIXED
      // ===============================
      let unitPrice = Number(item.unit_price);
      let priceType = "custom";

      const retailPrice = Number(product.retail_price);
      const wholesalePrice = Number(product.wholesale_price);

      // auto-detection si pas explicitement custom
      if (unitPrice === retailPrice) {
        priceType = "retail";
      } else if (unitPrice === wholesalePrice) {
        priceType = "wholesale";
      } else {
        priceType = "custom";
      }

      // option fallback si frontend envoie price_type
      if (item.price_type === "retail") priceType = "retail";
      if (item.price_type === "wholesale") priceType = "wholesale";
      if (item.price_type === "custom") priceType = "custom";

      // ===============================
      // 📦 STOCK CHECK
      // ===============================
      if (product.manage_stock && product.current_stock < quantity) {
        throw new AppError(
          `Stock insuffisant pour "${product.name}". Disponible: ${product.current_stock}`,
          400
        );
      }

      const discountAmount = Number(item.discount_amount || 0);
      const totalPrice = unitPrice * quantity - discountAmount;

      subtotal += totalPrice;

      saleItemsData.push({
        product,
        quantity,
        unitPrice,
        priceType,
        discountAmount,
        totalPrice,
        item,
      });
    }

    // ===============================
    // 💸 GLOBAL DISCOUNT
    // ===============================
    let globalDiscount = 0;

    if (discount_type === "percentage" && discount_value) {
      globalDiscount = subtotal * (Number(discount_value) / 100);
    } else if (discount_type === "fixed" && discount_value) {
      globalDiscount = Number(discount_value);
    }

    const totalAmount = subtotal - globalDiscount;

    // ===============================
    // 🚨 STRICT POS RULE (NO DEBT)
    // ===============================
    const paid = Number(amount_paid);

    if (!amount_paid || paid <= totalAmount) {
      throw new AppError(
        "Cette vente est une vente directe : le montant payé doit être EXACTEMENT égal au total (pas de dette autorisée).",
        400
      );
    }

    const amountDue = 0;
    const finalPaymentStatus = "paid";

    // ===============================
    // 🧾 SALE NUMBER
    // ===============================
    const saleNumber = await generateSaleNumber(connection, companyId);

    const [saleResult] = await connection.query(
      `INSERT INTO sales (
        company_id, sale_number, client_id, client_name,
        subtotal, discount_amount, discount_type, discount_value,
        tax_amount, total_amount, payment_status, amount_paid, amount_due,
        payment_method, payment_reference, status, seller_id, notes, sale_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW())`,
      [
        companyId,
        saleNumber,
        client_id || null,
        client_name || null,
        subtotal,
        globalDiscount,
        discount_type || null,
        discount_value || null,
        0,
        totalAmount,
        finalPaymentStatus,
        totalAmount,
        amountDue,
        payment_method,
        payment_reference || null,
        userId,
        notes || null,
      ]
    );

    const saleId = saleResult.insertId;

    // ===============================
    // 📦 INSERT ITEMS + STOCK
    // ===============================
    for (const data of saleItemsData) {
      const { product, quantity, unitPrice, priceType, discountAmount, totalPrice } = data;

      await connection.query(
        `INSERT INTO sale_items (
          sale_id, product_id, quantity, price_type, unit_price,
          retail_price_ref, wholesale_price_ref, total_price,
          discount_amount, cost_price, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          product.id,
          quantity,
          priceType,
          unitPrice,
          product.retail_price,
          product.wholesale_price,
          totalPrice,
          discountAmount,
          product.cost_price,
          data.item.notes || null,
        ]
      );

      // ===============================
      // 📉 STOCK MOVEMENT
      // ===============================
      if (product.manage_stock) {
        const stockBefore = Number(product.current_stock);
        const stockAfter = stockBefore - quantity;

        await connection.query(
          "UPDATE products SET current_stock = ? WHERE id = ?",
          [stockAfter, product.id]
        );

        await connection.query(
          `INSERT INTO inventory_movements (
            company_id, product_id, movement_type, quantity,
            stock_before, stock_after, reference_type, reference_id,
            unit_cost, performed_by
          ) VALUES (?, ?, 'sale', ?, ?, ?, 'sale', ?, ?, ?)`,
          [
            companyId,
            product.id,
            -quantity,
            stockBefore,
            stockAfter,
            saleId,
            product.cost_price,
            userId,
          ]
        );
      }
    }

    await connection.commit();

    const [sales] = await connection.query(
      `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?`,
      [saleId]
    );

    const [saleItems] = await connection.query(
      `SELECT si.*, p.name as product_name, p.image_url, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [saleId]
    );

    return res.status(201).json({
      success: true,
      message: "Vente créée avec succès.",
      data: {
        sale: {
          ...sales[0],
          items: saleItems,
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

// ─── LISTER LES VENTES ──────────────────────────────────
const getSales = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const {
      page = 1,
      limit = 20,
      start_date,
      end_date,
      client_id,
      status,
      payment_status,
      sort_by = "created_at",
      sort_order = "DESC",
      search,
    } = req.query;

    // =========================
    // BASE QUERY
    // =========================

    let baseQuery = `
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.seller_id = u.id
      WHERE s.company_id = ?
      AND s.status != 'canceled'
    `;

    const queryParams = [companyId];

    // =========================
    // FILTERS
    // =========================

    if (start_date) {
      baseQuery += " AND DATE(s.sale_date) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      baseQuery += " AND DATE(s.sale_date) <= ?";
      queryParams.push(end_date);
    }

    if (client_id) {
      baseQuery += " AND s.client_id = ?";
      queryParams.push(client_id);
    }

    if (status) {
      baseQuery += " AND s.status = ?";
      queryParams.push(status);
    }

    if (payment_status) {
      baseQuery += " AND s.payment_status = ?";
      queryParams.push(payment_status);
    }

    if (search) {
      baseQuery += `
        AND (
          s.sale_number LIKE ?
          OR s.client_name LIKE ?
        )
      `;

      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // =========================
    // COUNT QUERY
    // =========================

    const countQuery = `
      SELECT COUNT(*) as total
      ${baseQuery}
    `;

    const [countResult] = await pool.query(countQuery, queryParams);

    const total = countResult?.[0]?.total || 0;

    // =========================
    // MAIN QUERY
    // =========================

    let query = `
      SELECT 
        s.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.phone as client_phone,
        u.first_name as seller_name
      ${baseQuery}
    `;

    // =========================
    // SORTING
    // =========================

    const allowedSortColumns = [
      "sale_date",
      "total_amount",
      "sale_number",
      "created_at",
    ];

    const sortColumn = allowedSortColumns.includes(sort_by)
      ? sort_by
      : "created_at";

    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    query += ` ORDER BY s.${sortColumn} ${order}`;

    // =========================
    // PAGINATION
    // =========================

    const offset = (parseInt(page) - 1) * parseInt(limit);

    query += " LIMIT ? OFFSET ?";

    const salesParams = [...queryParams, parseInt(limit), offset];

    const [sales] = await pool.query(query, salesParams);

    // =========================
    // ITEMS COUNT
    // =========================

    for (const sale of sales) {
      const [itemsCount] = await pool.query(
        `
          SELECT COUNT(*) as count
          FROM sale_items
          WHERE sale_id = ?
        `,
        [sale.id],
      );

      sale.items_count = itemsCount?.[0]?.count || 0;
    }

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      data: {
        sales,
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

// ─── DÉTAILS D'UNE VENTE ────────────────────────────────
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [sales] = await pool.query(
      `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name,
              c.phone as client_phone, c.email as client_email, c.address as client_address,
              u.first_name as seller_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.seller_id = u.id
       WHERE s.id = ? AND s.company_id = ?`,
      [id, companyId],
    );

    if (sales.length === 0) {
      throw new AppError("Vente introuvable.", 404);
    }

    // Récupérer les items
    const [items] = await pool.query(
      `SELECT si.*, p.name as product_name, p.image_url as product_image,
              p.sku as product_sku, p.barcode as product_barcode,
              u.symbol as unit_symbol, c2.name as category_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN measurement_units u ON p.unit_id = u.id
       LEFT JOIN categories c2 ON p.category_id = c2.id
       WHERE si.sale_id = ?`,
      [id],
    );

    // Récupérer les mouvements de stock liés
    const [stockMovements] = await pool.query(
      `SELECT im.*, p.name as product_name
       FROM inventory_movements im
       JOIN products p ON im.product_id = p.id
       WHERE im.reference_type = 'sale' AND im.reference_id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      data: {
        sale: {
          ...sales[0],
          items,
          stock_movements: stockMovements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UNE VENTE ─────────────────────────────────
const updateSale = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const userId = req.user.id;

    const {
      client_id,
      client_name,
      items,
      discount_type,
      discount_value,
      payment_status,
      amount_paid,
      payment_method,
      payment_reference,
      notes,
    } = req.body;

    // =========================
    // 1. GET SALE
    // =========================
    const [sales] = await connection.query(
      "SELECT * FROM sales WHERE id = ? AND company_id = ?",
      [id, companyId],
    );

    if (sales.length === 0) {
      throw new AppError("Vente introuvable.", 404);
    }

    const sale = sales[0];

    if (sale.status === "canceled") {
      throw new AppError("Impossible de modifier une vente annulée.", 400);
    }

    // =========================
    // 2. IF ITEMS PROVIDED → FULL REBUILD
    // =========================
    if (items && items.length > 0) {
      // =========================
      // 2.1 GET OLD ITEMS
      // =========================
      const [oldItems] = await connection.query(
        `SELECT si.*, p.manage_stock, p.current_stock
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [id],
      );

      // =========================
      // 2.2 RESTORE STOCK
      // =========================
      for (const oldItem of oldItems) {
        if (oldItem.manage_stock) {
          const stockBefore = parseFloat(oldItem.current_stock);
          const stockAfter = stockBefore + parseFloat(oldItem.quantity);

          await connection.query(
            "UPDATE products SET current_stock = ? WHERE id = ?",
            [stockAfter, oldItem.product_id],
          );

          await connection.query(
            `INSERT INTO inventory_movements (
              company_id, product_id, movement_type, quantity,
              stock_before, stock_after, reference_type, reference_id, performed_by
            ) VALUES (?, ?, 'return_customer', ?, ?, ?, 'sale', ?, ?)`,
            [
              companyId,
              oldItem.product_id,
              oldItem.quantity,
              stockBefore,
              stockAfter,
              id,
              userId,
            ],
          );
        }
      }

      // =========================
      // 2.3 DELETE OLD ITEMS (IMPORTANT FIX)
      // =========================
      await connection.query("DELETE FROM sale_items WHERE sale_id = ?", [id]);

      // =========================
      // 2.4 CREATE NEW ITEMS
      // =========================
      let subtotal = 0;

      for (const item of items) {
        const [products] = await connection.query(
          `SELECT id, company_id, cost_price, retail_price,
                  wholesale_price, manage_stock, current_stock, name
           FROM products
           WHERE id = ? AND deleted_at IS NULL`,
          [item.product_id],
        );

        if (products.length === 0) {
          throw new AppError(`Produit ID ${item.product_id} introuvable.`, 404);
        }

        const product = products[0];

        if (product.company_id !== companyId) {
          throw new AppError(
            `Le produit "${product.name}" n'appartient pas à cette entreprise.`,
            403,
          );
        }

        if (product.manage_stock && product.current_stock < item.quantity) {
          throw new AppError(
            `Stock insuffisant pour "${product.name}". Disponible: ${product.current_stock}`,
            400,
          );
        }

        // =========================
        // PRICE TYPE LOGIC FIX
        // =========================
        const unit = parseFloat(item.unit_price);
        const retail = parseFloat(product.retail_price);
        const wholesale = parseFloat(product.wholesale_price);

        let priceType = "custom";

        if (unit === retail) {
          priceType = "retail";
        } else if (unit === wholesale) {
          priceType = "wholesale";
        }

        const discountAmount = parseFloat(item.discount_amount || 0);

        const totalPrice = unit * item.quantity - discountAmount;

        subtotal += totalPrice;

        // =========================
        // INSERT ITEM
        // =========================
        await connection.query(
          `INSERT INTO sale_items (
            sale_id, product_id, variant_id, quantity,
            price_type, unit_price,
            retail_price_ref, wholesale_price_ref,
            total_price, discount_amount,
            cost_price, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.product_id,
            item.variant_id || null,
            item.quantity,
            priceType,
            unit,
            product.retail_price,
            product.wholesale_price,
            totalPrice,
            discountAmount,
            product.cost_price,
            item.notes || null,
          ],
        );

        // =========================
        // UPDATE STOCK
        // =========================
        if (product.manage_stock) {
          const stockBefore = parseFloat(product.current_stock);

          const stockAfter = Math.max(0, stockBefore - item.quantity);

          await connection.query(
            "UPDATE products SET current_stock = ? WHERE id = ?",
            [stockAfter, item.product_id],
          );

          await connection.query(
            `INSERT INTO inventory_movements (
              company_id, product_id, movement_type, quantity,
              stock_before, stock_after, reference_type,
              reference_id, unit_cost, performed_by
            ) VALUES (?, ?, 'sale', ?, ?, ?, 'sale', ?, ?, ?)`,
            [
              companyId,
              item.product_id,
              -item.quantity,
              stockBefore,
              stockAfter,
              id,
              product.cost_price,
              userId,
            ],
          );
        }
      }

      // =========================
      // 2.5 RECALCUL TOTALS
      // =========================
      let discountAmount = 0;

      if (discount_type === "percentage" && discount_value) {
        discountAmount = subtotal * (parseFloat(discount_value) / 100);
      } else if (discount_type === "fixed" && discount_value) {
        discountAmount = parseFloat(discount_value);
      }

      const totalAmount = subtotal - discountAmount;

      const finalAmountPaid =
        payment_status === "paid" ? totalAmount : parseFloat(amount_paid) || 0;

      const amountDue = totalAmount - finalAmountPaid;

      // =========================
      // 2.6 UPDATE SALE
      // =========================
      await connection.query(
        `UPDATE sales SET
          client_id = ?, client_name = ?,
          subtotal = ?, discount_amount = ?,
          discount_type = ?, discount_value = ?,
          total_amount = ?,
          payment_status = ?,
          amount_paid = ?,
          amount_due = ?,
          payment_method = ?,
          payment_reference = ?,
          notes = ?
         WHERE id = ?`,
        [
          client_id || null,
          client_name || null,
          subtotal,
          discountAmount,
          discount_type || sale.discount_type,
          discount_value || sale.discount_value,
          totalAmount,
          payment_status || sale.payment_status,
          finalAmountPaid,
          amountDue,
          payment_method || sale.payment_method,
          payment_reference || sale.payment_reference,
          notes || sale.notes,
          id,
        ],
      );
    }

    // =========================
    // 3. UPDATE WITHOUT ITEMS
    // =========================
    else {
      const updateFields = [];
      const updateValues = [];

      if (client_id !== undefined) {
        updateFields.push("client_id = ?");
        updateValues.push(client_id);
      }

      if (client_name !== undefined) {
        updateFields.push("client_name = ?");
        updateValues.push(client_name);
      }

      if (discount_type !== undefined) {
        updateFields.push("discount_type = ?");
        updateValues.push(discount_type);
      }

      if (discount_value !== undefined) {
        updateFields.push("discount_value = ?");
        updateValues.push(discount_value);
      }

      if (payment_method !== undefined) {
        updateFields.push("payment_method = ?");
        updateValues.push(payment_method);
      }

      if (payment_reference !== undefined) {
        updateFields.push("payment_reference = ?");
        updateValues.push(payment_reference);
      }

      if (notes !== undefined) {
        updateFields.push("notes = ?");
        updateValues.push(notes);
      }

      if (payment_status !== undefined) {
        updateFields.push("payment_status = ?");
        updateValues.push(payment_status);

        if (payment_status === "paid") {
          updateFields.push("amount_paid = ?", "amount_due = ?");
          updateValues.push(sale.total_amount, 0);
        } else if (amount_paid !== undefined) {
          updateFields.push("amount_paid = ?", "amount_due = ?");
          updateValues.push(amount_paid, sale.total_amount - amount_paid);
        }
      }

      if (updateFields.length > 0) {
        updateValues.push(id);

        await connection.query(
          `UPDATE sales SET ${updateFields.join(", ")} WHERE id = ?`,
          updateValues,
        );
      }
    }

    // =========================
    // 4. COMMIT
    // =========================
    await connection.commit();

    // =========================
    // 5. RETURN UPDATED SALE
    // =========================
    const [updatedSales] = await connection.query(
      `SELECT s.*,
              c.first_name as client_first_name,
              c.last_name as client_last_name,
              u.first_name as seller_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.seller_id = u.id
       WHERE s.id = ?`,
      [id],
    );

    const [updatedItems] = await connection.query(
      `SELECT si.*, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Vente mise à jour avec succès.",
      data: {
        sale: {
          ...updatedSales[0],
          items: updatedItems,
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

// ─── ANNULER UNE VENTE ──────────────────────────────────
const cancelSale = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const { cancel_reason } = req.body;
    const userId = req.user.id;

    // Récupérer la vente
    const [sales] = await connection.query(
      "SELECT * FROM sales WHERE id = ? AND company_id = ?",
      [id, companyId],
    );

    if (sales.length === 0) {
      throw new AppError("Vente introuvable.", 404);
    }

    const sale = sales[0];

    if (sale.status === "canceled") {
      throw new AppError("Cette vente est déjà annulée.", 400);
    }

    // Récupérer les items
    const [saleItems] = await connection.query(
      `SELECT si.*, p.manage_stock, p.current_stock
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id],
    );

    // Restaurer les stocks
    for (const item of saleItems) {
      if (item.manage_stock) {
        const stockBefore = parseFloat(item.current_stock);
        const stockAfter = stockBefore + parseFloat(item.quantity);

        await connection.query(
          "UPDATE products SET current_stock = ? WHERE id = ?",
          [stockAfter, item.product_id],
        );

        // Enregistrer le mouvement de retour
        await connection.query(
          `INSERT INTO inventory_movements (
            company_id, product_id, movement_type, quantity,
            stock_before, stock_after, reference_type, reference_id, performed_by
          ) VALUES (?, ?, 'return_customer', ?, ?, ?, 'sale', ?, ?)`,
          [
            companyId,
            item.product_id,
            item.quantity,
            stockBefore,
            stockAfter,
            id,
            userId,
          ],
        );
      }
    }

    // Marquer les items comme annulés
    await connection.query(
      'UPDATE sale_items SET item_status = "canceled" WHERE sale_id = ?',
      [id],
    );

    // Annuler la vente
    await connection.query(
      'UPDATE sales SET status = "canceled", cancel_reason = ? WHERE id = ?',
      [cancel_reason || "Annulation manuelle", id],
    );

    // Mettre à jour la dette du client si existant
    if (sale.client_id && sale.payment_status === "debt") {
      await connection.query(
        "UPDATE clients SET current_debt = GREATEST(current_debt - ?, 0) WHERE id = ?",
        [sale.amount_due, sale.client_id],
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Vente annulée avec succès. Les stocks ont été restaurés.",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── STATISTIQUES RAPIDES ───────────────────────────────
const getSalesStats = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    // Stats du jour
    const [todayStats] = await pool.query(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_sale
       FROM sales
       WHERE company_id = ? AND DATE(sale_date) = CURDATE() AND status = 'completed'`,
      [companyId],
    );

    // Stats du mois
    const [monthStats] = await pool.query(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue
       FROM sales
       WHERE company_id = ? AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE()) AND status = 'completed'`,
      [companyId],
    );

    // Dettes en cours
    const [debtStats] = await pool.query(
      `SELECT
         COUNT(*) as total_debts,
         COALESCE(SUM(amount_due), 0) as total_due
       FROM sales
       WHERE company_id = ? AND payment_status = 'debt' AND status = 'completed'`,
      [companyId],
    );

    // Top produits
    const [topProducts] = await pool.query(
      `SELECT p.name, p.id, SUM(si.quantity) as total_sold, SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ? AND s.status = 'completed'
       GROUP BY p.id, p.name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [companyId],
    );

    res.status(200).json({
      success: true,
      data: {
        today: todayStats[0],
        this_month: monthStats[0],
        debts: debtStats[0],
        top_products: topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  cancelSale,
  getSalesStats,
};
