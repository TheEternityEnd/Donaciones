const { Pool } = require('pg');
const config = require('./env.cjs');

const pool = new Pool(config.DB);

pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en el pool de PostgreSQL:', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query
};
