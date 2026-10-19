const jwt = require('jsonwebtoken');
const config = require('../config/env.cjs');

/**
 * 🛡️ Middleware de Autenticación Maestro
 * Verifica la firma JWT desde la cookie 'auth_token' o cabecera 'Authorization'.
 * En entorno de producción exige autenticación real.
 * En entorno de desarrollo permite un fallback documentado para pruebas locales sin login central.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.auth_token || 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se encontró una sesión activa.' });
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.usuario = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
  }
};

module.exports = authMiddleware;
