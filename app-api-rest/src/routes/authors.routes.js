const { Router } = require('express');
const authors = require('../controllers/authors.controller');
const { upload } = require('../middlewares/upload');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Lectura pública
router.get('/', authors.list);
router.get('/:id', authors.getById);
router.get('/:id/books', authors.getBooks);

// Escritura: requiere sesión
router.post('/', requireAuth, upload.single('photo'), authors.create);
router.put('/:id', requireAuth, upload.single('photo'), authors.update);
router.delete('/:id', requireAuth, authors.remove);

module.exports = router;
