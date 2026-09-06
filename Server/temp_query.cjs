const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_DONACION_USER,
  host: process.env.DB_DONACION_HOST,
  database: process.env.DB_DONACION_NAME,
  password: String(process.env.DB_DONACION_PASSWORD),
  port: process.env.DB_DONACION_PORT || 5432,
  options: "-c search_path=donaciones,farmacia,ortopedia,public"
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM donaciones.folio_maestro LIMIT 2");
    console.log('folio_maestro columns:', Object.keys(res.rows[0] || {}), res.rows);
    
    const res2 = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='donaciones'");
    console.log('Tables in donaciones:', res2.rows.map(r => r.table_name));

    const res3 = await pool.query("SELECT * FROM donaciones.vista_historial_completo LIMIT 1");
    console.log('vista:', Object.keys(res3.rows[0] || {}));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
