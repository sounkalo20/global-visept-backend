const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { requireMembership } = require("../middlewares/membership.middleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/category.validator");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/categories - Créer une catégorie (owner ou manager seulement)
router.post(
  "/",
  validate(createCategorySchema),
  requireMembership(["owner", "manager"]),
  createCategory,
);

// GET /api/categories?company_id=X - Lister les catégories
router.get("/", requireMembership(), getCategories);

// GET /api/categories/:id?company_id=X - Détails d'une catégorie
router.get("/:id", requireMembership(), getCategoryById);

// PUT /api/categories/:id - Modifier une catégorie (owner ou manager seulement)
router.put(
  "/:id",
  validate(updateCategorySchema),
  requireMembership(["owner", "manager"]),
  updateCategory,
);

// DELETE /api/categories/:id?company_id=X - Supprimer une catégorie (owner seulement)
router.delete("/:id", requireMembership(["owner"]), deleteCategory);

module.exports = router;
