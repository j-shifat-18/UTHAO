const { Router } = require('express');
const usersController = require('./users.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

// All user routes require authentication + admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.patch('/:id', usersController.updateUser);
router.patch('/:id/deactivate', usersController.deactivateUser);
router.patch('/:id/activate', usersController.activateUser);

module.exports = router;
