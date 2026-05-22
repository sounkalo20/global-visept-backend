const express = require("express");
const router = express.Router();
const {
  createClient,
  getClients,
  searchClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
} = require("../controllers/client.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { requireMembership } = require("../middlewares/membership.middleware");
const {
  createClientSchema,
  updateClientSchema,
} = require("../validators/client.validator");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/clients/stats?company_id=X - Statistiques
router.get("/stats", requireMembership(), getClientStats);

// GET /api/clients/search?company_id=X&q=xxx - Recherche rapide (POS)
router.get("/search", requireMembership(), searchClients);

// POST /api/clients - Créer un client (owner, manager, cashier)
router.post(
  "/",
  validate(createClientSchema),
  requireMembership(["owner", "manager", "cashier"]),
  createClient,
);

// GET /api/clients?company_id=X - Lister les clients
router.get("/", requireMembership(), getClients);

// GET /api/clients/:id?company_id=X - Détails d'un client
router.get("/:id", requireMembership(), getClientById);

// PUT /api/clients/:id - Modifier un client (owner, manager)
router.put(
  "/:id",
  validate(updateClientSchema),
  requireMembership(["owner", "manager"]),
  updateClient,
);

// DELETE /api/clients/:id?company_id=X - Supprimer un client (owner)
router.delete("/:id", requireMembership(["owner"]), deleteClient);

module.exports = router;
