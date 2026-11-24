const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Solo se permiten imágenes (jpg, png, webp, gif)');
    err.status = 400;
    cb(err);
  },
});

// Ruta pública con la que se guarda la imagen en la base de datos
const publicPath = (file) => `/uploads/${file.filename}`;

// Borra un archivo de /uploads si la ruta es local (las URLs externas se ignoran)
function removeUpload(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const file = path.join(UPLOADS_DIR, path.basename(url));
  fs.rm(file, { force: true }, () => {});
}

// Borra todos los archivos subidos en una petición (se usa cuando la petición falla)
function removeUploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) files.push(...(Array.isArray(req.files) ? req.files : Object.values(req.files).flat()));
  for (const f of files) fs.rm(f.path, { force: true }, () => {});
}

module.exports = { upload, publicPath, removeUpload, removeUploadedFiles };
