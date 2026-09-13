const { Router } = require('express');
const warehousesController = require('./warehouses.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { validateCreateWarehouse, validateTransfer } = require('./warehouses.validation');

const router = Router();

router.use(authenticate);

// View warehouses (any authenticated user)
router.get('/', warehousesController.getAllWarehouses);
router.get('/:id', warehousesController.getWarehouseById);
router.get('/:id/occupancy', warehousesController.getOccupancy);

// Modify warehouses (admin/manager)
router.post('/', authorize('admin', 'manager'), validate({ body: validateCreateWarehouse }), warehousesController.createWarehouse);
router.patch('/:id', authorize('admin', 'manager'), warehousesController.updateWarehouse);
// Update occupancy: admin can update any; manager is further restricted to their branch's warehouses
router.patch('/:id/occupancy', authorize('admin', 'manager'), warehousesController.updateOccupancy);
router.delete('/:id', authorize('admin'), warehousesController.deactivateWarehouse);

// Transfers (admin/manager/branch_employee)
router.post('/transfers', authorize('admin', 'manager', 'branch_employee'), validate({ body: validateTransfer }), warehousesController.initiateTransfer);
router.patch('/transfers/:transferId/complete', authorize('admin', 'manager', 'branch_employee'), warehousesController.completeTransfer);

module.exports = router;
