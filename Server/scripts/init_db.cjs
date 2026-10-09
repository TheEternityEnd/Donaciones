const { pool } = require('../config/db.cjs');

const sql = `
CREATE TABLE IF NOT EXISTS donaciones.usuarios_config (
    id_usuario INT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    rol VARCHAR(50) DEFAULT 'Personal',
    idioma_pref VARCHAR(5) DEFAULT 'es',
    tema_pref VARCHAR(10) DEFAULT 'light'
);

CREATE TABLE IF NOT EXISTS donaciones.folios_maestros (
    id_folio SERIAL PRIMARY KEY,
    tipo_movimiento VARCHAR(50) NOT NULL,
    area_origen VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registra INT NOT NULL,
    observaciones_generales TEXT,
    estatus_folio VARCHAR(50) DEFAULT 'true'
);

CREATE TABLE IF NOT EXISTS donaciones.detalle_operaciones (
    id_detalle SERIAL PRIMARY KEY,
    id_folio INT NOT NULL REFERENCES donaciones.folios_maestros(id_folio) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    id_item_externo INT,
    nombre_item VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    lote_serie VARCHAR(100),
    fecha_caducidad DATE,
    estado_fisico_entrega VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS donaciones.control_prestamos (
    id_prestamo SERIAL PRIMARY KEY,
    id_folio INT NOT NULL REFERENCES donaciones.folios_maestros(id_folio) ON DELETE CASCADE,
    nombre_solicitante VARCHAR(150) NOT NULL,
    telefono_solicitante VARCHAR(50),
    fecha_hora_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_devolucion_pactada TIMESTAMP,
    fecha_hora_devolucion_real TIMESTAMP,
    estatus_prestamo VARCHAR(50) DEFAULT 'ACTIVO',
    compromiso_responsabilidad BOOLEAN DEFAULT TRUE,
    notas_devolucion TEXT,
    id_usuario_entrega INT,
    id_usuario_recibe INT
);
`;

pool.query(sql)
  .then(() => {
    console.log('✅ Tablas del esquema donaciones verificadas y sincronizadas correctamente.');
    pool.end();
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error al inicializar tablas:', e);
    pool.end();
    process.exit(1);
  });
