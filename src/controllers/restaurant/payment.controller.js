// controllers/restaurant/payment.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');
const debtService = require('../../services/restaurant/debtService');

// ─── AJOUTER UN PAIEMENT ────────────────────────────────
const createPayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { client_debt_id, amount, payment_method, payment_reference, payment_date, note } = req.body;
        const companyId = req.company.id;
        const userId = req.user.id;

        const [debts] = await connection.query(
            'SELECT * FROM client_debts WHERE id = ? AND company_id = ?',
            [client_debt_id, companyId]
        );
        if (debts.length === 0) throw new AppError('Dette introuvable.', 404);

        const debt = debts[0];
        if (['canceled', 'paid'].includes(debt.status)) {
            throw new AppError(`Dette ${debt.status === 'paid' ? 'déjà soldée' : 'annulée'}.`, 400);
        }

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new AppError("Le montant du paiement doit être supérieur à 0 FCFA.", 400);
        }
        if (paymentAmount > parseFloat(debt.remaining_amount)) {
            throw new AppError(
                `Montant supérieur au reste à payer (${parseFloat(debt.remaining_amount).toLocaleString()} FCFA).`,
                400
            );
        }

        await connection.query(
            `INSERT INTO debt_payments (company_id, client_debt_id, amount, payment_method, payment_reference, payment_date, received_by, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, client_debt_id, paymentAmount, payment_method || 'cash', payment_reference || null, payment_date || new Date().toISOString().split('T')[0], userId, note || null]
        );

        const [totalPaidResult] = await connection.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE client_debt_id = ?',
            [client_debt_id]
        );
        const totalPaid = parseFloat(totalPaidResult[0].total);
        const newRemaining = Math.max(0, parseFloat(debt.total_amount) - totalPaid);
        const newStatus = debtService.calculateDebtStatus(debt.total_amount, newRemaining);

        await connection.query(
            'UPDATE client_debts SET remaining_amount = ?, status = ? WHERE id = ?',
            [newRemaining, newStatus, client_debt_id]
        );

        await debtService.recalculateClientDebt(connection, debt.client_id, companyId);
        await connection.commit();

        const updatedDebt = await debtService.getEnrichedDebtById(connection, client_debt_id, companyId);

        res.status(201).json({
            success: true,
            message: 'Paiement enregistré.',
            data: { debt: updatedDebt },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES PAIEMENTS ───────────────────────────────
const getPayments = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1, limit = 20, client_debt_id, payment_method,
            start_date, end_date, sort_by = 'created_at', sort_order = 'DESC',
        } = req.query;

        let query = `
      SELECT dp.*,
             c.full_name as client_name, c.phone as client_phone,
             cd.total_amount as debt_total, cd.remaining_amount as debt_remaining,
             s.sale_number,
             u.first_name as received_by_name
      FROM debt_payments dp
      JOIN client_debts cd ON dp.client_debt_id = cd.id
      JOIN clients c ON cd.client_id = c.id
      LEFT JOIN sales s ON cd.sale_id = s.id
      LEFT JOIN users u ON dp.received_by = u.id
      WHERE dp.company_id = ?
    `;
        const queryParams = [companyId];

        if (client_debt_id) { query += ' AND dp.client_debt_id = ?'; queryParams.push(client_debt_id); }
        if (payment_method) { query += ' AND dp.payment_method = ?'; queryParams.push(payment_method); }
        if (start_date) { query += ' AND dp.payment_date >= ?'; queryParams.push(start_date); }
        if (end_date) { query += ' AND dp.payment_date <= ?'; queryParams.push(end_date); }

        const countQuery = query.replace(/SELECT dp\.\*,.*FROM/s, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await pool.query(countQuery, queryParams);
        const total = countResult[0].total;

        query += ` ORDER BY dp.${sort_by === 'amount' ? 'amount' : 'created_at'} ${sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const [payments] = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            data: { payments },
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UN PAIEMENT ───────────────────────────────
const updatePayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;
        const { amount, payment_method, payment_reference, payment_date, note } = req.body;

        const [payments] = await connection.query(
            'SELECT * FROM debt_payments WHERE id = ? AND company_id = ?',
            [id, companyId]
        );
        if (payments.length === 0) throw new AppError('Paiement introuvable.', 404);

        const payment = payments[0];

        const updateFields = [];
        const updateValues = [];
        if (amount !== undefined) {
            const paymentAmount = parseFloat(amount);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                throw new AppError("Le montant du paiement doit être supérieur à 0 FCFA.", 400);
            }
            updateFields.push('amount = ?');
            updateValues.push(paymentAmount);
        }
        if (payment_method !== undefined) { updateFields.push('payment_method = ?'); updateValues.push(payment_method); }
        if (payment_reference !== undefined) { updateFields.push('payment_reference = ?'); updateValues.push(payment_reference); }
        if (payment_date !== undefined) { updateFields.push('payment_date = ?'); updateValues.push(payment_date); }
        if (note !== undefined) { updateFields.push('note = ?'); updateValues.push(note); }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await connection.query(`UPDATE debt_payments SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        }

        const [totalPaidResult] = await connection.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE client_debt_id = ?',
            [payment.client_debt_id]
        );
        const totalPaid = parseFloat(totalPaidResult[0].total);
        const [debts] = await connection.query('SELECT * FROM client_debts WHERE id = ?', [payment.client_debt_id]);
        const debt = debts[0];
        const newRemaining = Math.max(0, parseFloat(debt.total_amount) - totalPaid);
        const newStatus = debtService.calculateDebtStatus(debt.total_amount, newRemaining);

        await connection.query(
            'UPDATE client_debts SET remaining_amount = ?, status = ? WHERE id = ?',
            [newRemaining, newStatus, payment.client_debt_id]
        );

        await debtService.recalculateClientDebt(connection, debt.client_id, companyId);
        await connection.commit();

        res.status(200).json({ success: true, message: 'Paiement modifié.' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── SUPPRIMER UN PAIEMENT ──────────────────────────────
const deletePayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;

        const [payments] = await connection.query(
            'SELECT * FROM debt_payments WHERE id = ? AND company_id = ?',
            [id, companyId]
        );
        if (payments.length === 0) throw new AppError('Paiement introuvable.', 404);

        const payment = payments[0];
        const clientDebtId = payment.client_debt_id;

        await connection.query('DELETE FROM debt_payments WHERE id = ?', [id]);

        const [totalPaidResult] = await connection.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE client_debt_id = ?',
            [clientDebtId]
        );
        const totalPaid = parseFloat(totalPaidResult[0].total);
        const [debts] = await connection.query('SELECT * FROM client_debts WHERE id = ?', [clientDebtId]);
        const debt = debts[0];
        const newRemaining = Math.max(0, parseFloat(debt.total_amount) - totalPaid);
        const newStatus = debtService.calculateDebtStatus(debt.total_amount, newRemaining);

        await connection.query(
            'UPDATE client_debts SET remaining_amount = ?, status = ? WHERE id = ?',
            [newRemaining, newStatus, clientDebtId]
        );

        await debtService.recalculateClientDebt(connection, debt.client_id, companyId);
        await connection.commit();

        res.status(200).json({ success: true, message: 'Paiement supprimé.' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = { createPayment, getPayments, updatePayment, deletePayment };