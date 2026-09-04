const pool = require("../config/db");

/**
 * Services utilitaires réutilisables pour les dettes
 */

// Recalculer le statut d'une dette selon remaining_amount vs total_amount
const calculateDebtStatus = (totalAmount, remainingAmount) => {
  const total = parseFloat(totalAmount);
  const remaining = parseFloat(remainingAmount);
  if (remaining <= 0) return "paid";
  if (remaining < total) return "partial";
  return "pending";
};

// Recalculer current_debt du client
const recalculateClientDebt = async (connection, clientId, companyId) => {
  const [result] = await connection.query(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total_debt
     FROM client_debts
     WHERE client_id = ? AND company_id = ? AND status NOT IN ('canceled', 'paid')`,
    [clientId, companyId],
  );
  const totalDebt = parseFloat(result[0].total_debt);

  await connection.query(
    "UPDATE clients SET current_debt = ? WHERE id = ? AND company_id = ?",
    [totalDebt, clientId, companyId],
  );

  return totalDebt;
};

// Vérifier qu'une vente existe et appartient à l'entreprise
const validateSale = async (connection, saleId, companyId) => {
  const [sales] = await connection.query(
    "SELECT id, status FROM sales WHERE id = ? AND company_id = ?",
    [saleId, companyId],
  );
  if (sales.length === 0) {
    throw new (require("../utils/AppError"))(
      "Vente introuvable dans cette entreprise.",
      404,
    );
  }
  if (sales[0].status === "canceled") {
    throw new (require("../utils/AppError"))(
      "Impossible de créer une dette sur une vente annulée.",
      400,
    );
  }
  return sales[0];
};

// Vérifier qu'un client existe et appartient à l'entreprise
// Remplacer validateClient par :
const validateClient = async (connection, clientId, companyId) => {
  const [clients] = await connection.query(
    "SELECT id, full_name FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
    [clientId, companyId],
  );
  if (clients.length === 0) {
    throw new (require("../utils/AppError"))(
      "Client introuvable dans cette entreprise.",
      404,
    );
  }
  return clients[0];
};

// Récupérer une dette avec toutes ses infos enrichies
const getEnrichedDebtById = async (connection, debtId, companyId) => {
  const [debts] = await connection.query(
    `SELECT cd.*,

            c.full_name as client_name,
            c.phone as client_phone,
            c.email as client_email,

            s.sale_number,
            s.total_amount as sale_total,
            s.payment_status as sale_payment_status,
            s.sale_date,
            s.status as sale_status,
            s.subtotal as sale_subtotal,
            s.discount_amount as sale_discount_amount,
            s.discount_type as sale_discount_type,
            s.discount_value as sale_discount_value,

            u.id as seller_id,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name,
            u.email as seller_email,

            (SELECT COUNT(*) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as payments_count,
            (SELECT COALESCE(SUM(dp.amount), 0) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as total_paid

     FROM client_debts cd
     JOIN clients c ON cd.client_id = c.id
     LEFT JOIN sales s ON cd.sale_id = s.id
     LEFT JOIN users u ON s.seller_id = u.id

     WHERE cd.id = ? AND cd.company_id = ?`,
    [debtId, companyId],
  );

  return debts[0] || null;
};

module.exports = {
  calculateDebtStatus,
  recalculateClientDebt,
  validateSale,
  validateClient,
  getEnrichedDebtById,
};
