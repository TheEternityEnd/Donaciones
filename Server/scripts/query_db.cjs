const { pool } = require('./index.cjs');

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema IN ('donaciones', 'farmacia', 'ortopedia') 
    `);
    require('fs').writeFileSync('db_info.json', JSON.stringify(res.rows, null, 2));
  } catch(err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
