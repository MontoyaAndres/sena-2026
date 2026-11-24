const { Router } = require('express');
const books = require('../controllers/books.controller');
const { upload } = require('../middlewares/upload');

const router = Router();

// "image": portada (1 archivo) · "gallery": imágenes extra para el detalle (hasta 6)
const bookImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 6 },
]);

router.get('/', books.list);
router.get('/:id', books.getById);
router.post('/', bookImages, books.create);
router.put('/:id', bookImages, books.update);
router.delete('/:id', books.remove);
router.delete('/:id/images/:imageId', books.removeImage);

module.exports = router;
