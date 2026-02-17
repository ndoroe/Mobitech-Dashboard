const logger = require('../utils/logger');
const { promisePool } = require('../config/database');

/**
 * Get notifications for current user
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { unreadOnly = false, limit = 50 } = req.query;

    let query = `
      SELECT n.*, u.username as user_username, u.email as user_email
      FROM admin_notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.admin_id = ?
    `;
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND n.read = false';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [notifications] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching notifications.',
      error: error.message
    });
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/count
 */
async function getNotificationCount(req, res) {
  try {
    const userId = req.user.id;

    const [result] = await promisePool.query(
      'SELECT COUNT(*) as count FROM admin_notifications WHERE admin_id = ? AND `read` = false',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });

  } catch (error) {
    logger.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching notification count.',
      error: error.message
    });
  }
}

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to current user
    const [notifications] = await promisePool.query(
      'SELECT id FROM admin_notifications WHERE id = ? AND admin_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    // Mark as read
    await promisePool.query(
      'UPDATE admin_notifications SET `read` = true WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read.'
    });

  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while marking notification as read.',
      error: error.message
    });
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await promisePool.query(
      'UPDATE admin_notifications SET `read` = true WHERE admin_id = ? AND `read` = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });

  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while marking notifications as read.',
      error: error.message
    });
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to current user
    const [notifications] = await promisePool.query(
      'SELECT id FROM admin_notifications WHERE id = ? AND admin_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    // Delete notification
    await promisePool.query('DELETE FROM admin_notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification deleted.'
    });

  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting notification.',
      error: error.message
    });
  }
}

/**
 * Clear all read notifications
 * DELETE /api/notifications/clear-read
 */
async function clearReadNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [result] = await promisePool.query(
      'DELETE FROM admin_notifications WHERE admin_id = ? AND `read` = true',
      [userId]
    );

    res.json({
      success: true,
      message: 'Read notifications cleared.',
      deletedCount: result.affectedRows
    });

  } catch (error) {
    logger.error('Clear read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while clearing notifications.',
      error: error.message
    });
  }
}

module.exports = {
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
};
