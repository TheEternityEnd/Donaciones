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
    const r1 = await pool.query('SELECT id_usuario FROM ortopedia.usuarios WHERE id_usuario = 1');
    if (r1.rowCount === 0) {
      await pool.query("INSERT INTO ortopedia.usuarios (id_usuario, nombre_completo, correo_electronico, contrasena_hash, rol, estado) VALUES (1, 'Admin', 'admin@ejemplo.com', 'N/A', 'admin', true)");
    }

    const r2 = await pool.query('SELECT id_articulo FROM ortopedia.inventario WHERE id_articulo = 1');
    if (r2.rowCount === 0) {
      await pool.query("INSERT INTO ortopedia.inventario (id_articulo, nombre_articulo, categoria, cantidad_total, cantidad_disponible) VALUES (1, 'Varios / Genérico', 'OTROS', 1000, 1000)");
    }

    const r3 = await pool.query('SELECT id_beneficiario FROM ortopedia.beneficiarios WHERE id_beneficiario = 1');
    if (r3.rowCount === 0) {
      await pool.query("INSERT INTO ortopedia.beneficiarios (id_beneficiario, nombre_completo, documento_identidad, estado) VALUES (1, 'Público General', 'N/A', true)");
    }

    console.log('Dummy data inserted');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
