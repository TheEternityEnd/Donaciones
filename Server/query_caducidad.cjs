const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_DONACION_USER,
  host: process.env.DB_DONACION_HOST,
  database: process.env.DB_DONACION_NAME,
  password: String(process.env.DB_DONACION_PASSWORD),
  port: process.env.DB_DONACION_PORT || 5432
});
pool.query("SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%caduc%' OR column_name LIKE '%stock%';")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(console.error);
