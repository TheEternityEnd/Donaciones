const { Pool } = require('pg'); 
require('dotenv').config(); 
const pool = new Pool({ 
  user: process.env.DB_DONACION_USER, 
  host: process.env.DB_DONACION_HOST, 
  database: process.env.DB_DONACION_NAME, 
  password: String(process.env.DB_DONACION_PASSWORD), 
  port: process.env.DB_DONACION_PORT || 5432 
}); 
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medicamentos'")
  .then(r => { console.log(r.rows); process.exit(0); })
  .catch(e => console.error(e));
