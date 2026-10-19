const express = require('express');
const router = express.Router();
const controller = require('../controllers/ortopediaController.cjs');

// Catálogo de artículos de ortopedia
router.get([
  '/ortopedia/inventario', 
  '/ortopedia-inventario', 
  '/donaciones/ortopedia-inventario', 
  '/donaciones/ortopedia/inventario'
], controller.getOrtopediaInventario);

// Padrón de beneficiarios de ortopedia
router.get([
  '/ortopedia/beneficiarios', 
  '/ortopedia-beneficiarios', 
  '/donaciones/ortopedia-beneficiarios', 
  '/donaciones/ortopedia/beneficiarios'
], controller.getOrtopediaBeneficiarios);

module.exports = router;
