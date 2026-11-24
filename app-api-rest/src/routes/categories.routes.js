const { Router } = require('express');
const categories = require('../controllers/categories.controller');

const router = Router();

router.get('/', categories.list);
router.get('/:id', categories.getById);
router.post('/', categories.create);
router.put('/:id', categories.update);
router.delete('/:id', categories.remove);

module.exports = router;
