const path = require('path');
const dotenv = require('dotenv');

// Cargar .env ya sea desde la raíz o desde la carpeta Server/
const envPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });
dotenv.config({ path: rootEnvPath });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'secret_para_desarrollo_cambiar_en_produccion',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5173'],
  DB: {
    user: process.env.DB_DONACION_USER,
    host: process.env.DB_DONACION_HOST,
    database: process.env.DB_DONACION_NAME,
    password: String(process.env.DB_DONACION_PASSWORD || ''),
    port: Number(process.env.DB_DONACION_PORT) || 5432,
    ssl: false,
    options: "-c search_path=donaciones,farmacia,ortopedia,public"
  }
};
