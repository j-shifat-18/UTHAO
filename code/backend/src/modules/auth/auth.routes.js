const { Router } = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { validateRegister, validateLogin, validateRefreshToken } = require('./auth.validation');

const router = Router();

router.post('/register', validate({ body: validateRegister }), authController.register);
router.post('/login', validate({ body: validateLogin }), authController.login);
router.post('/refresh-token', validate({ body: validateRefreshToken }), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
