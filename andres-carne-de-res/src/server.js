import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import platosRouter from './routes/platos.js';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Frontend estático (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/platos', platosRouter);

// GET /api/imagenes -> lista las fotos de public/images (para el slider del hero)
const imagesDir = path.join(__dirname, '..', 'public', 'images');
const EXTENSIONES = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

app.get('/api/imagenes', (req, res) => {
  if (!fs.existsSync(imagesDir)) return res.json([]);

  // Si la misma foto existe en varios formatos (ej. .jpg y .avif), se usa solo una
  const porNombre = new Map();
  for (const archivo of fs.readdirSync(imagesDir).sort()) {
    const ext = path.extname(archivo).toLowerCase();
    if (!EXTENSIONES.includes(ext)) continue;
    const base = path.basename(archivo, path.extname(archivo));
    const actual = porNombre.get(base);
    if (!actual || EXTENSIONES.indexOf(ext) < EXTENSIONES.indexOf(path.extname(actual).toLowerCase())) {
      porNombre.set(base, archivo);
    }
  }

  res.json([...porNombre.values()].map((archivo) => `/images/${encodeURIComponent(archivo)}`));
});

// 404 para rutas de la API que no existen
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
