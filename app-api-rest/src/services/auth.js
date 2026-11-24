// Autenticación: hash de contraseñas con scrypt y tokens firmados con HMAC
// (un formato parecido a JWT, hecho solo con el módulo crypto de Node).
const crypto = require('node:crypto');
const db = require('../db/database');
const config = require('../config');

// ---------- Contraseñas ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// ---------- Tokens ----------
let secret = config.AUTH_SECRET;
if (!secret) {
  // Sin AUTH_SECRET, las sesiones se pierden cada vez que se reinicia el servidor
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  AUTH_SECRET no está definido: se generó uno temporal (las sesiones se cierran al reiniciar).');
}

const base64url = (value) => Buffer.from(value).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function createToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    exp: Date.now() + config.TOKEN_TTL_HOURS * 60 * 60 * 1000,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

// Devuelve el payload si el token es válido y no ha vencido; si no, null
function verifyToken(token) {
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

// ---------- Usuario administrador inicial ----------
// Si no hay usuarios, crea uno con ADMIN_USER / ADMIN_PASSWORD
function ensureAdminUser() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n > 0) return;

  let password = config.ADMIN_PASSWORD;
  if (!password) {
    password = 'admin123';
    console.warn(`⚠️  ADMIN_PASSWORD no está definido: se creó el usuario "${config.ADMIN_USER}" con la contraseña por defecto. Cámbiala en producción.`);
  }
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(config.ADMIN_USER, hashPassword(password));
  console.log(`👤 Usuario administrador "${config.ADMIN_USER}" creado`);
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken, ensureAdminUser };
