const { Router } = require('express');
const books = require('../controllers/books.controller');
const { upload } = require('../middlewares/upload');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// "image": portada (1 archivo) · "gallery": imágenes extra para el detalle (hasta 6)
const bookImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 6 },
]);

// Lectura pública
router.get('/', books.list);
router.get('/:id', books.getById);

// Escritura: requiere sesión (requireAuth va antes de multer para no guardar archivos sin permiso)
router.post('/', requireAuth, bookImages, books.create);
router.put('/:id', requireAuth, bookImages, books.update);
router.delete('/:id', requireAuth, books.remove);
router.delete('/:id/images/:imageId', requireAuth, books.removeImage);

module.exports = router;
