const { Pool } = require('pg'); 
require('dotenv').config(); 
const pool = new Pool({ 
  user: process.env.DB_DONACION_USER, 
  host: process.env.DB_DONACION_HOST, 
  database: process.env.DB_DONACION_NAME, 
  password: String(process.env.DB_DONACION_PASSWORD), 
  port: process.env.DB_DONACION_PORT || 5432 
}); 
pool.query('CREATE VIEW public.test_view AS SELECT 1 as id')
  .then(r => { console.log("success"); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
