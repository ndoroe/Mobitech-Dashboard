const logger = require("../utils/logger");
const { promisePool } = require("../config/database");

/**
 * Get all system settings
 * GET /api/settings
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const [settings] = await promisePool.query(
      "SELECT setting_key, setting_value, description, updated_at FROM system_settings ORDER BY setting_key",
    );

    // Transform array to key-value object for convenience
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = {
        value: s.setting_value,
        description: s.description,
        updated_at: s.updated_at,
      };
    });

    res.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    logger.error("Error fetching system settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system settings",
      error: error.message,
    });
  }
};

/**
 * Update a system setting (admin only)
 * PUT /api/settings/:key
 */
exports.updateSystemSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null || value === "") {
      return res.status(400).json({
        success: false,
        message: "Setting value is required.",
      });
    }

    // Validate specific settings
    if (key === "billed_mb_per_sim") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Billed MB per SIM must be a positive number.",
        });
      }
    }

    // Check if setting exists
    const [existing] = await promisePool.query(
      "SELECT id FROM system_settings WHERE setting_key = ?",
      [key],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found.`,
      });
    }

    // Update the setting
    await promisePool.query(
      "UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?",
      [String(value), req.user.id, key],
    );

    // Fetch updated setting
    const [updated] = await promisePool.query(
      "SELECT setting_key, setting_value, description, updated_at FROM system_settings WHERE setting_key = ?",
      [key],
    );

    res.json({
      success: true,
      message: `Setting '${key}' updated successfully.`,
      data: {
        key: updated[0].setting_key,
        value: updated[0].setting_value,
        description: updated[0].description,
        updated_at: updated[0].updated_at,
      },
    });
  } catch (error) {
    logger.error("Error updating system setting:", error);
    res.status(500).json({
      success: false,
      message: "Error updating system setting",
      error: error.message,
    });
  }
};
