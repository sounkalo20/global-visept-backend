const pool = require("../config/db");
const AppError = require("../utils/AppError");
const debtService = require("../services/debt.service");

// ─── GÉNÉRER UN NUMÉRO DE VENTE ─────────────────────────
const generateSaleNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `VTE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const [rows] = await connection.query(
    "SELECT sale_number FROM sales WHERE company_id = ? AND sale_number LIKE ? ORDER BY id DESC LIMIT 1",
    [companyId, `${prefix}%`],
  );
  let sequence = 1;
  if (rows.length > 0) {
    const lastSeq = parseInt(rows[0].sale_number.split("-").pop());
    sequence = lastSeq + 1;
  }
  return `${prefix}-${String(sequence).padStart(5, "0")}`;
};

// ─── CRÉER UNE DETTE (CRÉE LA VENTE D'ABORD) ────────────
const createDebt = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      client_id,
      items, 
      discount_type = "none",
      discount_value = 0,
      amount_paid = 0,
      payment_method = "cash",
      payment_reference = null,
      due_date = null,
      notes = null,
      client_name = null, // si client passager
    } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;

    // ═══════════════════════════════════════════════
    // 1. VALIDER LE CLIENT
    // ═══════════════════════════════════════════════
    let client = null;

    if (client_id) {
      client = await debtService.validateClient(
        connection,
        client_id,
        companyId,
      );
    }

    // ═══════════════════════════════════════════════
    // 2. VALIDER LES PRODUITS ET CALCULER LES TOTAUX
    // ═══════════════════════════════════════════════
    if (!items || items.length === 0) {
      throw new AppError("Au moins un article est requis.", 400);
    }

    let subtotal = 0;
    const saleItemsData = [];

    for (const item of items) {
      const [products] = await connection.query(
        `SELECT id, company_id, cost_price, retail_price, wholesale_price,
                wholesale_min_qty, manage_stock, current_stock, name
         FROM products WHERE id = ? AND deleted_at IS NULL`,
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

      // Vérifier le stock
      if (product.manage_stock && product.current_stock < item.quantity) {
        throw new AppError(
          `Stock insuffisant pour "${product.name}". Disponible: ${product.current_stock}, Demandé: ${item.quantity}`,
          400,
        );
      }

      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new AppError("La quantité de chaque article doit être supérieure à 0.", 400);
      }
      const unitPrice = parseFloat(item.unit_price !== undefined ? item.unit_price : product.retail_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new AppError("Le prix unitaire ne peut pas être négatif.", 400);
      }
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      saleItemsData.push({
        product,
        item: { ...item, unit_price: unitPrice, quantity },
        totalPrice,
      });
    }

    // ═══════════════════════════════════════════════
    // 3. CALCULER REMISE ET TOTAL
    // ═══════════════════════════════════════════════
    let discountAmount = 0;
    if (discount_type === "percentage") {
      const discVal = parseFloat(discount_value);
      if (isNaN(discVal) || discVal < 0 || discVal > 100) {
        throw new AppError("Le pourcentage de remise doit être compris entre 0 et 100%.", 400);
      }
      discountAmount = subtotal * (discVal / 100);
    } else if (discount_type === "fixed") {
      const discVal = parseFloat(discount_value);
      if (isNaN(discVal) || discVal < 0) {
        throw new AppError("Le montant de la remise fixe ne peut pas être négatif.", 400);
      }
      discountAmount = discVal;
    }

    const totalAmount = subtotal - discountAmount;
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new AppError("Impossible d'enregistrer cette dette. Le montant total doit être supérieur à 0 FCFA. Vérifiez les prix et remises des produits.", 400);
    }

    const amountPaid = parseFloat(amount_paid || 0);
    const amountDue = totalAmount - amountPaid;

    // ═══════════════════════════════════════════════
    // 4. CRÉER LA VENTE
    // ═══════════════════════════════════════════════
    const saleNumber = await generateSaleNumber(connection, companyId);

    const [saleResult] = await connection.query(
      `INSERT INTO sales (
        company_id, sale_number, client_id, client_name,
        subtotal, discount_amount, discount_type, discount_value,
        tax_amount, total_amount, payment_status, amount_paid, amount_due,
        payment_method, payment_reference, status, seller_id, notes, sale_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, NOW())`,
      [
        companyId,
        saleNumber,
        client_id || null,
        client_name || null,
        subtotal,
        discountAmount,
        discount_type,
        discount_value || null,
        totalAmount,
        amountPaid >= totalAmount ? "paid" : "debt",
        amountPaid,
        amountDue,
        payment_method,
        payment_reference || null,
        userId,
        notes || null,
      ],
    );
    const saleId = saleResult.insertId;

    // ═══════════════════════════════════════════════
    // 5. CRÉER LES SALE_ITEMS ET MAJ STOCK
    // ═══════════════════════════════════════════════
    for (const data of saleItemsData) {
      const { product, item, totalPrice } = data;

      await connection.query(
        `INSERT INTO sale_items (
          sale_id, product_id, quantity, price_type, unit_price,
          retail_price_ref, wholesale_price_ref, total_price,
          discount_amount, cost_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          saleId,
          item.product_id,
          item.quantity,
          item.price_type || "retail",
          item.unit_price,
          product.retail_price,
          product.wholesale_price,
          totalPrice,
          product.cost_price,
        ],
      );

      // Mettre à jour le stock
      if (product.manage_stock) {
        const stockBefore = parseFloat(product.current_stock);
        const stockAfter = stockBefore - item.quantity;

        await connection.query(
          "UPDATE products SET current_stock = ? WHERE id = ?",
          [stockAfter, item.product_id],
        );

        await connection.query(
          `INSERT INTO inventory_movements (
            company_id, product_id, movement_type, quantity,
            stock_before, stock_after, reference_type, reference_id,
            unit_cost, performed_by
          ) VALUES (?, ?, 'sale', ?, ?, ?, 'sale', ?, ?, ?)`,
          [
            companyId,
            item.product_id,
            -item.quantity,
            stockBefore,
            stockAfter,
            saleId,
            product.cost_price,
            userId,
          ],
        );
      }
    }

    // ═══════════════════════════════════════════════
    // 6. CRÉER LA DETTE SI MONTANT DÛ > 0
    // ═══════════════════════════════════════════════
    let debt = null;
    if (amountDue > 0) {
      const debtStatus = amountPaid > 0 ? "partial" : "pending";

      const [debtResult] = await connection.query(
        `INSERT INTO client_debts (company_id, client_id, sale_id, total_amount, remaining_amount, status, due_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          client_id || null,
          saleId,
          totalAmount,
          amountDue,
          debtStatus,
          due_date || null,
          notes || null,
          userId,
        ],
      );
      const debtId = debtResult.insertId;

      // ═══════════════════════════════════════════
      // 7. ENREGISTRER LE PAIEMENT INITIAL SI > 0
      // ═══════════════════════════════════════════
      if (amountPaid > 0) {
        await connection.query(
          `INSERT INTO debt_payments (company_id, client_debt_id, amount, payment_method, payment_reference, payment_date, received_by, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyId,
            debtId,
            amountPaid,
            payment_method,
            payment_reference || null,
            new Date().toISOString().split("T")[0],
            userId,
            "Paiement initial",
          ],
        );
      }

      // Recalculer la dette du client
      if (client_id) {
        await debtService.recalculateClientDebt(
          connection,
          client_id,
          companyId,
        );
      }

      // Récupérer la dette enrichie
      debt = await debtService.getEnrichedDebtById(
        connection,
        debtId,
        companyId,
      );

      // Ajouter les items de la vente
      const [saleItems] = await connection.query(
        `SELECT si.*, p.name as product_name, p.image_url, p.sku
         FROM sale_items si JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [saleId],
      );
      debt.sale_items = saleItems;
    }

    // Mettre à jour les stats client
    if (client_id) {
      await connection.query(
        `UPDATE clients SET
          total_purchases = total_purchases + ?,
          total_purchase_count = total_purchase_count + 1,
          last_purchase_at = NOW()
         WHERE id = ?`,
        [totalAmount, client_id],
      );
    }

    await connection.commit();

    // ═══════════════════════════════════════════════
    // 8. RÉPONSE
    // ═══════════════════════════════════════════════
    res.status(201).json({
      success: true,
      message:
        amountDue > 0
          ? "Vente à crédit créée avec succès."
          : "Vente créée avec succès.",
      data: {
        sale_id: saleId,
        sale_number: saleNumber,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_due: amountDue,
        debt: debt, // null si tout payé
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── LISTER LES DETTES ──────────────────────────────────
const getDebts = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      page = 1,
      limit = 20,
      status,
      client_id,
      sale_id,
      search,
      overdue,
      start_date,
      end_date,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    let query = `
      SELECT cd.*,
             c.full_name as client_name, c.phone as client_phone,
             s.sale_number, s.total_amount as sale_total, s.sale_date,s.subtotal as sale_subtotal, s.discount_amount as sale_discount_amount, s.discount_type as sale_discount_type, s.discount_value as sale_discount_value,
             (SELECT COUNT(*) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as payments_count,
             (SELECT COALESCE(SUM(dp.amount), 0) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as total_paid
      FROM client_debts cd
      JOIN clients c ON cd.client_id = c.id
      LEFT JOIN sales s ON cd.sale_id = s.id
      WHERE cd.company_id = ?
    `;
    const queryParams = [companyId];

    if (status) {
      query += " AND cd.status = ?";
      queryParams.push(status);
    }
    if (client_id) {
      query += " AND cd.client_id = ?";
      queryParams.push(client_id);
    }
    if (sale_id) {
      query += " AND cd.sale_id = ?";
      queryParams.push(sale_id);
    }
    if (overdue === "true") {
      query +=
        ' AND cd.due_date IS NOT NULL AND cd.due_date < CURDATE() AND cd.status NOT IN ("paid", "canceled")';
    }
    if (start_date) {
      query += " AND DATE(cd.created_at) >= ?";
      queryParams.push(start_date);
    }
    if (end_date) {
      query += " AND DATE(cd.created_at) <= ?";
      queryParams.push(end_date);
    }
    if (search) {
      query +=
        " AND (c.full_name LIKE ? OR c.phone LIKE ? OR s.sale_number LIKE ?)";
      const s = `%${search}%`;
      queryParams.push(s, s, s);
    }

    // Count
    const countQuery = query.replace(
      /SELECT cd\.\*,.*FROM/s,
      "SELECT COUNT(*) as total FROM",
    );
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Tri
    const allowed = [
      "created_at",
      "total_amount",
      "remaining_amount",
      "due_date",
    ];
    const sortCol = allowed.includes(sort_by) ? sort_by : "created_at";
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY cd.${sortCol} ${order}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    const [debts] = await pool.query(query, queryParams);

    // Pour chaque dette, récupérer les items de la vente
    for (const debt of debts) {
      if (debt.sale_id) {
        const [items] = await pool.query(
          `SELECT si.*, p.name as product_name, p.image_url
           FROM sale_items si JOIN products p ON si.product_id = p.id
           WHERE si.sale_id = ?`,
          [debt.sale_id],
        );
        debt.sale_items = items;
      }
    }

    res.status(200).json({
      success: true,
      data: { debts },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAIL D'UNE DETTE ────────────────────────────────
const getDebtById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const debt = await debtService.getEnrichedDebtById(pool, id, companyId);
    if (!debt) throw new AppError("Dette introuvable.", 404);

    // Récupérer les paiements
    const [payments] = await pool.query(
      `SELECT dp.*, u.first_name as received_by_name
       FROM debt_payments dp
       LEFT JOIN users u ON dp.received_by = u.id
       WHERE dp.client_debt_id = ?
       ORDER BY dp.payment_date DESC`,
      [id],
    );

    // Récupérer les items de la vente
    if (debt.sale_id) {
      const [items] = await pool.query(
        `SELECT si.*, p.name as product_name, p.image_url, p.sku
         FROM sale_items si JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [debt.sale_id],
      );
      debt.sale_items = items;
    }

    res.status(200).json({
      success: true,
      data: { debt: { ...debt, payments } },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UNE DETTE ─────────────────────────────────
const updateDebt = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const { total_amount, due_date, notes, status } = req.body;

    // Vérifier existence
    const [debts] = await connection.query(
      "SELECT * FROM client_debts WHERE id = ? AND company_id = ?",
      [id, companyId],
    );
    if (debts.length === 0) throw new AppError("Dette introuvable.", 404);

    const debt = debts[0];

    if (debt.status === "canceled")
      throw new AppError("Impossible de modifier une dette annulée.", 400);

    const updateFields = [];
    const updateValues = [];

    if (total_amount !== undefined) {
      const newTotal = parseFloat(total_amount);
      if (isNaN(newTotal) || newTotal <= 0) {
        throw new AppError("Le montant total de la dette doit être supérieur à 0 FCFA.", 400);
      }
      const totalPaid = parseFloat(
        (
          await connection.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE client_debt_id = ?",
            [id],
          )
        )[0][0].total,
      );

      const newRemaining = Math.max(0, newTotal - totalPaid);
      const newStatus = debtService.calculateDebtStatus(newTotal, newRemaining);

      updateFields.push(
        "total_amount = ?",
        "remaining_amount = ?",
        "status = ?",
      );
      updateValues.push(newTotal, newRemaining, newStatus);
    }

    if (due_date !== undefined) {
      updateFields.push("due_date = ?");
      updateValues.push(due_date);
    }
    if (notes !== undefined) {
      updateFields.push("notes = ?");
      updateValues.push(notes);
    }

    if (status !== undefined && total_amount === undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(
        `UPDATE client_debts SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );
    }

    await debtService.recalculateClientDebt(
      connection,
      debt.client_id,
      companyId,
    );
    await connection.commit();

    const updatedDebt = await debtService.getEnrichedDebtById(
      connection,
      id,
      companyId,
    );

    res.status(200).json({
      success: true,
      message: "Dette mise à jour.",
      data: { debt: updatedDebt },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── ANNULER UNE DETTE ──────────────────────────────────
const cancelDebt = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;

    const [debts] = await connection.query(
      "SELECT * FROM client_debts WHERE id = ? AND company_id = ?",
      [id, companyId],
    );
    if (debts.length === 0) throw new AppError("Dette introuvable.", 404);
    if (debts[0].status === "canceled")
      throw new AppError("Dette déjà annulée.", 400);

    await connection.query(
      'UPDATE client_debts SET status = "canceled", remaining_amount = 0 WHERE id = ?',
      [id],
    );

    await debtService.recalculateClientDebt(
      connection,
      debts[0].client_id,
      companyId,
    );
    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Dette annulée avec succès.",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── STATISTIQUES ───────────────────────────────────────
const getDebtStats = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const [stats] = await pool.query(
      `SELECT
         COUNT(*) as total_debts,
         COALESCE(SUM(remaining_amount), 0) as total_remaining,
         COALESCE(SUM(total_amount - remaining_amount), 0) as total_paid,
         COUNT(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('paid', 'canceled') THEN 1 END) as overdue_count,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM client_debts
       WHERE company_id = ?`,
      [companyId],
    );

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDebt,
  getDebts,
  getDebtById,
  updateDebt,
  cancelDebt,
  getDebtStats,
};
