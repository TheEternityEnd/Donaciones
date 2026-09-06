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
    console.log("--- HISTORIAL_INVENTARIO ---");
    const hist = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'ortopedia' AND table_name = 'historial_inventario'");
    console.table(hist.rows);

    console.log("--- PRESTAMOS ---");
    const pres = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'ortopedia' AND table_name = 'prestamos'");
    console.table(pres.rows);

    console.log("--- DETALLE_PRESTAMOS ---");
    const det = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'ortopedia' AND table_name = 'detalle_prestamos'");
    console.table(det.rows);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
