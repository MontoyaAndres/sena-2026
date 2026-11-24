const { Router } = require('express');
const categories = require('../controllers/categories.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Lectura pública
router.get('/', categories.list);
router.get('/:id', categories.getById);

// Escritura: requiere sesión
router.post('/', requireAuth, categories.create);
router.put('/:id', requireAuth, categories.update);
router.delete('/:id', requireAuth, categories.remove);

module.exports = router;
