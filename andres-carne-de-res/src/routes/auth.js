import { Router } from 'express';
import db from '../db.js';
import { verificarPassword, nuevoToken } from '../auth.js';
import { requiereAuth } from '../middleware/requiereAuth.js';

const router = Router();
const DURACION_SESION = '+8 hours';

// POST /api/auth/login -> { usuario, password } => { token, usuario }
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const encontrado = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
  if (!encontrado || !verificarPassword(password, encontrado.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Limpia sesiones vencidas y crea una nueva
  db.prepare("DELETE FROM sesiones WHERE expira_en <= datetime('now')").run();
  const token = nuevoToken();
  db.prepare("INSERT INTO sesiones (token, usuario_id, expira_en) VALUES (?, ?, datetime('now', ?))")
    .run(token, encontrado.id, DURACION_SESION);

  res.json({ token, usuario: encontrado.usuario });
});

// GET /api/auth/me -> datos del usuario de la sesión actual
router.get('/me', requiereAuth, (req, res) => {
  res.json({ usuario: req.usuario.usuario });
});

// POST /api/auth/logout -> cierra la sesión actual
router.post('/logout', requiereAuth, (req, res) => {
  db.prepare('DELETE FROM sesiones WHERE token = ?').run(req.token);
  res.status(204).end();
});

export default router;
