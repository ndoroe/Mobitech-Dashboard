const { promisePool: db } = require('../config/database');

/**
 * Get user preferences
 * GET /api/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userEmail = req.user?.email || 'admin@materialadminlte.com'; // From JWT token

    const query = `
      SELECT 
        user_email,
        alerts_enabled,
        warning_threshold,
        critical_threshold,
        warning_color,
        critical_color,
        created_at,
        updated_at
      FROM user_preferences 
      WHERE user_email = ?
    `;

    const [results] = await db.query(query, [userEmail]);

    if (results.length === 0) {
      // Return default preferences if user has none
      return res.json({
        success: true,
        data: {
          user_email: userEmail,
          alerts_enabled: true,
          warning_threshold: 60.00,
          critical_threshold: 80.00,
          warning_color: '#ed6c02',
          critical_color: '#d32f2f'
        }
      });
    }

    res.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

/**
 * Update user preferences
 * PUT /api/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userEmail = req.user?.email || 'admin@materialadminlte.com'; // From JWT token
    const {
      alerts_enabled,
      warning_threshold,
      critical_threshold,
      warning_color,
      critical_color
    } = req.body;

    // Validation
    if (warning_threshold !== undefined && critical_threshold !== undefined) {
      if (warning_threshold >= critical_threshold) {
        return res.status(400).json({
          success: false,
          message: 'Warning threshold must be less than critical threshold'
        });
      }
      if (warning_threshold < 0 || warning_threshold > 100) {
        return res.status(400).json({
          success: false,
          message: 'Warning threshold must be between 0 and 100'
        });
      }
      if (critical_threshold < 0 || critical_threshold > 100) {
        return res.status(400).json({
          success: false,
          message: 'Critical threshold must be between 0 and 100'
        });
      }
    }

    // Validate color format (hex)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (warning_color && !hexColorRegex.test(warning_color)) {
      return res.status(400).json({
        success: false,
        message: 'Warning color must be a valid hex color (e.g., #ed6c02)'
      });
    }
    if (critical_color && !hexColorRegex.test(critical_color)) {
      return res.status(400).json({
        success: false,
        message: 'Critical color must be a valid hex color (e.g., #d32f2f)'
      });
    }

    // Check if preferences exist
    const [existing] = await db.query(
      'SELECT id FROM user_preferences WHERE user_email = ?',
      [userEmail]
    );

    if (existing.length === 0) {
      // Insert new preferences
      const insertQuery = `
        INSERT INTO user_preferences 
        (user_email, alerts_enabled, warning_threshold, critical_threshold, warning_color, critical_color)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.query(insertQuery, [
        userEmail,
        alerts_enabled !== undefined ? alerts_enabled : true,
        warning_threshold !== undefined ? warning_threshold : 60.00,
        critical_threshold !== undefined ? critical_threshold : 80.00,
        warning_color || '#ed6c02',
        critical_color || '#d32f2f'
      ]);
    } else {
      // Update existing preferences
      const updateQuery = `
        UPDATE user_preferences 
        SET 
          alerts_enabled = COALESCE(?, alerts_enabled),
          warning_threshold = COALESCE(?, warning_threshold),
          critical_threshold = COALESCE(?, critical_threshold),
          warning_color = COALESCE(?, warning_color),
          critical_color = COALESCE(?, critical_color),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_email = ?
      `;
      await db.query(updateQuery, [
        alerts_enabled,
        warning_threshold,
        critical_threshold,
        warning_color,
        critical_color,
        userEmail
      ]);
    }

    // Fetch and return updated preferences
    const [updated] = await db.query(
      'SELECT * FROM user_preferences WHERE user_email = ?',
      [userEmail]
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

/**
 * Reset user preferences to defaults
 * POST /api/preferences/reset
 */
exports.resetPreferences = async (req, res) => {
  try {
    const userEmail = req.user?.email || 'admin@materialadminlte.com';

    const updateQuery = `
      UPDATE user_preferences 
      SET 
        alerts_enabled = TRUE,
        warning_threshold = 60.00,
        critical_threshold = 80.00,
        warning_color = '#ed6c02',
        critical_color = '#d32f2f',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;

    await db.query(updateQuery, [userEmail]);

    // Fetch and return reset preferences
    const [updated] = await db.query(
      'SELECT * FROM user_preferences WHERE user_email = ?',
      [userEmail]
    );

    res.json({
      success: true,
      message: 'Preferences reset to defaults',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset preferences',
      error: error.message
    });
  }
};
