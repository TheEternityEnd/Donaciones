const express = require('express');
const router = express.Router();
const controller = require('../controllers/prestamosController.cjs');

// Préstamos Activos
router.get([
  '/prestamos/activos', 
  '/prestamos-activos', 
  '/donaciones/prestamos/activos', 
  '/donaciones/prestamos-activos'
], controller.getPrestamosActivos);

// Préstamos en Mora
router.get([
  '/prestamos/mora', 
  '/prestamos-mora', 
  '/donaciones/prestamos/mora', 
  '/donaciones/prestamos-mora'
], controller.getPrestamosMora);

// Devolución de Préstamos
router.put([
  '/prestamos/devolucion', 
  '/prestamos-devolucion', 
  '/donaciones/prestamos/devolucion', 
  '/donaciones/prestamos-devolucion'
], controller.devolucionPrestamo);

module.exports = router;
