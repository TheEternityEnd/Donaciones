const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuariosController.cjs');

// Obtener datos del usuario activo en la sesión
router.get(['/usuario-activo', '/donaciones/usuario-activo'], controller.getUsuarioActivo);

// Actualizar preferencias de tema e idioma del usuario
router.put(['/usuarios/ajustes', '/donaciones/usuarios/ajustes'], controller.actualizarAjustes);

// Obtener configuración del usuario por ID
router.get(['/usuarios-config/:id', '/donaciones/usuarios-config/:id'], controller.getUsuarioConfig);

module.exports = router;
