const config = require('../config/env.cjs');

/**
 * 🛡️ Middleware Centralizado de Manejo de Errores
 * Registra el detalle del error en la consola del servidor y previene
 * la fuga de consultas SQL, tablas o detalles internos al cliente.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`💥 [ERROR ${req.method} ${req.url}]:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    error: err.userMessage || 'Ocurrió un error interno en el servidor.'
  };

  // En desarrollo se puede incluir el mensaje del error para facilitar la depuración
  if (config.NODE_ENV === 'development') {
    response.debugMessage = err.message;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
