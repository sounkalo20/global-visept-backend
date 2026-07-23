const express = require("express");
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getCategories,
} = require("../controllers/expense.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { requireMembership } = require("../middlewares/membership.middleware");
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../validators/expense.validator");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/expenses/categories - Liste des catégories
router.get("/categories", requireMembership(), getCategories);

// GET /api/expenses/stats?company_id=X - Statistiques
router.get("/stats", requireMembership(), getExpenseStats);

// POST /api/expenses - Créer une dépense (owner, manager, cashier)
router.post(
  "/",
  validate(createExpenseSchema),
  requireMembership(["owner", "manager", "cashier"]),
  createExpense,
);

// GET /api/expenses?company_id=X - Lister les dépenses
router.get("/", requireMembership(), getExpenses);

// GET /api/expenses/:id?company_id=X - Détails d'une dépense
router.get("/:id", requireMembership(), getExpenseById);

// PUT /api/expenses/:id - Modifier une dépense (owner, manager, cashier)
router.put(
  "/:id",
  validate(updateExpenseSchema),
  requireMembership(["owner", "manager", "cashier"]),
  updateExpense,
);

// DELETE /api/expenses/:id?company_id=X - Supprimer une dépense (owner, manager)
router.delete("/:id", requireMembership(["owner", "manager"]), deleteExpense);

module.exports = router;
