const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Endpoint léger pour le heartbeat du mode hors-ligne et la détection de connectivité réelle.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
