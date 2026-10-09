const express = require('express');
const cookieParser = require('cookie-parser');
const corsMiddleware = require('./middlewares/cors.cjs');
const authMiddleware = require('./middlewares/auth.cjs');
const errorHandler = require('./middlewares/errorHandler.cjs');

// Importación de rutas modulares
const donacionesRoutes = require('./routes/donacionesRoutes.cjs');
const prestamosRoutes = require('./routes/prestamosRoutes.cjs');
const inventarioRoutes = require('./routes/inventarioRoutes.cjs');
const ortopediaRoutes = require('./routes/ortopediaRoutes.cjs');
const solicitudesRoutes = require('./routes/solicitudesRoutes.cjs');
const usuariosRoutes = require('./routes/usuariosRoutes.cjs');

const app = express();

// ==========================================
// ⚙️ MIDDLEWARES GLOBALES
// ==========================================
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

// Endpoint de salud del micro-servicio
app.get(['/health', '/api/health', '/api/donaciones/health'], (req, res) => {
  res.json({ status: 'ok', servicio: 'donaciones-backend', timestamp: new Date().toISOString() });
});

// Protección de sesión JWT
app.use(authMiddleware);

// ==========================================
// 🚀 MONTAJE DE RUTAS MODULARES
// ==========================================
app.use('/api', donacionesRoutes);
app.use('/api', prestamosRoutes);
app.use('/api', inventarioRoutes);
app.use('/api', ortopediaRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', usuariosRoutes);

// Manejo de rutas no encontradas en /api
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
