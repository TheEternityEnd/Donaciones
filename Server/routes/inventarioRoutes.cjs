const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventarioController.cjs');

// Inventario Consolidado (Ortopedia + Farmacia)
router.get(['/inventario', '/donaciones/inventario'], controller.getInventarioConsolidado);

module.exports = router;
