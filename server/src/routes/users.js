const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// User management routes
router.get('/', userController.listUsers);
router.get('/pending', userController.getPendingApprovals);
router.get('/:id', userController.getUserById);
router.post('/:id/verify', userController.verifyUser);
router.post('/:id/approve', userController.approveUser);
router.post('/:id/reject', userController.rejectUser);
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
