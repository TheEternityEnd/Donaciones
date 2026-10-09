const { pool, query } = require('../config/db.cjs');
const { vistaSQL } = require('./donacionesController.cjs');

const getPrestamosActivos = async (req, res, next) => {
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
    next(error);
  }
};

const getPrestamosMora = async (req, res, next) => {
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
    next(error);
  }
};

const devolucionPrestamo = async (req, res, next) => {
  const { id_folio, notas } = req.body;
  if (!id_folio) {
    return res.status(400).json({ error: 'id_folio es requerido para registrar la devolución.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatePrestamoSql = `
      UPDATE donaciones.control_prestamos 
      SET estatus_prestamo = 'DEVUELTO', 
          notas_devolucion = $1, 
          fecha_hora_devolucion_real = CURRENT_TIMESTAMP 
      WHERE id_folio = $2 
      RETURNING *;
    `;
    const result = await client.query(updatePrestamoSql, [notas || null, id_folio]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    // Reintegrar stock al inventario de ortopedia si existe el item externo
    const detalleSql = `
      SELECT id_item_externo, cantidad 
      FROM donaciones.detalle_operaciones 
      WHERE id_folio = $1;
    `;
    const detalleResult = await client.query(detalleSql, [id_folio]);
    if (detalleResult.rows.length > 0) {
      const { id_item_externo, cantidad } = detalleResult.rows[0];
      if (id_item_externo) {
        await client.query(
          `UPDATE ortopedia.inventario 
           SET cantidad_disponible = cantidad_disponible + $1 
           WHERE id_articulo = $2`,
          [cantidad || 1, id_item_externo]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Devolución registrada y stock reintegrado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getPrestamosActivos,
  getPrestamosMora,
  devolucionPrestamo
};
