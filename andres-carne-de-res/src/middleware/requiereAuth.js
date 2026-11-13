import db from '../db.js';

// Exige el encabezado "Authorization: Bearer <token>" con una sesión válida
export function requiereAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  const sesion = db
    .prepare(
      `SELECT u.id, u.usuario FROM sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token = ? AND s.expira_en > datetime('now')`
    )
    .get(token);

  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });

  req.usuario = sesion;
  req.token = token;
  next();
}
