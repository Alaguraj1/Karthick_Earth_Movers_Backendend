const express = require('express');
const router = express.Router();
const {
    getVehicleCostReport,
    getMaintenanceHistory,
    getFuelTracking,
    getDayBook,
    getCashFlow,
    getProfitLoss,
    getMonthlyYearlySummary
} = require('../controllers/reportController');

router.get('/vehicle-cost', getVehicleCostReport);
router.get('/maintenance-history', getMaintenanceHistory);
router.get('/fuel-tracking', getFuelTracking);
router.get('/day-book', getDayBook);
router.get('/cash-flow', getCashFlow);
router.get('/profit-loss', getProfitLoss);
router.get('/summary', getMonthlyYearlySummary);

module.exports = router;
