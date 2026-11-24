const multer = require('multer');
const { removeUploadedFiles } = require('./upload');

// Error con código HTTP. Se lanza desde los controladores: throw new HttpError(404, '...')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Rutas /api que no existen
function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores (Express 5 también captura los errores de funciones async)
function errorHandler(err, req, res, next) {
  // Si la petición falló, borrar las imágenes que multer alcanzó a guardar
  removeUploadedFiles(req);

  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor';

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el tamaño máximo (5 MB)' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la petición no es un JSON válido';
  } else if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    status = 409;
    message = 'Ya existe un registro con ese nombre';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Error interno del servidor' : message });
}

module.exports = { HttpError, notFound, errorHandler };
