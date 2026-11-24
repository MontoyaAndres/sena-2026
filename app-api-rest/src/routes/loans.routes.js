const { Router } = require('express');
const loans = require('../controllers/loans.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Los préstamos tienen datos personales: todas las rutas requieren sesión
router.use(requireAuth);

router.get('/', loans.list);
router.post('/', loans.create);
router.put('/:id/return', loans.markReturned);
router.delete('/:id', loans.remove);

module.exports = router;
