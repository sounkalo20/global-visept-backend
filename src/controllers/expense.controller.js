const pool = require("../config/db");
const AppError = require("../utils/AppError");

// ─── CATÉGORIES DISPONIBLES ─────────────────────────────
const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Loyer" },
  { value: "salary", label: "Salaires" },
  { value: "utility", label: "Électricité / Eau" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inventory", label: "Achat stock" },
  { value: "tax", label: "Taxes / Impôts" },
  { value: "marketing", label: "Marketing / Pub" },
  { value: "equipment", label: "Équipement" },
  { value: "internet", label: "Internet / Télécom" },
  { value: "mobile_money_fee", label: "Frais Mobile Money" },
  { value: "bank_fee", label: "Frais bancaires" },
  { value: "restaurant_supply", label: "Approvisionnement resto" },
  { value: "salon_supply", label: "Fournitures salon" },
  { value: "other", label: "Autre" },
];

// ─── CRÉER UNE DÉPENSE ──────────────────────────────────
const createExpense = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      amount,
      currency,
      payment_method,
      payment_reference,
      expense_date,
      notes,
    } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      throw new AppError("Le montant de la dépense doit être supérieur à 0 FCFA.", 400);
    }

    // Insérer la dépense
    const [result] = await pool.query(
      `INSERT INTO expenses (
        company_id, title, description, category, amount, currency,
        payment_method, payment_reference, expense_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        title,
        description || null,
        category,
        expenseAmount,
        currency || "XOF",
        payment_method,
        payment_reference || null,
        expense_date || new Date().toISOString().split('T')[0],
        userId,
      ],
    );

    // Récupérer la dépense créée avec le nom de l'utilisateur
    const [expenses] = await pool.query(
      `SELECT e.*, u.first_name as created_by_name, u.last_name as created_by_lastname
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Dépense créée avec succès.",
      data: {
        expense: expenses[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTER LES DÉPENSES ────────────────────────────────
const getExpenses = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      search,
      category,
      payment_method,
      start_date,
      end_date,
      sort_by = "expense_date",
      sort_order = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT e.*, u.first_name as created_by_name, u.last_name as created_by_lastname
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.company_id = ? AND e.deleted_at IS NULL
    `;
    const queryParams = [companyId];

    // Filtre recherche (titre, description)
    if (search) {
      query += " AND (e.title LIKE ? OR e.description LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Filtre catégorie
    if (category) {
      query += " AND e.category = ?";
      queryParams.push(category);
    }

    // Filtre méthode de paiement
    if (payment_method) {
      query += " AND e.payment_method = ?";
      queryParams.push(payment_method);
    }

    // Filtre période
    if (start_date) {
      query += " AND e.expense_date >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      query += " AND e.expense_date <= ?";
      queryParams.push(end_date);
    }

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM expenses e WHERE e.company_id = ? AND e.deleted_at IS NULL
      ${search ? "AND (e.title LIKE ? OR e.description LIKE ?)" : ""}
      ${category ? "AND e.category = ?" : ""}
      ${payment_method ? "AND e.payment_method = ?" : ""}
      ${start_date ? "AND e.expense_date >= ?" : ""}
      ${end_date ? "AND e.expense_date <= ?" : ""}`;

    const countParams = [companyId];
    if (search) {
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (category) countParams.push(category);
    if (payment_method) countParams.push(payment_method);
    if (start_date) countParams.push(start_date);
    if (end_date) countParams.push(end_date);

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Tri
    const allowedSortColumns = [
      "expense_date",
      "amount",
      "title",
      "category",
      "created_at",
    ];
    const sortColumn = allowedSortColumns.includes(sort_by)
      ? sort_by
      : "expense_date";
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY e.${sortColumn} ${order}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    const [expenses] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: {
        expenses,
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

// ─── DÉTAILS D'UNE DÉPENSE ──────────────────────────────
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [expenses] = await pool.query(
      `SELECT e.*, u.first_name as created_by_name, u.last_name as created_by_lastname
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ? AND e.company_id = ? AND e.deleted_at IS NULL`,
      [id, companyId],
    );

    if (expenses.length === 0) {
      throw new AppError("Dépense introuvable.", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        expense: expenses[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UNE DÉPENSE ───────────────────────────────
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const {
      title,
      description,
      category,
      amount,
      currency,
      payment_method,
      payment_reference,
      expense_date,
      notes,
    } = req.body;

    // Vérifier que la dépense existe
    const [expenses] = await pool.query(
      "SELECT * FROM expenses WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (expenses.length === 0) {
      throw new AppError("Dépense introuvable.", 404);
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push("category = ?");
      updateValues.push(category);
    }
    if (amount !== undefined) {
      const expenseAmount = parseFloat(amount);
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        throw new AppError("Le montant de la dépense doit être supérieur à 0 FCFA.", 400);
      }
      updateFields.push("amount = ?");
      updateValues.push(expenseAmount);
    }
    if (currency !== undefined) {
      updateFields.push("currency = ?");
      updateValues.push(currency);
    }
    if (payment_method !== undefined) {
      updateFields.push("payment_method = ?");
      updateValues.push(payment_method);
    }
    if (payment_reference !== undefined) {
      updateFields.push("payment_reference = ?");
      updateValues.push(payment_reference);
    }
    if (expense_date !== undefined) {
      updateFields.push("expense_date = ?");
      updateValues.push(expense_date);
    }
    if (notes !== undefined) {
      updateFields.push("notes = ?");
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      throw new AppError("Aucun champ à mettre à jour.", 400);
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE expenses SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    // Récupérer la dépense mise à jour
    const [updatedExpenses] = await pool.query(
      `SELECT e.*, u.first_name as created_by_name, u.last_name as created_by_lastname
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Dépense mise à jour avec succès.",
      data: {
        expense: updatedExpenses[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SUPPRIMER UNE DÉPENSE (SOFT DELETE) ────────────────
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que la dépense existe
    const [expenses] = await pool.query(
      "SELECT * FROM expenses WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId],
    );

    if (expenses.length === 0) {
      throw new AppError("Dépense introuvable.", 404);
    }

    // Soft delete
    await pool.query(
      "UPDATE expenses SET deleted_at = NOW() WHERE id = ? AND company_id = ?",
      [id, companyId],
    );

    res.status(200).json({
      success: true,
      message: "Dépense supprimée avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── STATISTIQUES DES DÉPENSES ──────────────────────────
const getExpenseStats = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { start_date, end_date } = req.query;

    let dateFilter = "";
    const dateParams = [];

    if (start_date) {
      dateFilter += " AND expense_date >= ?";
      dateParams.push(start_date);
    }
    if (end_date) {
      dateFilter += " AND expense_date <= ?";
      dateParams.push(end_date);
    }

    // Total global
    const [totalResult] = await pool.query(
      `SELECT
         COUNT(*) as total_expenses,
         COALESCE(SUM(amount), 0) as total_amount,
         COALESCE(AVG(amount), 0) as average_amount
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL${dateFilter}`,
      [companyId, ...dateParams],
    );

    // Par catégorie
    const [byCategory] = await pool.query(
      `SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      [companyId, ...dateParams],
    );

    // Par méthode de paiement
    const [byPaymentMethod] = await pool.query(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL${dateFilter}
       GROUP BY payment_method
       ORDER BY total DESC`,
      [companyId, ...dateParams],
    );

    // Par mois (6 derniers mois)
    const [byMonth] = await pool.query(
      `SELECT
         DATE_FORMAT(expense_date, '%Y-%m') as month,
         COUNT(*) as count,
         COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL
         AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month DESC`,
      [companyId],
    );

    // Dépenses du jour
    const [todayResult] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL AND expense_date = CURDATE()`,
      [companyId],
    );

    // Dépenses du mois
    const [monthResult] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE company_id = ? AND deleted_at IS NULL
         AND MONTH(expense_date) = MONTH(CURDATE())
         AND YEAR(expense_date) = YEAR(CURDATE())`,
      [companyId],
    );

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total_expenses: totalResult[0].total_expenses,
          total_amount: parseFloat(totalResult[0].total_amount),
          average_amount: parseFloat(totalResult[0].average_amount),
          today: {
            count: todayResult[0].count,
            total: parseFloat(todayResult[0].total),
          },
          this_month: {
            count: monthResult[0].count,
            total: parseFloat(monthResult[0].total),
          },
        },
        by_category: byCategory,
        by_payment_method: byPaymentMethod,
        by_month: byMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── CATÉGORIES ─────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        categories: EXPENSE_CATEGORIES,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getCategories,
};
