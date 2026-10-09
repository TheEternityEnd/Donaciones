const { query } = require('../config/db.cjs');

const getUsuarioActivo = async (req, res, next) => {
  try {
    const usuario = req.usuario || {};
    res.json({
      id_usuario: usuario.id_usuario || 1,
      nombre: usuario.nombre || usuario.nombre_usuario || 'Usuario Comunitario',
      rol: usuario.rol || 'Personal',
      email: usuario.email || usuario.correo || '',
      sedes: usuario.sedes || []
    });
  } catch (error) {
    next(error);
  }
};

const actualizarAjustes = async (req, res, next) => {
  try {
    const { id_usuario, idioma_pref, tema_pref } = req.body;
    const targetUserId = id_usuario || req.usuario?.id_usuario;

    if (!targetUserId) {
      return res.status(400).json({ error: 'id_usuario es requerido' });
    }

    const idioma = idioma_pref || 'es';
    const tema = tema_pref || 'light';

    const sql = `
      INSERT INTO donaciones.usuarios_config (id_usuario, nombre, email, rol, idioma_pref, tema_pref)
      VALUES ($1, 'Usuario', '', 'Personal', $2, $3)
      ON CONFLICT (id_usuario) 
      DO UPDATE SET idioma_pref = EXCLUDED.idioma_pref, tema_pref = EXCLUDED.tema_pref;
    `;
    await query(sql, [targetUserId, idioma, tema]);
    res.json({ success: true, idioma_pref: idioma, tema_pref: tema });
  } catch (error) {
    next(error);
  }
};

const getUsuarioConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM donaciones.usuarios_config WHERE id_usuario = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ id_usuario: parseInt(id), idioma_pref: 'es', tema_pref: 'light' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsuarioActivo,
  actualizarAjustes,
  getUsuarioConfig
};
