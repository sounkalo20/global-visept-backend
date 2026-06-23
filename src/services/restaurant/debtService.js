// services/restaurant/debtService.js
const debtService = {
    validateClient: async (connection, clientId, companyId) => {
        const [clients] = await connection.query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [clientId, companyId]
        );
        if (clients.length === 0) throw new AppError('Client introuvable.', 404);
        if (!clients[0].is_active) throw new AppError('Client désactivé.', 400);
        return clients[0];
    },

    calculateDebtStatus: (totalAmount, remainingAmount) => {
        const total = parseFloat(totalAmount);
        const remaining = parseFloat(remainingAmount);
        if (remaining <= 0) return 'paid';
        if (remaining < total) return 'partial';
        return 'pending';
    },

    recalculateClientDebt: async (connection, clientId, companyId) => {
        const [result] = await connection.query(
            `SELECT COALESCE(SUM(remaining_amount), 0) as total_debt
       FROM client_debts
       WHERE client_id = ? AND company_id = ? AND status NOT IN ('paid', 'canceled')`,
            [clientId, companyId]
        );
        await connection.query(
            'UPDATE clients SET current_debt = ?, updated_at = NOW() WHERE id = ?',
            [result[0].total_debt, clientId]
        );
    },

    getEnrichedDebtById: async (connection, debtId, companyId) => {
        const [debts] = await connection.query(
            `SELECT cd.*,
              c.full_name as client_name, c.phone as client_phone, c.email as client_email,
              s.sale_number, s.total_amount as sale_total, s.sale_date,
              s.subtotal as sale_subtotal, s.discount_amount as sale_discount_amount,
              s.discount_type as sale_discount_type, s.discount_value as sale_discount_value,
              (SELECT COUNT(*) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as payments_count,
              (SELECT COALESCE(SUM(dp.amount), 0) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as total_paid
       FROM client_debts cd
       JOIN clients c ON cd.client_id = c.id
       LEFT JOIN sales s ON cd.sale_id = s.id
       WHERE cd.id = ? AND cd.company_id = ?`,
            [debtId, companyId]
        );
        return debts.length > 0 ? debts[0] : null;
    },
};

module.exports = debtService;