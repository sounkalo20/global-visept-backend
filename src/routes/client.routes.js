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
  bulkClientAction,
} = require("../controllers/client.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { requireMembership } = require("../middlewares/membership.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const {
  createClientSchema,
  updateClientSchema,
  bulkClientSchema,
} = require("../validators/client.validator");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/clients/bulk - Actions en masse sur les clients
router.post(
  "/bulk",
  requireMembership(),
  requirePermission('clients.edit'),
  validate(bulkClientSchema),
  bulkClientAction
);

// GET /api/clients/stats?company_id=X - Statistiques
router.get("/stats", requireMembership(), requirePermission('clients.view'), getClientStats);

// GET /api/clients/search?company_id=X&q=xxx - Recherche rapide (POS)
router.get("/search", requireMembership(), requirePermission('clients.view'), searchClients);

// POST /api/clients - Créer un client (owner, manager, cashier)
router.post(
  "/",
  validate(createClientSchema),
  requireMembership(),
  requirePermission('clients.create'),
  createClient,
);

// GET /api/clients?company_id=X - Lister les clients
router.get("/", requireMembership(), requirePermission('clients.view'), getClients);

// GET /api/clients/:id?company_id=X - Détails d'un client
router.get("/:id", requireMembership(), requirePermission('clients.view'), getClientById);

// PUT /api/clients/:id - Modifier un client (owner, manager)
router.put(
  "/:id",
  validate(updateClientSchema),
  requireMembership(),
  requirePermission('clients.edit'),
  updateClient,
);

// DELETE /api/clients/:id?company_id=X - Supprimer un client (owner)
router.delete("/:id", requireMembership(), requirePermission('clients.delete'), deleteClient);

module.exports = router;
