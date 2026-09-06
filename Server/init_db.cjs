const { Pool } = require('pg'); 
require('dotenv').config(); 

const pool = new Pool({ 
  user: process.env.DB_DONACION_USER, 
  host: process.env.DB_DONACION_HOST, 
  database: process.env.DB_DONACION_NAME, 
  password: String(process.env.DB_DONACION_PASSWORD), 
  port: process.env.DB_DONACION_PORT || 5432 
}); 

const sql = `
CREATE TABLE IF NOT EXISTS donaciones.folio_maestro (
    id_folio SERIAL PRIMARY KEY,
    tipo_movimiento VARCHAR(50) NOT NULL,
    area_origen VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registra INT NOT NULL,
    observaciones_generales TEXT,
    estatus_folio VARCHAR(50) DEFAULT 'ACTIVO'
);

CREATE TABLE IF NOT EXISTS donaciones.detalle_operacion (
    id_detalle SERIAL PRIMARY KEY,
    id_folio INT NOT NULL REFERENCES donaciones.folio_maestro(id_folio),
    categoria VARCHAR(50) NOT NULL,
    id_item_externo INT,
    nombre_item VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    lote_serie VARCHAR(100),
    fecha_caducidad DATE,
    estado_fisico_entrega VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS donaciones.control_prestamo (
    id_prestamo SERIAL PRIMARY KEY,
    id_folio INT NOT NULL REFERENCES donaciones.folio_maestro(id_folio),
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

CREATE OR REPLACE VIEW donaciones.vista_historial_completo AS
SELECT 
    f.id_folio AS "Folio",
    f.fecha_registro AS "Fecha_Sistema",
    f.tipo_movimiento AS "Operacion",
    f.area_origen AS "Modulo",
    d.nombre_item AS "Articulo",
    d.categoria AS "Categoria",
    d.cantidad AS "Cant",
    p.nombre_solicitante AS "Beneficiario",
    p.telefono_solicitante AS "Contacto",
    p.fecha_hora_devolucion_pactada AS "Vencimiento_Prestamo",
    COALESCE(p.estatus_prestamo, f.estatus_folio) AS "Estado_Prestamo",
    CAST(f.id_usuario_registra AS VARCHAR) AS "Registrado_Por"
FROM donaciones.folio_maestro f
JOIN donaciones.detalle_operacion d ON f.id_folio = d.id_folio
LEFT JOIN donaciones.control_prestamo p ON f.id_folio = p.id_folio;
`;

pool.query(sql)
  .then(() => {
    console.log('Tablas y vistas creadas correctamente en el esquema donaciones.');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error al crear tablas:', e);
    process.exit(1);
  });
