const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitudesController.cjs');

// Listado de solicitudes de salida y préstamos
router.get(['/solicitudes', '/donaciones/solicitudes'], controller.getSolicitudes);

// Actualización de estado de solicitud (Aprobar / Cancelar)
router.put(['/solicitudes/estado', '/donaciones/solicitudes/estado'], controller.actualizarEstadoSolicitud);

module.exports = router;
