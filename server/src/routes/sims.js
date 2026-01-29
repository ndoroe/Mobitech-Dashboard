const express = require('express');
const router = express.Router();
const simController = require('../controllers/simController');

router.get('/', simController.getAllSims);
router.get('/:iccid/history', simController.getSimHistory);

module.exports = router;
