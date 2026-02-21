const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');

// @desc    Get all labours
// @route   GET /api/labour
exports.getLabours = async (req, res) => {
    try {
        const labours = await Labour.find().sort({ name: 1 });
        res.status(200).json({ success: true, data: labours });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create labour
// @route   POST /api/labour
exports.createLabour = async (req, res) => {
    try {
        const labour = await Labour.create(req.body);
        res.status(201).json({ success: true, data: labour });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update labour
// @route   PUT /api/labour/:id
exports.updateLabour = async (req, res) => {
    try {
        const labour = await Labour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!labour) return res.status(404).json({ success: false, error: 'Labour not found' });
        res.status(200).json({ success: true, data: labour });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete labour
// @route   DELETE /api/labour/:id
exports.deleteLabour = async (req, res) => {
    try {
        const labour = await Labour.findByIdAndDelete(req.params.id);
        if (!labour) return res.status(404).json({ success: false, error: 'Labour not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get attendance by date
// @route   GET /api/labour/attendance?date=YYYY-MM-DD
exports.getAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            date: { $gte: start, $lte: end }
        }).populate('labour', 'name');

        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark attendance (bulk or single)
// @route   POST /api/labour/attendance
exports.markAttendance = async (req, res) => {
    try {
        const { date, attendanceData } = req.body; // attendanceData: [{labour, status, overtimeHours}]

        const operations = attendanceData.map(item => ({
            updateOne: {
                filter: { labour: item.labour, date: new Date(date).setHours(0, 0, 0, 0) },
                update: { ...item, date: new Date(date).setHours(0, 0, 0, 0) },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(operations);
        res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get advances
// @route   GET /api/labour/advance
exports.getAdvances = async (req, res) => {
    try {
        const { labourId } = req.query;
        const query = labourId ? { labour: labourId } : {};
        const advances = await Advance.find(query).populate('labour', 'name').sort({ date: -1 });
        res.status(200).json({ success: true, data: advances });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Add advance
// @route   POST /api/labour/advance
exports.addAdvance = async (req, res) => {
    try {
        const advance = await Advance.create(req.body);
        res.status(201).json({ success: true, data: advance });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Wages summary calculation
// @route   GET /api/labour/wages-summary?month=MM&year=YYYY
exports.getWagesSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const labours = await Labour.find({ status: 'active' });
        const summaries = await Promise.all(labours.map(async (labour) => {
            const attendance = await Attendance.find({
                labour: labour._id,
                date: { $gte: start, $lte: end }
            });

            const advances = await Advance.find({
                labour: labour._id,
                date: { $gte: start, $lte: end }
            });

            const presentDays = attendance.filter(a => a.status === 'Present').length;
            const halfDays = attendance.filter(a => a.status === 'Half Day').length;
            const totalWorkDays = presentDays + (halfDays * 0.5);

            const daysInMonth = end.getDate();
            const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

            let totalWages = 0;
            if (labour.wageType === 'Monthly') {
                // Pro-rate monthly salary based on days in the month
                const dailyRate = (labour.wage || 0) / daysInMonth;
                totalWages = totalWorkDays * dailyRate;
            } else {
                // Simple daily wage calculation
                totalWages = totalWorkDays * (labour.wage || 0);
            }

            const netPayable = totalWages - totalAdvance;

            const dailyRate = labour.wageType === 'Monthly' ? ((labour.wage || 0) / daysInMonth) : (labour.wage || 0);

            return {
                labourId: labour._id,
                name: labour.name,
                workType: labour.workType,
                wageType: labour.wageType,
                dailyWage: labour.wage,
                dailyRate: dailyRate.toFixed(2),
                attendance: { present: presentDays, half: halfDays, total: totalWorkDays },
                totalWages: totalWages.toFixed(2),
                totalAdvance,
                netPayable: netPayable.toFixed(2)
            };
        }));

        res.status(200).json({ success: true, data: summaries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Detailed Labour report
// @route   GET /api/labour/report/:id
exports.getLabourReport = async (req, res) => {
    try {
        const labour = await Labour.findById(req.params.id);
        const attendance = await Attendance.find({ labour: req.params.id }).sort({ date: -1 });
        const advances = await Advance.find({ labour: req.params.id }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: {
                labour,
                attendance,
                advances
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
