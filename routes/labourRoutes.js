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
    getLabourReport,
    markWagesPaid,
    updateAdvance,
    deleteAdvance
} = require('../controllers/labourController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');

router.use(protect); // All labour routes protected

// Labour Profile Routes
router.route('/').get(getLabours).post(checkEditWindow(Labour), createLabour);
router.route('/:id')
    .put(checkEditWindow(Labour), updateLabour)
    .delete(authorize('Owner'), checkEditWindow(Labour), deleteLabour);

// Attendance Routes
router.route('/attendance')
    .get(getAttendance)
    .post(checkEditWindow(Attendance), markAttendance);

// Advance Payment Routes
router.route('/advance')
    .get(getAdvances)
    .post(checkEditWindow(Advance), addAdvance);

router.route('/advance/:id')
    .put(checkEditWindow(Advance), updateAdvance)
    .delete(authorize('Owner'), checkEditWindow(Advance), deleteAdvance);

// Wages & Report
router.route('/wages-summary').get(getWagesSummary);
router.route('/mark-wages-paid').post(markWagesPaid);
router.route('/report/:id').get(getLabourReport);

module.exports = router;
