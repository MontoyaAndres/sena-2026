const { Router } = require('express');
const authors = require('../controllers/authors.controller');
const { upload } = require('../middlewares/upload');

const router = Router();

router.get('/', authors.list);
router.get('/:id', authors.getById);
router.get('/:id/books', authors.getBooks);
router.post('/', upload.single('photo'), authors.create);
router.put('/:id', upload.single('photo'), authors.update);
router.delete('/:id', authors.remove);

module.exports = router;
