const express = require('express');
const router = express.Router();
const {
    getVehicleCostReport,
    getMaintenanceHistory,
    getFuelTracking
} = require('../controllers/reportController');

router.get('/vehicle-cost', getVehicleCostReport);
router.get('/maintenance-history', getMaintenanceHistory);
router.get('/fuel-tracking', getFuelTracking);

module.exports = router;
