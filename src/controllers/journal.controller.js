// src/controllers/journal.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Calculer la plage de dates selon la période demandée
 */
function parseDateRange(query) {
  const { period = 'this_month', startDate, endDate } = query;
  const now = new Date();
  let start = new Date();
  let end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week': {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_week': {
      const lastWeekDay = start.getDay();
      const lastWeekDiff = start.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1) - 7;
      start.setDate(lastWeekDiff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case 'custom':
      if (startDate) start = new Date(startDate);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }
      break;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const formatDateTime = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return {
    startStr: formatDateTime(start),
    endStr: formatDateTime(end),
    startDateOnly: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    endDateOnly: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

/**
 * Récupérer toutes les entrées brutes du journal (SQL UNION sans doublon)
 */
async function fetchJournalEntries(companyId, startStr, endStr, startDateOnly, endDateOnly, typeFilter = 'all') {
  // 1. ENCAISSEMENTS VENTES DIRECTES (sale_payments)
  // Utiliser sale_payments garantit l'exactitude des montants réellement perçus à l'instant T
  // (même en cas de paiement partiel ou multi-moyens)
  const salesQuery = `
    SELECT 
      sp.created_at AS operation_date,
      'sale_payment' AS type,
      'Encaissement Vente' AS type_label,
      s.sale_number AS reference,
      CONCAT('Paiement vente #', s.sale_number, COALESCE(CONCAT(' (', COALESCE(s.client_name, c.full_name), ')'), '')) AS description,
      sp.payment_method,
      sp.amount AS credit,
      0.00 AS debit,
      'sale' AS source_module,
      s.id AS source_id,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS user_name
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN users u ON s.seller_id = u.id
    WHERE s.company_id = ?
      AND s.status = 'completed'
      AND sp.created_at BETWEEN ? AND ?
  `;

  // 2. ENCAISSEMENTS DETTES CLIENTS (debt_payments)
  const debtCollectionsQuery = `
    SELECT 
      CONCAT(dp.payment_date, ' 12:00:00') AS operation_date,
      'debt_collection' AS type,
      'Règlement Dette Client' AS type_label,
      COALESCE(dp.payment_reference, CONCAT('DETTE-', dp.id)) AS reference,
      CONCAT('Recouvrement créance – ', c.full_name, COALESCE(CONCAT(' (', dp.note, ')'), '')) AS description,
      dp.payment_method,
      dp.amount AS credit,
      0.00 AS debit,
      'client_debt' AS source_module,
      dp.client_debt_id AS source_id,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS user_name
    FROM debt_payments dp
    JOIN client_debts cd ON dp.client_debt_id = cd.id
    JOIN clients c ON cd.client_id = c.id
    LEFT JOIN users u ON dp.received_by = u.id
    WHERE dp.company_id = ?
      AND dp.payment_date BETWEEN ? AND ?
  `;

  // 3. DÉPENSES (expenses)
  const expensesQuery = `
    SELECT 
      CONCAT(e.expense_date, ' 12:00:00') AS operation_date,
      'expense' AS type,
      'Dépense' AS type_label,
      COALESCE(e.payment_reference, CONCAT('DEP-', e.id)) AS reference,
      CONCAT('[', UPPER(e.category), '] ', e.title, COALESCE(CONCAT(' - ', e.description), '')) AS description,
      e.payment_method,
      0.00 AS credit,
      e.amount AS debit,
      'expense' AS source_module,
      e.id AS source_id,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS user_name
    FROM expenses e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.company_id = ?
      AND e.deleted_at IS NULL
      AND e.expense_date BETWEEN ? AND ?
  `;

  // 4. PAIEMENTS FOURNISSEURS (supplier_payments)
  const supplierPaymentsQuery = `
    SELECT 
      CONCAT(sp.payment_date, ' 12:00:00') AS operation_date,
      'supplier_payment' AS type,
      'Paiement Fournisseur' AS type_label,
      COALESCE(sp.payment_reference, CONCAT('FOURN-', sp.id)) AS reference,
      CONCAT('Règlement fournisseur: ', s.company_name, COALESCE(CONCAT(' (', so.order_number, ')'), '')) AS description,
      sp.payment_method,
      0.00 AS credit,
      sp.amount AS debit,
      'supplier' AS source_module,
      sp.id AS source_id,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS user_name
    FROM supplier_payments sp
    JOIN suppliers s ON sp.supplier_id = s.id
    LEFT JOIN supplier_orders so ON sp.supplier_order_id = so.id
    LEFT JOIN users u ON sp.paid_by = u.id
    WHERE sp.company_id = ?
      AND sp.payment_date BETWEEN ? AND ?
  `;

  // 5. REMBOURSEMENTS RETOURS CLIENTS (sale_returns)
  const returnsQuery = `
    SELECT 
      sr.created_at AS operation_date,
      'sale_return' AS type,
      'Remboursement Retour' AS type_label,
      sr.return_number AS reference,
      CONCAT('Remboursement retour #', sr.return_number, COALESCE(CONCAT(' (', sr.notes, ')'), '')) AS description,
      'cash' AS payment_method,
      0.00 AS credit,
      sr.total_amount_returned AS debit,
      'return' AS source_module,
      sr.id AS source_id,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS user_name
    FROM sale_returns sr
    LEFT JOIN users u ON sr.created_by = u.id
    WHERE sr.company_id = ?
      AND sr.total_amount_returned > 0
      AND sr.created_at BETWEEN ? AND ?
  `;

  // Assembler selon le filtre de type si demandé
  const unionQueries = [];
  const queryParams = [];

  if (typeFilter === 'all' || typeFilter === 'sale_payment') {
    unionQueries.push(salesQuery);
    queryParams.push(companyId, startStr, endStr);
  }
  if (typeFilter === 'all' || typeFilter === 'debt_collection') {
    unionQueries.push(debtCollectionsQuery);
    queryParams.push(companyId, startDateOnly, endDateOnly);
  }
  if (typeFilter === 'all' || typeFilter === 'expense') {
    unionQueries.push(expensesQuery);
    queryParams.push(companyId, startDateOnly, endDateOnly);
  }
  if (typeFilter === 'all' || typeFilter === 'supplier_payment') {
    unionQueries.push(supplierPaymentsQuery);
    queryParams.push(companyId, startDateOnly, endDateOnly);
  }
  if (typeFilter === 'all' || typeFilter === 'sale_return') {
    unionQueries.push(returnsQuery);
    queryParams.push(companyId, startStr, endStr);
  }

  if (unionQueries.length === 0) return [];

  const masterQuery = `
    SELECT * FROM (
      ${unionQueries.join(' UNION ALL ')}
    ) AS journal
    ORDER BY operation_date ASC, reference ASC
  `;

  const [rawEntries] = await pool.query(masterQuery, queryParams);
  return rawEntries;
}

/**
 * GET /api/journal
 * Obtenir le journal chronologique avec solde cumulé
 */
const getJournal = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { period, startDate, endDate, type = 'all', payment_method } = req.query;

    const { startStr, endStr, startDateOnly, endDateOnly } = parseDateRange({ period, startDate, endDate });

    const rawEntries = await fetchJournalEntries(
      companyId,
      startStr,
      endStr,
      startDateOnly,
      endDateOnly,
      type
    );

    // Filtrer par moyen de paiement si demandé
    let filteredEntries = rawEntries;
    if (payment_method && payment_method !== 'all') {
      filteredEntries = rawEntries.filter((e) => e.payment_method === payment_method);
    }

    // Calculer le solde progressif et les totaux
    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const entriesWithBalance = filteredEntries.map((item) => {
      const credit = parseFloat(item.credit || 0);
      const debit = parseFloat(item.debit || 0);
      totalCredit += credit;
      totalDebit += debit;
      runningBalance += credit - debit;

      return {
        ...item,
        credit,
        debit,
        running_balance: runningBalance,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: startStr,
          end: endStr,
        },
        summary: {
          total_credit: totalCredit,
          total_debit: totalDebit,
          net_balance: totalCredit - totalDebit,
          total_operations: entriesWithBalance.length,
        },
        entries: entriesWithBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/journal/summary
 * Synthèse rapide des flux
 */
const getJournalSummary = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { period, startDate, endDate } = req.query;
    const { startStr, endStr, startDateOnly, endDateOnly } = parseDateRange({ period, startDate, endDate });

    const rawEntries = await fetchJournalEntries(
      companyId,
      startStr,
      endStr,
      startDateOnly,
      endDateOnly,
      'all'
    );

    let totalSales = 0;
    let totalDebtCollections = 0;
    let totalExpenses = 0;
    let totalSupplierPayments = 0;
    let totalReturns = 0;

    for (const e of rawEntries) {
      const c = parseFloat(e.credit || 0);
      const d = parseFloat(e.debit || 0);

      if (e.type === 'sale_payment') totalSales += c;
      else if (e.type === 'debt_collection') totalDebtCollections += c;
      else if (e.type === 'expense') totalExpenses += d;
      else if (e.type === 'supplier_payment') totalSupplierPayments += d;
      else if (e.type === 'sale_return') totalReturns += d;
    }

    const totalInflow = totalSales + totalDebtCollections;
    const totalOutflow = totalExpenses + totalSupplierPayments + totalReturns;

    res.status(200).json({
      success: true,
      data: {
        period: { start: startStr, end: endStr },
        inflows: {
          direct_sales: totalSales,
          debt_collections: totalDebtCollections,
          total: totalInflow,
        },
        outflows: {
          expenses: totalExpenses,
          supplier_payments: totalSupplierPayments,
          refunds: totalReturns,
          total: totalOutflow,
        },
        net_cash_flow: totalInflow - totalOutflow,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/journal/export
 * Exporter le journal au format CSV
 */
const exportJournal = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { period, startDate, endDate, type = 'all', format = 'csv' } = req.query;
    const { startStr, endStr, startDateOnly, endDateOnly } = parseDateRange({ period, startDate, endDate });

    const rawEntries = await fetchJournalEntries(
      companyId,
      startStr,
      endStr,
      startDateOnly,
      endDateOnly,
      type
    );

    let runningBalance = 0;
    const rows = [
      ['Date', 'Type', 'Référence', 'Description', 'Moyen de paiement', 'Entrée (Crédit)', 'Sortie (Débit)', 'Solde cumulé', 'Auteur'],
    ];

    for (const e of rawEntries) {
      const credit = parseFloat(e.credit || 0);
      const debit = parseFloat(e.debit || 0);
      runningBalance += credit - debit;

      rows.push([
        new Date(e.operation_date).toLocaleString('fr-FR'),
        e.type_label,
        e.reference || '-',
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.payment_method || '-',
        credit.toFixed(2),
        debit.toFixed(2),
        runningBalance.toFixed(2),
        `"${(e.user_name || '-').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=journal_operations_${startDateOnly}_${endDateOnly}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJournal,
  getJournalSummary,
  exportJournal,
};
