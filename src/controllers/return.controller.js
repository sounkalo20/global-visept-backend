const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── GÉNÉRER UN NUMÉRO DE RETOUR UNIQUE ──────────────────
const generateReturnNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `RET-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

  const [rows] = await connection.query(
    `SELECT return_number FROM sale_returns
     WHERE company_id = ? AND return_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [companyId, `${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNumber = rows[0].return_number;
    const lastSeq = parseInt(lastNumber.split("-").pop());
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(5, "0")}`;
};

// ─── CRÉER UN RETOUR ────────────────────────────────────
const createReturn = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { sale_id, items, notes } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;

    // 1. Vérifier la vente
    const [sales] = await connection.query(
      `SELECT * FROM sales WHERE id = ? AND company_id = ?`,
      [sale_id, companyId]
    );

    if (sales.length === 0) {
      throw new AppError("Vente introuvable.", 404);
    }
    const sale = sales[0];

    // 2. Parcourir les items et valider les quantités
    let totalAmountReturned = 0;
    const returnItemsData = [];

    for (const item of items) {
      const [saleItems] = await connection.query(
        `SELECT si.*, p.manage_stock, p.current_stock, p.name as product_name, p.cost_price 
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.id = ? AND si.sale_id = ?`,
        [item.sale_item_id, sale_id]
      );

      if (saleItems.length === 0) {
        throw new AppError(`Produit vendu (ID: ${item.sale_item_id}) introuvable dans cette vente.`, 404);
      }

      const saleItem = saleItems[0];
      const quantityToReturn = Number(item.quantity);

      const [existingReturns] = await connection.query(
        `SELECT SUM(quantity) as returned_qty FROM sale_return_items WHERE sale_item_id = ?`,
        [saleItem.id]
      );
      
      const alreadyReturned = existingReturns[0].returned_qty || 0;
      const remainingQty = saleItem.quantity - alreadyReturned;

      if (quantityToReturn > remainingQty) {
        throw new AppError(`Impossible de retourner ${quantityToReturn} de "${saleItem.product_name}". Il n'en reste que ${remainingQty} à retourner.`, 400);
      }

      const unitPrice = Number(saleItem.unit_price);
      let itemTotalPrice = unitPrice * quantityToReturn;
      totalAmountReturned += itemTotalPrice;

      returnItemsData.push({
        saleItem,
        quantity: quantityToReturn,
        unitPrice,
        totalPrice: itemTotalPrice,
        returnType: item.return_type,
        reason: item.reason || null
      });
    }

    // 3. Créer le sale_return
    const returnNumber = await generateReturnNumber(connection, companyId);

    const [returnResult] = await connection.query(
      `INSERT INTO sale_returns (
        company_id, sale_id, return_number, total_amount_returned, created_by, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [companyId, sale_id, returnNumber, totalAmountReturned, userId, notes || null]
    );

    const returnId = returnResult.insertId;

    // 4. Insérer les items de retour et mettre à jour les stocks / mouvements
    for (const data of returnItemsData) {
      const { saleItem, quantity, unitPrice, totalPrice, returnType, reason } = data;

      await connection.query(
        `INSERT INTO sale_return_items (
          sale_return_id, sale_item_id, product_id, variant_id, quantity, unit_price, total_price, return_type, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [returnId, saleItem.id, saleItem.product_id, saleItem.variant_id || null, quantity, unitPrice, totalPrice, returnType, reason]
      );

      // Gestion du stock
      if (saleItem.manage_stock) {
        const stockBefore = Number(saleItem.current_stock);
        let stockAfter = stockBefore;
        let movementType = 'return_customer';

        if (returnType === 'reintegrable') {
          stockAfter = stockBefore + quantity;
          await connection.query(
            "UPDATE products SET current_stock = ? WHERE id = ?",
            [stockAfter, saleItem.product_id]
          );
        } else if (returnType === 'defective') {
          movementType = 'return_defective';
        }

        await connection.query(
          `INSERT INTO inventory_movements (
            company_id, product_id, movement_type, quantity,
            stock_before, stock_after, reference_type, reference_id,
            unit_cost, performed_by, note
          ) VALUES (?, ?, ?, ?, ?, ?, 'sale', ?, ?, ?, ?)`,
          [
            companyId,
            saleItem.product_id,
            movementType,
            returnType === 'reintegrable' ? quantity : 0,
            stockBefore,
            stockAfter,
            sale_id,
            saleItem.cost_price,
            userId,
            reason
          ]
        );
      }
    }

    // 5. Mettre à jour la vente originale avec le returned_amount
    const newReturnedAmount = Number(sale.returned_amount) + totalAmountReturned;
    await connection.query(
      `UPDATE sales SET returned_amount = ? WHERE id = ?`,
      [newReturnedAmount, sale_id]
    );

    // ======================================================
    // 6. GESTION DE CAISSE — Enregistrer le remboursement
    // ======================================================
    // Récupérer les paiements originaux de la vente (avec leur session de caisse)
    const [salePayments] = await connection.query(
      `SELECT cash_session_id, payment_method, amount FROM sale_payments WHERE sale_id = ?`,
      [sale_id]
    );

    // Chercher si une session de caisse était liée à cette vente
    const originalSessionId = salePayments.find(p => p.cash_session_id)?.cash_session_id || null;

    if (originalSessionId) {
      // Cette vente était liée à une session de caisse
      // Chercher si la session est encore ouverte
      const [sessionCheck] = await connection.query(
        `SELECT id, status FROM cash_sessions WHERE id = ? LIMIT 1`,
        [originalSessionId]
      );

      // Chercher s'il y a une session courante ouverte (pour l'utilisateur actuel ou la même caisse)
      const [currentOpenSession] = await connection.query(
        `SELECT id FROM cash_sessions 
         WHERE company_id = ? AND status = 'open' 
         ORDER BY opened_at DESC LIMIT 1`,
        [companyId]
      );

      // Déterminer la session à utiliser pour le mouvement de remboursement :
      // - Si la session originale est encore ouverte → on l'utilise
      // - Sinon, si une autre session est ouverte → on l'utilise
      // - Sinon → on ne crée pas de mouvement de caisse (cohérence comptable)
      let targetSessionId = null;
      if (sessionCheck.length > 0 && sessionCheck[0].status === 'open') {
        targetSessionId = originalSessionId;
      } else if (currentOpenSession.length > 0) {
        targetSessionId = currentOpenSession[0].id;
      }

      if (targetSessionId) {
        // Calculer le montant remboursé par mode de paiement (proratisé)
        const totalOriginalPaid = salePayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        for (const payment of salePayments) {
          if (!payment.cash_session_id) continue;
          
          // Proratiser le remboursement selon la proportion payée par ce moyen
          const ratio = totalOriginalPaid > 0 ? Number(payment.amount) / totalOriginalPaid : 1;
          const refundAmount = Math.round(totalAmountReturned * ratio);
          
          if (refundAmount <= 0) continue;

          // Enregistrer le mouvement de remboursement dans la caisse
          await connection.query(
            `INSERT INTO cash_movements (session_id, type, payment_method, amount, reference_id, notes)
             VALUES (?, 'sale_refund', ?, ?, ?, ?)`,
            [targetSessionId, payment.payment_method, refundAmount, returnId, `Retour ${returnNumber} (vente ${sale.sale_number})`]
          );

          // Si paiement en espèces → réduire le expected_closing_amount
          if (payment.payment_method === 'cash') {
            await connection.query(
              `UPDATE cash_sessions SET expected_closing_amount = GREATEST(0, expected_closing_amount - ?) WHERE id = ?`,
              [refundAmount, targetSessionId]
            );
          }
        }
      }
      // Si targetSessionId est null → retour sans session ouverte → aucun mouvement de caisse (comportement correct)
    }
    // Si originalSessionId est null → vente sans session (vente manuelle) → aucun mouvement de caisse

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Retour enregistré avec succès.",
      data: {
        return_id: returnId,
        return_number: returnNumber,
        total_amount_returned: totalAmountReturned,
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};



// ─── LISTER TOUS LES RETOURS ────────────────────────────
const getReturns = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { page = 1, limit = 20, sale_id } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let baseQuery = `FROM sale_returns sr
                     JOIN sales s ON sr.sale_id = s.id
                     LEFT JOIN users u ON sr.created_by = u.id
                     WHERE sr.company_id = ?`;
    let queryParams = [companyId];

    if (sale_id) {
      baseQuery += ` AND sr.sale_id = ?`;
      queryParams.push(sale_id);
    }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, queryParams);
    const total = countResult[0].total;

    let query = `
      SELECT sr.*, s.sale_number, u.first_name as created_by_name 
      ${baseQuery}
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);

    const [returns] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: {
        returns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENIR UN RETOUR PAR ID ───────────────────────────
const getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [returns] = await pool.query(
      `SELECT sr.*, s.sale_number, u.first_name as created_by_name 
       FROM sale_returns sr
       JOIN sales s ON sr.sale_id = s.id
       LEFT JOIN users u ON sr.created_by = u.id
       WHERE sr.id = ? AND sr.company_id = ?`,
      [id, companyId]
    );

    if (returns.length === 0) {
      throw new AppError("Retour introuvable.", 404);
    }

    const [items] = await pool.query(
      `SELECT sri.*, p.name as product_name, p.image_url as product_image, p.sku
       FROM sale_return_items sri
       JOIN products p ON sri.product_id = p.id
       WHERE sri.sale_return_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...returns[0],
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReturn,
  getReturns,
  getReturnById
};
