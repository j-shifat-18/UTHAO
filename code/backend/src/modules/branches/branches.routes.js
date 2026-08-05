const { Router } = require('express');
const branchesController = require('./branches.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { validateCreateBranch, validateUpdateBranch } = require('./branches.validation');

const router = Router();

router.use(authenticate);

// Anyone authenticated can view branches
router.get('/', branchesController.getAllBranches);
router.get('/:id', branchesController.getBranchById);
router.get('/:id/stats', branchesController.getBranchStats);

// Only admin/manager can modify
router.post('/', authorize('admin', 'manager'), validate({ body: validateCreateBranch }), branchesController.createBranch);
router.patch('/:id', authorize('admin', 'manager'), validate({ body: validateUpdateBranch }), branchesController.updateBranch);
router.delete('/:id', authorize('admin'), branchesController.deleteBranch);

module.exports = router;
