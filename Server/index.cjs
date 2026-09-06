const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_cambiar_en_produccion';

// ==========================================
// ⚙️ CONFIGURACIÓN DE MIDDLEWARES
// ==========================================
// [MIGRACIÓN COOKIES]: Habilitamos credentials: true para permitir el flujo seguro de cookies
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Configuración del Pool de PostgreSQL
const pool = new Pool({
  user: process.env.DB_DONACION_USER,
  host: process.env.DB_DONACION_HOST,
  database: process.env.DB_DONACION_NAME,
  password: String(process.env.DB_DONACION_PASSWORD),
  port: process.env.DB_DONACION_PORT || 5432,
  ssl: false,
  options: "-c search_path=donaciones,farmacia,ortopedia,public"
});

const query = (text, params) => pool.query(text, params);

// ==========================================
// 🚀 MIGRACIÓN DE BD: Limpieza de Constraints Mismatch
// ==========================================
async function aplicarMigraciones() {
  try {
    // 1. Aseguramos el usuario fallback (ID 1) en usuarios_config
    await pool.query(`
      INSERT INTO donaciones.usuarios_config (id_usuario, nombre, email, rol)
      VALUES (1, 'Usuario Central', 'admin@centrocomunitario.org', 'Administrador')
      ON CONFLICT (id_usuario) DO NOTHING;
    `);
    console.log('✅ Migración: Usuario fallback 1 verificado en usuarios_config.');
  } catch (err) {
    console.error('⚠️ Error al aplicar migración de base de datos:', err.message);
  }
}
aplicarMigraciones();

// ==========================================
// 🛡️ MIDDLEWARE: Validación del JWT Maestro (Vía Cookies)
// ==========================================
const verificarTokenMaestro = (req, res, next) => {
  // 🔑 Extraemos el token directamente de la cookie compartida por el Login Central
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se encontró una sesión activa.' });
  }

  try {
    // Verifica el token usando la firma compartida del ecosistema
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // Inyectamos id_usuario, nombre, rol y sedes en la petición
    next(); 
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
  }
};

// Aplicar protección global a todas las rutas inferiores
app.use(verificarTokenMaestro);

// GET /api/usuario-activo o /api/donaciones/usuario-activo (Obtener sesión centralizada)
app.get(['/api/usuario-activo', '/api/donaciones/usuario-activo'], async (req, res) => {
  try {
    res.json({
      id_usuario: req.usuario.id_usuario,
      nombre: req.usuario.nombre || req.usuario.nombre_usuario || 'Usuario Comunitario',
      rol: req.usuario.rol || 'Personal',
      email: req.usuario.email || '',
      sedes: req.usuario.sedes || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/usuarios/ajustes (Upsert de preferencias)
app.put(['/api/usuarios/ajustes', '/api/donaciones/usuarios/ajustes'], async (req, res) => {
  try {
    const { id_usuario, idioma_pref, tema_pref } = req.body;
    if (!id_usuario) {
      return res.status(400).json({ error: 'id_usuario es requerido' });
    }

    const sql = `
      INSERT INTO public.usuarios_ajustes (id_usuario, idioma_pref, tema_pref)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_usuario) 
      DO UPDATE SET idioma_pref = EXCLUDED.idioma_pref, tema_pref = EXCLUDED.tema_pref;
    `;
    await query(sql, [id_usuario, idioma_pref || 'es', tema_pref || 'light']);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/usuarios-config/:id (Obtener preferencias de ajustes)
app.get(['/api/usuarios-config/:id', '/api/donaciones/usuarios-config/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM public.usuarios_ajustes WHERE id_usuario = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ id_usuario: parseInt(id), idioma_pref: 'es', tema_pref: 'light' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vista consolidada base para múltiples consultas
const vistaSQL = `
    SELECT * FROM (
        SELECT 
            fm.id_folio AS "Folio",
            fm.fecha_registro AS "Fecha_Sistema",
            UPPER(fm.tipo_movimiento) AS "Operacion",
            fm.area_origen AS "Modulo",
            det.nombre_item AS "Articulo",
            det.categoria AS "Categoria",
            det.cantidad AS "Cant",
            COALESCE(cp.nombre_solicitante, '-') AS "Beneficiario",
            COALESCE(cp.telefono_solicitante, '-') AS "Contacto",
            cp.fecha_hora_devolucion_pactada AS "Vencimiento_Prestamo",
            COALESCE(UPPER(cp.estatus_prestamo), 'COMPLETADO') AS "Estado_Prestamo",
            fm.id_usuario_registra::text AS "Registrado_Por",
            fm.observaciones_generales AS "observaciones_generales",
            fm.estatus_folio AS "Estatus_Folio",
            det.fecha_caducidad AS "Fecha_Caducidad"
        FROM donaciones.folios_maestros fm
        JOIN donaciones.detalle_operaciones det ON fm.id_folio = det.id_folio
        LEFT JOIN donaciones.control_prestamos cp ON fm.id_folio = cp.id_folio
    ) AS vista_unificada
`;

// GET /api/donaciones/historial o /api/historial
app.get(['/api/donaciones/historial', '/api/historial'], async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `${vistaSQL}`;
    const params = [];

    if (search) {
      sql += ` WHERE "Folio"::TEXT ILIKE $1::TEXT OR "Beneficiario" ILIKE $1::TEXT OR "Articulo" ILIKE $1::TEXT OR "observaciones_generales" ILIKE $1::TEXT`;
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY "Fecha_Sistema" DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/donaciones/historial:", error);
    res.status(500).json({ error: 'Error interno del servidor al obtener historial.', detalles: error.message });
  }
});

// GET /api/donaciones/prestamos/activos o /api/prestamos/activos o /api/prestamos-activos o /api/donaciones/prestamos-activos
app.get(['/api/donaciones/prestamos/activos', '/api/prestamos/activos', '/api/prestamos-activos', '/api/donaciones/prestamos-activos'], async (req, res) => {
  try {
    const sql = `
        SELECT 
            fm.id_folio, 
            COALESCE(inv.nombre, det.nombre_item) AS nombre_item, 
            cp.nombre_solicitante, 
            fm.fecha_registro AS fecha_hora_prestamo, 
            cp.fecha_hora_devolucion_pactada, 
            cp.estatus_prestamo,
            fm.estatus_folio
        FROM donaciones.folios_maestros fm
        JOIN donaciones.detalle_operaciones det ON fm.id_folio = det.id_folio
        JOIN donaciones.control_prestamos cp ON fm.id_folio = cp.id_folio
        LEFT JOIN ortopedia.inventario inv ON det.id_item_externo = inv.id_articulo
        WHERE fm.tipo_movimiento = 'PRESTAMO' 
        AND cp.estatus_prestamo != 'DEVUELTO'
        ORDER BY fm.fecha_registro DESC
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/donaciones/prestamos/activos:", error);
    res.status(500).json({ error: 'Error interno al consultar préstamos activos.', detalles: error.message });
  }
});

// GET /api/donaciones/prestamos/mora o /api/prestamos/mora o /api/prestamos-mora o /api/donaciones/prestamos-mora
app.get(['/api/donaciones/prestamos/mora', '/api/prestamos/mora', '/api/prestamos-mora', '/api/donaciones/prestamos-mora'], async (req, res) => {
  try {
    const sql = `
            ${vistaSQL}
            WHERE "Operacion" = 'PRESTAMO' 
            AND "Estado_Prestamo" IN ('ACTIVO', 'MORA')
            AND "Vencimiento_Prestamo" < CURRENT_DATE
        `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/donaciones/prestamos/mora:", error);
    res.status(500).json({ error: 'Error interno al consultar préstamos en mora.', detalles: error.message });
  }
});

// GET /api/ortopedia/inventario o /api/ortopedia-inventario o /api/donaciones/ortopedia-inventario o /api/donaciones/ortopedia/inventario
app.get(['/api/ortopedia/inventario', '/api/ortopedia-inventario', '/api/donaciones/ortopedia-inventario', '/api/donaciones/ortopedia/inventario'], async (req, res) => {
  try {
    const sql = `SELECT * FROM ortopedia.inventario ORDER BY nombre ASC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/ortopedia/inventario:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ortopedia/beneficiarios o /api/ortopedia-beneficiarios o /api/donaciones/ortopedia-beneficiarios o /api/donaciones/ortopedia/beneficiarios
app.get(['/api/ortopedia/beneficiarios', '/api/ortopedia-beneficiarios', '/api/donaciones/ortopedia-beneficiarios', '/api/donaciones/ortopedia/beneficiarios'], async (req, res) => {
  try {
    const sql = `SELECT * FROM ortopedia.beneficiarios ORDER BY nombre_completo ASC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/ortopedia/beneficiarios:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/donaciones/registrar (Transacción Dinámica)
app.post(['/api/donaciones/registrar', '/api/registrar'], async (req, res) => {
  const { folio, detalle, prestamo } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 🌟 [DINÁMICO]: Extraemos el id_usuario que inyectó el validador de JWT desde la sesión real
    const idUsuarioActivo = req.usuario?.id_usuario || folio.id_usuario_registra || 1;

    // Sincronizar el usuario dinámicamente usando los datos de su JWT (sin depender de permisos en public.usuarios)
    const nombreUsuario = req.usuario?.nombre || req.usuario?.nombre_usuario || folio.nombre_usuario || 'Usuario Comunitario';
    const emailUsuario = req.usuario?.correo || req.usuario?.email || '';
    const rolUsuario = req.usuario?.rol || 'Personal';

    await client.query(`
      INSERT INTO donaciones.usuarios_config (id_usuario, nombre, email, rol)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_usuario) DO NOTHING;
    `, [idUsuarioActivo, nombreUsuario, emailUsuario, rolUsuario]);

    const fmQuery = `
        INSERT INTO donaciones.folios_maestros 
        (tipo_movimiento, area_origen, id_usuario_registra, observaciones_generales, estatus_folio)
        VALUES ($1, $2, $3, $4, $5) RETURNING id_folio;
    `;
    const fmValues = [
      folio.tipo_movimiento,
      folio.area_origen || 'Farmacia',
      idUsuarioActivo, // 👈 Se guarda el usuario logeado real en el ecosistema
      folio.observaciones_generales || '',
      String(folio.estatus_folio ?? 'true')
    ];
    const fmResult = await client.query(fmQuery, fmValues);
    const id_folio = fmResult.rows[0].id_folio;

    const doQuery = `
        INSERT INTO donaciones.detalle_operaciones 
        (id_folio, categoria, id_item_externo, nombre_item, cantidad, lote_serie, estado_fisico_entrega)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    const doValues = [
      id_folio,
      detalle.categoria || 'MEDICAMENTO',
      detalle.id_item_externo || null,
      detalle.nombre_item || 'Desconocido',
      detalle.cantidad || 1,
      detalle.lote_serie || null,
      detalle.estado_fisico_entrega || null
    ];
    await client.query(doQuery, doValues);

    if (folio.tipo_movimiento === 'PRESTAMO' && prestamo) {
      const cpQuery = `
            INSERT INTO donaciones.control_prestamos 
            (id_folio, nombre_solicitante, telefono_solicitante, fecha_hora_prestamo, fecha_hora_devolucion_pactada, fecha_hora_devolucion_real, estatus_prestamo, notas_devolucion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
      const cpValues = [
        id_folio,
        prestamo.nombre_solicitante || 'Sin Nombre',
        prestamo.telefono_solicitante || null,
        prestamo.fecha_hora_prestamo ? new Date(prestamo.fecha_hora_prestamo).toISOString() : new Date().toISOString(),
        prestamo.fecha_hora_devolucion_pactada ? new Date(prestamo.fecha_hora_devolucion_pactada).toISOString() : null,
        null,
        String(prestamo.estatus_prestamo || 'ACTIVO'),
        prestamo.notes_devolucion || null
      ];
      await client.query(cpQuery, cpValues);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, id_folio: id_folio });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en POST /api/donaciones/registrar:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// GET /api/donaciones/inventario (Mixto Farmacia / Ortopedia) o /api/inventario
app.get(['/api/donaciones/inventario', '/api/inventario'], async (req, res) => {
  try {
    const sql = `
            SELECT 
                'Ortopedia' as category,
                nombre as name,
                categoria as subcategory,
                cantidad_disponible as stock,
                10 as minimum
            FROM ortopedia.inventario
            UNION ALL
            SELECT 
                'Farmacia' as category,
                nombre as name,
                tipo_medicamento as subcategory,
                0 as stock,
                stock_minimo as minimum
            FROM farmacia.medicamentos
        `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/donaciones/inventario:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/donaciones/solicitudes o /api/solicitudes
app.get(['/api/donaciones/solicitudes', '/api/solicitudes'], async (req, res) => {
  try {
    const sql = `
            ${vistaSQL}
            WHERE ("Operacion" IN ('SALIDA', 'PRESTAMO'))
              AND (
                "Estado_Prestamo" = 'PENDIENTE' 
                OR "Estatus_Folio" = 'false'
                OR "Fecha_Sistema" >= NOW() - INTERVAL '1 day'
              )
            ORDER BY "Fecha_Sistema" DESC
        `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/donaciones/solicitudes:", error);
    res.status(500).json({ error: 'Error interno al consultar solicitudes.' });
  }
});

// PUT /api/donaciones/solicitudes/estado o /api/solicitudes/estado
app.put(['/api/donaciones/solicitudes/estado', '/api/solicitudes/estado'], async (req, res) => {
  try {
    const { id_folio, nuevo_estado } = req.body;
    const estatus_folio_val = nuevo_estado === 'ACTIVO' ? 'true' : 'false';
    const sql = `UPDATE donaciones.folios_maestros SET estatus_folio = $1 WHERE id_folio = $2 RETURNING *`;
    const result = await query(sql, [estatus_folio_val, id_folio]);

    await query(`UPDATE donaciones.control_prestamos SET estatus_prestamo = $1 WHERE id_folio = $2`, [nuevo_estado, id_folio]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (error) {
    console.error("Error en PUT /api/donaciones/solicitudes/estado:", error);
    res.status(500).json({ error: 'Error del servidor al actualizar estado.' });
  }
});

// PUT /api/donaciones/prestamos/devolucion o /api/prestamos/devolucion o /api/prestamos-devolucion o /api/donaciones/prestamos-devolucion
app.put(['/api/donaciones/prestamos/devolucion', '/api/prestamos/devolucion', '/api/prestamos-devolucion', '/api/donaciones/prestamos-devolucion'], async (req, res) => {
  try {
    const { id_folio, notas } = req.body;
    const sql = `UPDATE donaciones.control_prestamos SET estatus_prestamo = 'DEVUELTO', notas_devolucion = $1 WHERE id_folio = $2 RETURNING *`;
    const result = await query(sql, [notas || null, id_folio]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Préstamo no encontrado' });
    res.json({ success: true });
  } catch (error) {
    console.error("Error en PUT /api/donaciones/prestamos/devolucion:", error);
    res.status(500).json({ error: 'Error del servidor al registrar devolución.' });
  }
});

// DELETE /api/donaciones/eliminar/:id o /api/eliminar/:id
app.delete(['/api/donaciones/eliminar/:id', '/api/eliminar/:id'], async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM donaciones.detalle_operaciones WHERE id_folio = $1', [id]);
    await client.query('DELETE FROM donaciones.control_prestamos WHERE id_folio = $1', [id]);
    const result = await client.query('DELETE FROM donaciones.folios_maestros WHERE id_folio = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Folio no encontrado' });
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en DELETE /api/donaciones/eliminar:", error);
    res.status(500).json({ error: 'Error del servidor al eliminar registro.' });
  } finally {
    client.release();
  }
});

// PUT /api/donaciones/actualizar/:id o /api/actualizar/:id
app.put(['/api/donaciones/actualizar/:id', '/api/actualizar/:id'], async (req, res) => {
  const { id } = req.params;
  const { area_origen, nombre_item, cantidad, observaciones_generales } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const fmResult = await client.query(
      'UPDATE donaciones.folios_maestros SET area_origen = $1, observaciones_generales = $2 WHERE id_folio = $3 RETURNING *',
      [area_origen, observaciones_generales, id]
    );
    
    if (fmResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Folio no encontrado' });
    }
    
    await client.query(
      'UPDATE donaciones.detalle_operaciones SET nombre_item = $1, cantidad = $2 WHERE id_folio = $3',
      [nombre_item, cantidad, id]
    );
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro actualizado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en PUT /api/donaciones/actualizar:", error);
    res.status(500).json({ error: 'Error del servidor al actualizar registro.' });
  } finally {
    client.release();
  }
});

// Encendido del Servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Donaciones protegido y escuchando en el puerto ${PORT}`);
});