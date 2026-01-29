const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/top-consumers', dashboardController.getTopConsumers);
router.get('/monthly-comparison', dashboardController.getMonthlyComparison);

module.exports = router;
