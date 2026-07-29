const { Router } = require('express');
const customersController = require('./customers.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { validateUpdateCustomer, validateAddress } = require('./customers.validation');

const router = Router();

router.use(authenticate);

// Customer can get their own profile
router.get('/me', customersController.getMyProfile);

// Admin/Manager can list all customers
router.get('/', authorize('admin', 'manager'), customersController.getAllCustomers);

// Get customer by id (admin/manager or the customer themselves)
router.get('/:id', customersController.getCustomerById);

// Update customer profile
router.patch('/:id', validate({ body: validateUpdateCustomer }), customersController.updateCustomer);

// Addresses
router.get('/:id/addresses', customersController.getCustomerAddresses);
router.post('/:id/addresses', validate({ body: validateAddress }), customersController.addCustomerAddress);

module.exports = router;
