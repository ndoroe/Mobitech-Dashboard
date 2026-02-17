const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getNotificationCount);
router.post('/read-all', notificationController.markAllAsRead);
router.delete('/clear-read', notificationController.clearReadNotifications);
router.post('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
