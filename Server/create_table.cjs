const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_DONACION_USER,
  host: process.env.DB_DONACION_HOST,
  database: process.env.DB_DONACION_NAME,
  password: String(process.env.DB_DONACION_PASSWORD),
  port: process.env.DB_DONACION_PORT || 5432,
});

const query = `
CREATE TABLE IF NOT EXISTS donaciones.usuarios_ajustes (
    id_ajuste SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    idioma_pref CHARACTER VARYING(5) DEFAULT 'es',
    tema_pref CHARACTER VARYING(10) DEFAULT 'light',
    CONSTRAINT fk_usuario_ajustes FOREIGN KEY (id_usuario) 
        REFERENCES donaciones.usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT uq_usuario_ajuste UNIQUE (id_usuario)
);
`;

pool.query(query).then(r => {
  console.log('Table created successfully');
  process.exit(0);
}).catch(e => {
  console.error('Error creating table:', e);
  process.exit(1);
});
