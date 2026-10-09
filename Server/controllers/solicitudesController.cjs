const { query } = require('../config/db.cjs');
const { vistaSQL } = require('./donacionesController.cjs');

const getSolicitudes = async (req, res, next) => {
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
    next(error);
  }
};

const actualizarEstadoSolicitud = async (req, res, next) => {
  try {
    const { id_folio, nuevo_estado } = req.body;
    if (!id_folio || !nuevo_estado) {
      return res.status(400).json({ error: 'id_folio y nuevo_estado son requeridos.' });
    }

    const estatus_folio_val = nuevo_estado === 'ACTIVO' ? 'true' : 'false';
    const fmSql = `UPDATE donaciones.folios_maestros SET estatus_folio = $1 WHERE id_folio = $2 RETURNING *`;
    const result = await query(fmSql, [estatus_folio_val, id_folio]);

    await query(`UPDATE donaciones.control_prestamos SET estatus_prestamo = $1 WHERE id_folio = $2`, [nuevo_estado, id_folio]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Solicitud o folio no encontrado' });
    }

    res.json({ success: true, nuevo_estado });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSolicitudes,
  actualizarEstadoSolicitud
};
