const db = require('../db/database');
const { HttpError } = require('../middlewares/errorHandler');
const { registerFailedLogin, clearFailedLogins } = require('../middlewares/auth');
const { verifyPassword, createToken, verifyToken } = require('../services/auth');
const { requiredText } = require('../utils/validate');

// POST /api/auth/login  { username, password }
function login(req, res) {
  const username = requiredText(req.body?.username, 'username', 100);
  const password = requiredText(req.body?.password, 'password', 200);

  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    registerFailedLogin(req.ip);
    throw new HttpError(401, 'Usuario o contraseña incorrectos');
  }

  clearFailedLogins(req.ip);
  const token = createToken(user);
  res.json({
    token,
    expiresAt: new Date(verifyToken(token).exp).toISOString(),
    user: { id: user.id, username: user.username },
  });
}

// GET /api/auth/me  (requiere token)
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
