import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requiereAuth } from '../middleware/requiereAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaFotos = path.join(__dirname, '..', '..', 'public', 'images', 'platos');
fs.mkdirSync(carpetaFotos, { recursive: true });

// Subida de fotos: se guardan en public/images/platos con un nombre único
const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
const subir = multer({
  storage: multer.diskStorage({
    destination: carpetaFotos,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${TIPOS[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (TIPOS[file.mimetype]) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o AVIF'));
  },
});

// Ejecuta multer y convierte sus errores en respuestas 400
function subirFoto(req, res, next) {
  subir.single('imagen')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

const rutaFoto = (file) => (file ? `/images/platos/${file.filename}` : null);

// Borra del disco una foto que ya no se usa.
// Solo borra fotos subidas desde el formulario (nombre "<timestamp>-<hex>.ext"),
// nunca las fotos de ejemplo como bandeja-paisa.jpg
const FOTO_SUBIDA = /^\d+-[0-9a-f]{8}\.(jpg|png|webp|avif)$/;
function borrarFoto(imagen) {
  if (!imagen?.startsWith('/images/platos/')) return;
  const nombre = path.basename(imagen);
  if (!FOTO_SUBIDA.test(nombre)) return;
  const archivo = path.join(carpetaFotos, nombre);
  fs.rm(archivo, { force: true }, () => {});
}

const router = Router();

// GET /api/platos -> listar todos (público)
router.get('/', (req, res) => {
  const platos = db.prepare('SELECT * FROM platos ORDER BY id DESC').all();
  res.json(platos);
});

// GET /api/platos/:id -> obtener uno (público)
router.get('/:id', (req, res) => {
  const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
  if (!plato) return res.status(404).json({ error: 'Plato no encontrado' });
  res.json(plato);
});

// POST /api/platos -> crear (requiere sesión). Acepta JSON o multipart con campo "imagen"
router.post('/', requiereAuth, subirFoto, (req, res) => {
  const { nombre, descripcion = '', ingredientes = '', precio } = req.body;
  if (!nombre || precio === undefined || precio === '' || isNaN(Number(precio))) {
    if (req.file) borrarFoto(rutaFoto(req.file));
    return res.status(400).json({ error: 'nombre y precio (número) son obligatorios' });
  }
  const info = db
    .prepare('INSERT INTO platos (nombre, descripcion, ingredientes, precio, imagen) VALUES (?, ?, ?, ?, ?)')
    .run(nombre, descripcion, ingredientes, Number(precio), rutaFoto(req.file));
  const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(plato);
});

// PUT /api/platos/:id -> actualizar (requiere sesión). Si llega foto nueva, reemplaza la anterior
router.put('/:id', requiereAuth, subirFoto, (req, res) => {
  const actual = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
  if (!actual) {
    if (req.file) borrarFoto(rutaFoto(req.file));
    return res.status(404).json({ error: 'Plato no encontrado' });
  }

  const {
    nombre = actual.nombre,
    descripcion = actual.descripcion,
    ingredientes = actual.ingredientes,
    precio = actual.precio,
  } = req.body;
  if (precio === '' || isNaN(Number(precio))) {
    if (req.file) borrarFoto(rutaFoto(req.file));
    return res.status(400).json({ error: 'precio debe ser un número' });
  }

  const imagen = req.file ? rutaFoto(req.file) : actual.imagen;
  db.prepare('UPDATE platos SET nombre = ?, descripcion = ?, ingredientes = ?, precio = ?, imagen = ? WHERE id = ?')
    .run(nombre, descripcion, ingredientes, Number(precio), imagen, req.params.id);
  if (req.file) borrarFoto(actual.imagen);

  res.json(db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id));
});

// DELETE /api/platos/:id -> eliminar (requiere sesión)
router.delete('/:id', requiereAuth, (req, res) => {
  const actual = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
  if (!actual) return res.status(404).json({ error: 'Plato no encontrado' });
  db.prepare('DELETE FROM platos WHERE id = ?').run(req.params.id);
  borrarFoto(actual.imagen);
  res.status(204).end();
});

export default router;
