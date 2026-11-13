import crypto from 'node:crypto';

// Contraseñas: se guarda "salt:hash" usando scrypt (incluido en Node, sin librerías extra)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarPassword(password, guardado) {
  const [salt, hash] = guardado.split(':');
  const calculado = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(calculado, Buffer.from(hash, 'hex'));
}

export function nuevoToken() {
  return crypto.randomBytes(32).toString('hex');
}
