const { pool, query } = require('../config/db.cjs');

// Vista consolidada base para consultas de historial y folios
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

const getHistorial = async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = `${vistaSQL}`;
    const params = [];

    if (search && search.trim() !== '') {
      sql += ` WHERE "Folio"::TEXT ILIKE $1::TEXT OR "Beneficiario" ILIKE $1::TEXT OR "Articulo" ILIKE $1::TEXT OR "observaciones_generales" ILIKE $1::TEXT`;
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY "Fecha_Sistema" DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const registrarMovimiento = async (req, res, next) => {
  const { folio, detalle, prestamo } = req.body;

  if (!folio || !detalle) {
    return res.status(400).json({ error: 'Estructura de datos incompleta: folio y detalle son requeridos.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const idUsuarioActivo = req.usuario?.id_usuario || folio.id_usuario_registra || 1;

    // 1. Inserción de cabecera en folios_maestros
    const fmQuery = `
      INSERT INTO donaciones.folios_maestros 
      (tipo_movimiento, area_origen, id_usuario_registra, observaciones_generales, estatus_folio)
      VALUES ($1, $2, $3, $4, $5) RETURNING id_folio;
    `;
    const fmValues = [
      (folio.tipo_movimiento || 'ENTRADA').toUpperCase(),
      folio.area_origen || 'Farmacia',
      idUsuarioActivo,
      folio.observaciones_generales || '',
      String(folio.estatus_folio ?? 'true')
    ];
    const fmResult = await client.query(fmQuery, fmValues);
    const id_folio = fmResult.rows[0].id_folio;

    // 2. Inserción de detalle
    const cantNum = Math.max(1, parseInt(detalle.cantidad) || 1);
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
      cantNum,
      detalle.lote_serie || null,
      detalle.estado_fisico_entrega || null
    ];
    await client.query(doQuery, doValues);

    // 3. Control de préstamos si aplica
    const movUpper = (folio.tipo_movimiento || '').toUpperCase();
    if (movUpper === 'PRESTAMO' && prestamo) {
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
        prestamo.notes_devolucion || prestamo.notas_devolucion || null
      ];
      await client.query(cpQuery, cpValues);
    }

    // 4. 🌟 Sincronización Automática de Stock en Ortopedia
    if (detalle.id_item_externo) {
      if (movUpper === 'SALIDA' || movUpper === 'PRESTAMO') {
        await client.query(
          'UPDATE ortopedia.inventario SET cantidad_disponible = GREATEST(0, cantidad_disponible - $1) WHERE id_articulo = $2',
          [cantNum, detalle.id_item_externo]
        );
      } else if (movUpper === 'ENTRADA') {
        await client.query(
          'UPDATE ortopedia.inventario SET cantidad_disponible = cantidad_disponible + $1 WHERE id_articulo = $2',
          [cantNum, detalle.id_item_externo]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, id_folio: id_folio });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const actualizarFolio = async (req, res, next) => {
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
    next(error);
  } finally {
    client.release();
  }
};

const eliminarFolio = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM donaciones.control_prestamos WHERE id_folio = $1', [id]);
    await client.query('DELETE FROM donaciones.detalle_operaciones WHERE id_folio = $1', [id]);
    const result = await client.query('DELETE FROM donaciones.folios_maestros WHERE id_folio = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Folio no encontrado' });
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  vistaSQL,
  getHistorial,
  registrarMovimiento,
  actualizarFolio,
  eliminarFolio
};
