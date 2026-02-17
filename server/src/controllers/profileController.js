const logger = require('../utils/logger');
const { promisePool } = require('../config/database');
const { hashPassword, verifyPassword, validatePassword } = require('../utils/authHelpers');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get current user profile
 * GET /api/profile
 */
async function getProfile(req, res) {
  try {
    const [users] = await promisePool.query(
      'SELECT id, username, email, role, status, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile.',
      error: error.message
    });
  }
}

/**
 * Change password
 * POST /api/profile/change-password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Get current user
    const [users] = await promisePool.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await promisePool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while changing password.',
      error: error.message
    });
  }
}

/**
 * Upload avatar
 * POST /api/profile/avatar
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    // File is already saved by multer to uploads/avatars/
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Get old avatar to delete it
    const [users] = await promisePool.query(
      'SELECT avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    const oldAvatar = users[0]?.avatar;

    // Update user avatar
    await promisePool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, req.user.id]
    );

    // Delete old avatar file if exists
    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
      const oldFilePath = path.join(__dirname, '../../../public', oldAvatar);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        logger.error('Failed to delete old avatar:', err);
      }
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully.',
      avatar: avatarPath
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while uploading avatar.',
      error: error.message
    });
  }
}

/**
 * Delete avatar
 * DELETE /api/profile/avatar
 */
async function deleteAvatar(req, res) {
  try {
    // Get current avatar
    const [users] = await promisePool.query(
      'SELECT avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    const avatar = users[0]?.avatar;

    // Update user avatar to null
    await promisePool.query(
      'UPDATE users SET avatar = NULL WHERE id = ?',
      [req.user.id]
    );

    // Delete avatar file if exists
    if (avatar && avatar.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../public', avatar);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        logger.error('Failed to delete avatar file:', err);
      }
    }

    res.json({
      success: true,
      message: 'Avatar deleted successfully.'
    });
  } catch (error) {
    logger.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting avatar.',
      error: error.message
    });
  }
}

module.exports = {
  getProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar
};
