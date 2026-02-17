const logger = require('../utils/logger');
const { promisePool } = require('../config/database');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

/**
 * List all users (admin only)
 * GET /api/users
 */
async function listUsers(req, res) {
  try {
    const { status, role } = req.query;

    let query = 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users.',
      error: error.message
    });
  }
}

/**
 * Get users pending approval (admin only)
 * GET /api/users/pending
 */
async function getPendingApprovals(req, res) {
  try {
    const [users] = await promisePool.query(
      `SELECT id, username, email, created_at 
       FROM users 
       WHERE status = ? 
       ORDER BY created_at ASC`,
      ['pending_approval']
    );

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pending approvals.',
      error: error.message
    });
  }
}

/**
 * Approve a user (admin only)
 * POST /api/users/:id/approve
 */
async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get user details
    const [users] = await promisePool.query(
      'SELECT id, username, email, status FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Allow approval from both pending_verification and pending_approval statuses
    if (user.status !== 'pending_approval' && user.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending verification or approval.'
      });
    }

    // Update user status to active and clear verification token if exists
    await promisePool.query(
      'UPDATE users SET status = ?, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      ['active', id]
    );

    // Log approval action
    await promisePool.query(
      `INSERT INTO user_approval_requests (user_id, admin_id, action)
       VALUES (?, ?, ?)`,
      [id, adminId, 'approved']
    );

    // Send approval email to user
    await sendApprovalEmail(user.email, user.username)
      .catch(err => logger.error('Failed to send approval email:', err));

    res.json({
      success: true,
      message: 'User approved successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'active'
      }
    });

  } catch (error) {
    logger.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while approving user.',
      error: error.message
    });
  }
}

/**
 * Manually verify a user's email (admin only)
 * POST /api/users/:id/verify
 */
async function verifyUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get user details
    const [users] = await promisePool.query(
      'SELECT id, username, email, status FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    if (user.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending verification.'
      });
    }

    // Update user status to pending_approval and clear verification token
    await promisePool.query(
      'UPDATE users SET status = ?, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      ['pending_approval', id]
    );

    // Create admin notification for approval needed
    await promisePool.query(
      `INSERT INTO admin_notifications (user_id, type, message)
       VALUES (?, ?, ?)`,
      [
        id,
        'user_verified',
        `User ${user.username} has been manually verified by admin and is awaiting approval.`
      ]
    );

    res.json({
      success: true,
      message: 'User verified successfully. User is now pending approval.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'pending_approval'
      }
    });

  } catch (error) {
    logger.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying user.',
      error: error.message
    });
  }
}

/**
 * Reject a user (admin only)
 * POST /api/users/:id/reject
 */
async function rejectUser(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Get user details
    const [users] = await promisePool.query(
      'SELECT id, username, email, status FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Allow rejection from both pending_verification and pending_approval statuses
    if (user.status !== 'pending_approval' && user.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending verification or approval.'
      });
    }

    // Update user status to rejected
    await promisePool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['rejected', id]
    );

    // Log rejection action
    await promisePool.query(
      `INSERT INTO user_approval_requests (user_id, admin_id, action, reason)
       VALUES (?, ?, ?, ?)`,
      [id, adminId, 'rejected', reason || null]
    );

    // Send rejection email to user
    await sendRejectionEmail(user.email, user.username, reason)
      .catch(err => logger.error('Failed to send rejection email:', err));

    res.json({
      success: true,
      message: 'User rejected successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'rejected'
      }
    });

  } catch (error) {
    logger.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while rejecting user.',
      error: error.message
    });
  }
}

/**
 * Update user role (admin only)
 * PUT /api/users/:id/role
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin" or "user".'
      });
    }

    // Prevent changing own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.'
      });
    }

    // Get user details
    const [users] = await promisePool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update role
    await promisePool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    res.json({
      success: true,
      message: 'User role updated successfully.',
      user: {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: role
      }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating user role.',
      error: error.message
    });
  }
}

/**
 * Delete a user (admin only)
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Check if user exists
    const [users] = await promisePool.query(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Delete user (cascades to related records)
    await promisePool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting user.',
      error: error.message
    });
  }
}

/**
 * Get user details by ID (admin only)
 * GET /api/users/:id
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const [users] = await promisePool.query(
      `SELECT id, username, email, role, status, created_at, updated_at 
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get approval history
    const [approvalHistory] = await promisePool.query(
      `SELECT uar.*, u.username as admin_username 
       FROM user_approval_requests uar
       LEFT JOIN users u ON uar.admin_id = u.id
       WHERE uar.user_id = ?
       ORDER BY uar.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      user: users[0],
      approvalHistory
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user details.',
      error: error.message
    });
  }
}

module.exports = {
  listUsers,
  getPendingApprovals,
  approveUser,
  verifyUser,
  rejectUser,
  updateUserRole,
  deleteUser,
  getUserById
};
