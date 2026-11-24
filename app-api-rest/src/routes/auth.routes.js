const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const { requireAuth, loginRateLimit } = require('../middlewares/auth');

const router = Router();

router.post('/login', loginRateLimit, auth.login);
router.get('/me', requireAuth, auth.me);

module.exports = router;
