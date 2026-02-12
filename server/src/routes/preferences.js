const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');

// Get user preferences
router.get('/', preferencesController.getPreferences);

// Update user preferences
router.put('/', preferencesController.updatePreferences);

// Reset preferences to defaults
router.post('/reset', preferencesController.resetPreferences);

module.exports = router;
