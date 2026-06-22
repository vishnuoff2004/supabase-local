const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleUploads } = require('../middleware/upload');

const router = Router();

router.post('/register', handleUploads, authController.register);
router.post('/complete-registration', authController.completeRegistration);
router.post('/oauth-setup', authController.oauthSetup);
router.get('/me', authenticate, authController.getMe);
router.post('/setup-role', authenticate, authController.setupRole);
router.patch('/profile', authenticate, authController.updateProfile);

module.exports = router;
