const { HttpError } = require('../middlewares/errorHandler');

// Convierte un id (de la URL o del body) a entero positivo o lanza 400
function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El campo "${field}" debe ser un número entero positivo`);
  }
  return id;
}

// Entero >= 0 (por ejemplo, número de ejemplares)
function parseNonNegativeInt(value, field, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (value === '' || !Number.isInteger(n) || n < 0 || n > max) {
    throw new HttpError(400, `El campo "${field}" debe ser un número entero entre 0 y ${max}`);
  }
  return n;
}

// Fecha obligatoria con formato AAAA-MM-DD
function parseDate(value, field) {
  const text = requiredText(value, field, 10);
  const date = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new HttpError(400, `El campo "${field}" debe ser una fecha válida con formato AAAA-MM-DD`);
  }
  return text;
}

// Texto obligatorio: quita espacios y valida que no esté vacío
function requiredText(value, field, max = 255) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  if (value.trim().length > max) {
    throw new HttpError(400, `El campo "${field}" no puede superar ${max} caracteres`);
  }
  return value.trim();
}

// Texto opcional: devuelve null si viene vacío
function optionalText(value, field, max = 5000) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new HttpError(400, `El campo "${field}" debe ser texto`);
  const text = value.trim();
  if (text.length > max) throw new HttpError(400, `El campo "${field}" no puede superar ${max} caracteres`);
  return text === '' ? null : text;
}

// URL de imagen opcional: debe ser http(s) o una ruta /uploads/
function optionalImageUrl(value, field) {
  const text = optionalText(value, field, 2000);
  if (text && !/^https?:\/\//i.test(text) && !text.startsWith('/uploads/')) {
    throw new HttpError(400, `El campo "${field}" debe ser una URL que empiece por http:// o https://`);
  }
  return text;
}

module.exports = { parseId, parseNonNegativeInt, parseDate, requiredText, optionalText, optionalImageUrl };
