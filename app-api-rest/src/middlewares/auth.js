const { verifyToken } = require('../services/auth');
const { HttpError } = require('./errorHandler');

// Exige el header "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  const payload = scheme === 'Bearer' && token ? verifyToken(token) : null;
  if (!payload) throw new HttpError(401, 'Debes iniciar sesión para realizar esta acción');
  req.user = { id: payload.sub, username: payload.username };
  next();
}

// Límite de intentos fallidos de login por IP (protección básica contra fuerza bruta)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

function loginRateLimit(req, res, next) {
  const entry = attempts.get(req.ip);
  if (entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS) {
    const minutes = Math.ceil((entry.resetAt - Date.now()) / 60000);
    res.set('Retry-After', String(minutes * 60));
    throw new HttpError(429, `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto(s).`);
  }
  next();
}

function registerFailedLogin(ip) {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= Date.now()) {
    attempts.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

const clearFailedLogins = (ip) => attempts.delete(ip);

module.exports = { requireAuth, loginRateLimit, registerFailedLogin, clearFailedLogins };
