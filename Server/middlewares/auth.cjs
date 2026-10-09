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

  if (token) {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      req.usuario = payload;
      return next();
    } catch (error) {
      if (config.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
      }
      console.warn('⚠️ [DEV AUTH] Token inválido en desarrollo. Utilizando usuario fallback.');
    }
  }

  // Si no hay token en producción, rechazar inmediatamente
  if (config.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Acceso denegado. No se encontró una sesión activa.' });
  }

  // 🌟 Entorno de desarrollo: Inyectar usuario predeterminado seguro para operatividad local
  req.usuario = {
    id_usuario: 1,
    nombre: 'Desarrollador Local',
    nombre_usuario: 'dev_local',
    rol: 'Administrador',
    correo: 'admin@local.com',
    email: 'admin@local.com',
    sedes: ['Sede Central']
  };

  next();
};

module.exports = authMiddleware;
