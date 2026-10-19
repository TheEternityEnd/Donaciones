const cors = require('cors');
const config = require('../config/env.cjs');

const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como clientes REST locales, curl, o same-origin Nginx)
    if (!origin) return callback(null, true);
    
    // En desarrollo local, permitir orígenes localhost
    if (config.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error(`Acceso bloqueado por política de CORS para el origen: ${origin}`));
    }
  },
  credentials: true
});

module.exports = corsMiddleware;
