const { Pool } = require('pg'); 
require('dotenv').config(); 
const pool = new Pool({ 
  user: process.env.DB_DONACION_USER, 
  host: process.env.DB_DONACION_HOST, 
  database: process.env.DB_DONACION_NAME, 
  password: String(process.env.DB_DONACION_PASSWORD), 
  port: process.env.DB_DONACION_PORT || 5432 
}); 
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='donaciones'")
  .then(r => { console.log('Tables:', r.rows); process.exit(0); })
  .catch(e => console.error(e));
