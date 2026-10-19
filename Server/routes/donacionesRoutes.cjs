const express = require('express');
const router = express.Router();
const controller = require('../controllers/donacionesController.cjs');

// Historial
router.get(['/historial', '/donaciones/historial'], controller.getHistorial);

// Registro de movimientos
router.post(['/registrar', '/donaciones/registrar'], controller.registrarMovimiento);

// Actualización de folios
router.put(['/actualizar/:id', '/donaciones/actualizar/:id'], controller.actualizarFolio);

// Eliminación de folios
router.delete(['/eliminar/:id', '/donaciones/eliminar/:id'], controller.eliminarFolio);

module.exports = router;
