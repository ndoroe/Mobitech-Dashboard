const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { requireRole } = require("../middleware/auth");

// GET /api/settings — any authenticated user can read
router.get("/", settingsController.getSystemSettings);

// PUT /api/settings/:key — admin only
router.put(
  "/:key",
  requireRole("admin"),
  settingsController.updateSystemSetting,
);

module.exports = router;
