const { query } = require('../config/db.cjs');

const getOrtopediaInventario = async (req, res, next) => {
  try {
    const sql = `SELECT * FROM ortopedia.inventario ORDER BY nombre ASC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getOrtopediaBeneficiarios = async (req, res, next) => {
  try {
    const sql = `SELECT * FROM ortopedia.beneficiarios ORDER BY nombre_completo ASC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrtopediaInventario,
  getOrtopediaBeneficiarios
};
