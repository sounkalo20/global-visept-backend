const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
  getStockMovements,
} = require("../controllers/product.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { requireMembership } = require("../middlewares/membership.middleware");
const { uploadProductImage } = require("../middlewares/upload.middleware");
const {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} = require("../validators/product.validator");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/products - Créer un produit (owner ou manager)
router.post(
  "/",
  uploadProductImage,
  (req, res, next) => {
    // Parser les champs numériques et booléens du form-data
    if (req.body.company_id)
      req.body.company_id = parseInt(req.body.company_id);
    if (req.body.category_id)
      req.body.category_id =
        req.body.category_id === "null" ? null : parseInt(req.body.category_id);
    if (req.body.unit_id) req.body.unit_id = parseInt(req.body.unit_id);
    if (req.body.cost_price)
      req.body.cost_price = parseFloat(req.body.cost_price);
    if (req.body.retail_price)
      req.body.retail_price = parseFloat(req.body.retail_price);
    if (req.body.wholesale_price)
      req.body.wholesale_price = parseFloat(req.body.wholesale_price);
    if (req.body.wholesale_min_qty)
      req.body.wholesale_min_qty = parseInt(req.body.wholesale_min_qty);
    if (req.body.current_stock)
      req.body.current_stock = parseFloat(req.body.current_stock);
    if (req.body.low_stock_threshold)
      req.body.low_stock_threshold = parseFloat(req.body.low_stock_threshold);

    // Valider avec Zod
    try {
      createProductSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
  requireMembership(["owner", "manager"]),
  createProduct,
);

// GET /api/products?company_id=X - Lister les produits
router.get("/", requireMembership(), getProducts);

// GET /api/products/:id?company_id=X - Détails d'un produit
router.get("/:id", requireMembership(), getProductById);

// PUT /api/products/:id - Modifier un produit (owner ou manager)
router.put(
  "/:id",
  uploadProductImage,
  (req, res, next) => {
    if (req.body.company_id)
      req.body.company_id = parseInt(req.body.company_id);
    if (req.body.category_id)
      req.body.category_id =
        req.body.category_id === "null" ? null : parseInt(req.body.category_id);
    if (req.body.unit_id) req.body.unit_id = parseInt(req.body.unit_id);
    if (req.body.cost_price)
      req.body.cost_price = parseFloat(req.body.cost_price);
    if (req.body.retail_price)
      req.body.retail_price = parseFloat(req.body.retail_price);
    if (req.body.wholesale_price)
      req.body.wholesale_price = parseFloat(req.body.wholesale_price);
    if (req.body.wholesale_min_qty)
      req.body.wholesale_min_qty = parseInt(req.body.wholesale_min_qty);
    if (req.body.current_stock)
      req.body.current_stock = parseFloat(req.body.current_stock);
    if (req.body.low_stock_threshold)
      req.body.low_stock_threshold = parseFloat(req.body.low_stock_threshold);

    try {
      updateProductSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
  requireMembership(["owner", "manager"]),
  updateProduct,
);

// PATCH /api/products/:id/stock - Mettre à jour le stock (owner ou manager)
router.patch(
  "/:id/stock",
  validate(updateStockSchema),
  requireMembership(["owner", "manager"]),
  updateStock,
);

// GET /api/products/:id/movements?company_id=X - Historique des mouvements de stock
router.get("/:id/movements", requireMembership(), getStockMovements);

// DELETE /api/products/:id?company_id=X - Supprimer un produit (owner seulement)
router.delete("/:id", requireMembership(["owner"]), deleteProduct);

module.exports = router;
