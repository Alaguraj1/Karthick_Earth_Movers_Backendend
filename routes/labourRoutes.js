const express = require('express');
const router = express.Router();
const {
    getLabours,
    createLabour,
    updateLabour,
    deleteLabour,
    getAttendance,
    markAttendance,
    getAdvances,
    addAdvance,
    getWagesSummary,
    getLabourReport
} = require('../controllers/labourController');

// Labour Profile Routes
router.route('/').get(getLabours).post(createLabour);
router.route('/:id').put(updateLabour).delete(deleteLabour);

// Attendance Routes
router.route('/attendance').get(getAttendance).post(markAttendance);

// Advance Payment Routes
router.route('/advance').get(getAdvances).post(addAdvance);

// Wages & Report
router.route('/wages-summary').get(getWagesSummary);
router.route('/report/:id').get(getLabourReport);

module.exports = router;
