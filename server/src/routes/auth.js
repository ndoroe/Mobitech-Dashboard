const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
