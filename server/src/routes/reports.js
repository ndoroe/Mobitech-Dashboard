const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/custom', reportController.generateCustomReport);
router.post('/dynamic', reportController.generateDynamicReport);
router.get('/alerts', reportController.getAlerts);
router.get('/monthly-usage', reportController.getMonthlyUsage);
router.get('/metadata', reportController.getReportMetadata);

module.exports = router;
