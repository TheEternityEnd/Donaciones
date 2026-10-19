const { Pool } = require('pg'); 
require('dotenv').config(); 
const pool = new Pool({ 
  user: process.env.DB_DONACION_USER, 
  host: process.env.DB_DONACION_HOST, 
  database: process.env.DB_DONACION_NAME, 
  password: String(process.env.DB_DONACION_PASSWORD), 
  port: process.env.DB_DONACION_PORT || 5432 
}); 

async function run() {
  try {
    const r1 = await pool.query('SELECT id_usuario FROM ortopedia.usuarios LIMIT 1');
    console.log('User:', r1.rows);
    const r2 = await pool.query('SELECT id_articulo FROM ortopedia.inventario LIMIT 1');
    console.log('Articulo:', r2.rows);
    const r3 = await pool.query('SELECT id_beneficiario FROM ortopedia.beneficiarios LIMIT 1');
    console.log('Beneficiario:', r3.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
