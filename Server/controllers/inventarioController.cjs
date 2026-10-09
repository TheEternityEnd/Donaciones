const { query } = require('../config/db.cjs');

const getInventarioConsolidado = async (req, res, next) => {
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
    next(error);
  }
};

module.exports = {
  getInventarioConsolidado
};
