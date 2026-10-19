const app = require('./app.cjs');
const config = require('./config/env.cjs');
const { pool, query } = require('./config/db.cjs');

// Verificación de conectividad inicial a la base de datos
pool.query('SELECT 1 AS check_db')
  .then(() => {
    console.log('✅ Conexión exitosa a PostgreSQL (Base de datos: ' + config.DB.database + ')');
  })
  .catch((err) => {
    console.error('❌ Error crítico al conectar a PostgreSQL:', err.message);
  });

// Encendido del servidor
const server = app.listen(config.PORT, () => {
  console.log(`🚀 Servidor de Donaciones escuchando en el puerto ${config.PORT} (Modo: ${config.NODE_ENV})`);
});

// Manejo de apagado elegante (Graceful Shutdown)
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor y liberando recursos...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

module.exports = {
  app,
  server,
  pool,
  query
};