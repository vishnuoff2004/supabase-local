const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const announcementController = require('../controllers/announcementController');

const router = Router();

router.get('/', announcementController.listActive);
router.post('/', authenticate, authorize('admin'), announcementController.create);
router.put('/:id', authenticate, authorize('admin'), announcementController.update);
router.delete('/:id', authenticate, authorize('admin'), announcementController.remove);

module.exports = router;