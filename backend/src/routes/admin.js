const { Router } = require('express');
const adminController = require('../controllers/adminController');

const router = Router();

router.get('/users', adminController.getUsers);
router.put('/users/:id/deactivate', adminController.toggleUserStatus);
router.get('/agencies', adminController.getAgencies);
router.post('/agencies', adminController.createAgency);
router.put('/agencies/:id', adminController.updateAgency);
router.put('/agencies/:id/deactivate', adminController.deactivateAgency);
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/cancel', adminController.cancelBooking);

module.exports = router;