const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');

// @desc    Get all labours
// @route   GET /api/labour
exports.getLabours = async (req, res) => {
    try {
        const labours = await Labour.find().populate('contractor', 'name companyName').sort({ name: 1 });
        res.status(200).json({ success: true, data: labours });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create labour
// @route   POST /api/labour
exports.createLabour = async (req, res) => {
    try {
        // Remove empty ObjectId fields to prevent cast errors
        if (!req.body.contractor || req.body.contractor === '') {
            delete req.body.contractor;
        }
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
        // Remove empty ObjectId fields to prevent cast errors
        if (!req.body.contractor || req.body.contractor === '') {
            delete req.body.contractor;
            // Also unset contractor in the DB if it was cleared
            req.body.$unset = { contractor: 1 };
        }
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
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const start = new Date(normalizedDate);
        const end = new Date(normalizedDate);
        end.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            date: { $gte: start, $lte: end }
        }).populate('labour', 'name');

        // Logic for "Once paid, the whole month is locked"
        // Find which labours have ANY paid attendance in this month
        const startOfMonth = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1);
        const endOfMonth = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const paidRecordsInMonth = await Attendance.find({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            isPaid: true
        });

        const monthPaidLabours = [...new Set(paidRecordsInMonth.map(a => a.labour.toString()))];

        res.status(200).json({ success: true, data: attendance, monthPaidLabours });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark attendance (bulk or single)
// @route   POST /api/labour/attendance
exports.markAttendance = async (req, res) => {
    try {
        const { date, attendanceData } = req.body;
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Fetch labourers to check joining dates
        const labourIds = attendanceData.map(d => d.labour);
        const labours = await Labour.find({ _id: { $in: labourIds } });

        const validAttendanceData = attendanceData.filter(item => {
            const labour = labours.find(l => l._id.toString() === item.labour.toString());
            if (!labour || !labour.joiningDate) return true;

            const joinDate = new Date(labour.joiningDate);
            joinDate.setHours(0, 0, 0, 0);
            return normalizedDate >= joinDate;
        });

        if (validAttendanceData.length === 0) {
            return res.status(200).json({ success: true, message: 'No valid attendance records to save (check joining dates)' });
        }

        // Calculate the start and end of the month for the requested date
        const startOfMonth = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1);
        const endOfMonth = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 0, 23, 59, 59, 999);

        // Find which labours are already paid for THIS month
        const paidAttendanceInMonth = await Attendance.find({
            labour: { $in: labourIds },
            date: { $gte: startOfMonth, $lte: endOfMonth },
            isPaid: true
        });

        const lockedLabourIds = [...new Set(paidAttendanceInMonth.map(a => a.labour.toString()))];

        // Filter out attendance for locked labours
        const finalToSave = validAttendanceData.filter(item => !lockedLabourIds.includes(item.labour.toString()));
        const skippedCount = validAttendanceData.length - finalToSave.length;

        if (finalToSave.length === 0 && skippedCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'All selected workers have already been paid for this month and cannot be modified.'
            });
        }

        const operations = finalToSave.map(item => ({
            updateOne: {
                filter: { labour: item.labour, date: normalizedDate, isPaid: false },
                update: { ...item, date: normalizedDate },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        res.status(200).json({
            success: true,
            message: skippedCount > 0
                ? `Attendance saved. ${skippedCount} items skipped because month is already closed/paid.`
                : `Attendance marked successfully`
        });
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

// @desc    Update advance
// @route   PUT /api/labour/advance/:id
exports.updateAdvance = async (req, res) => {
    try {
        const advance = await Advance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!advance) return res.status(404).json({ success: false, error: 'Advance record not found' });
        res.status(200).json({ success: true, data: advance });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete advance
// @route   DELETE /api/labour/advance/:id
exports.deleteAdvance = async (req, res) => {
    try {
        const advance = await Advance.findByIdAndDelete(req.params.id);
        if (!advance) return res.status(404).json({ success: false, error: 'Advance record not found' });
        res.status(200).json({ success: true, data: {} });
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

        const labours = await Labour.find({ status: 'active' }).populate('contractor', 'name companyName');
        const directSummaries = [];
        const vendorSummariesMap = {};

        await Promise.all(labours.map(async (labour) => {
            // Find ALL attendance for this period (both paid and unpaid)
            const allAttendance = await Attendance.find({
                labour: labour._id,
                date: { $gte: start, $lte: end }
            });

            // Filter for unpaid for wage calculation
            const unpaidAttendance = allAttendance.filter(a => !a.isPaid);

            const advances = await Advance.find({
                labour: labour._id,
                date: { $gte: start, $lte: end }
            });

            const presentDays = unpaidAttendance.filter(a => a.status === 'Present').length;
            const halfDays = unpaidAttendance.filter(a => a.status === 'Half Day').length;
            const totalWorkDays = presentDays + (halfDays * 0.5);
            const totalOTHours = unpaidAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

            // Total stats including paid ones for transparency
            const totalPresent = allAttendance.filter(a => a.status === 'Present').length;
            const totalHalf = allAttendance.filter(a => a.status === 'Half Day').length;
            const totalDaysAll = totalPresent + (totalHalf * 0.5);

            const daysInMonth = end.getDate();
            const monthlyDenominator = req.query.workingDays ? parseFloat(req.query.workingDays) : daysInMonth;
            const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

            let totalWages = 0;
            const dailyRate = labour.wageType === 'Monthly' ? ((labour.wage || 0) / (monthlyDenominator || 30)) : (labour.wage || 0);

            if (labour.wageType === 'Monthly') {
                totalWages = totalWorkDays * dailyRate;
            } else {
                totalWages = totalWorkDays * (labour.wage || 0);
            }

            // OT Calculation: Hourly Rate = Daily Wage / 8
            const hourlyRate = dailyRate / 8;
            const otAmount = totalOTHours * hourlyRate;

            const netPayable = (totalWages + otAmount) - totalAdvance;

            const summaryObj = {
                labourId: labour._id,
                name: labour.name,
                workType: labour.workType,
                wageType: labour.wageType,
                dailyWage: labour.wage,
                dailyRate: dailyRate.toFixed(2),
                attendance: {
                    present: presentDays,
                    half: halfDays,
                    total: totalWorkDays,
                    otHours: totalOTHours,
                    totalPresentAll: totalPresent,
                    totalHalfAll: totalHalf,
                    totalDaysAll: totalDaysAll
                },
                totalWages: totalWages.toFixed(2),
                otAmount: otAmount.toFixed(2),
                totalAdvance,
                netPayable: netPayable.toFixed(2)
            };

            if (labour.labourType === 'Vendor' && labour.contractor) {
                const cId = labour.contractor._id.toString();
                if (!vendorSummariesMap[cId]) {
                    vendorSummariesMap[cId] = {
                        isVendorGroup: true,
                        contractorId: cId,
                        contractorName: labour.contractor.name,
                        companyName: labour.contractor.companyName,
                        attendance: { present: 0, half: 0, total: 0, otHours: 0 },
                        totalWages: 0,
                        otAmount: 0,
                        totalAdvance: 0,
                        netPayable: 0,
                        labourCount: 0,
                        workers: []
                    };
                }

                vendorSummariesMap[cId].attendance.present += presentDays;
                vendorSummariesMap[cId].attendance.half += halfDays;
                vendorSummariesMap[cId].attendance.total += totalWorkDays;
                vendorSummariesMap[cId].attendance.otHours += totalOTHours;
                vendorSummariesMap[cId].totalWages += totalWages;
                vendorSummariesMap[cId].otAmount += otAmount;
                vendorSummariesMap[cId].totalAdvance += totalAdvance;
                vendorSummariesMap[cId].netPayable += netPayable;
                vendorSummariesMap[cId].labourCount += 1;
                vendorSummariesMap[cId].workers.push(summaryObj);
            } else {
                directSummaries.push(summaryObj);
            }
        }));

        const vendorSummaries = Object.values(vendorSummariesMap).map((v) => ({
            ...v,
            totalWages: v.totalWages.toFixed(2),
            otAmount: v.otAmount.toFixed(2),
            netPayable: v.netPayable.toFixed(2)
        }));

        const finalSummaries = [...directSummaries, ...vendorSummaries];

        res.status(200).json({ success: true, data: finalSummaries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Detailed Labour report
// @route   GET /api/labour/report/:id?month=MM&year=YYYY
exports.getLabourReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const labour = await Labour.findById(req.params.id);
        
        let attendanceQuery = { labour: req.params.id };
        let advancesQuery = { labour: req.params.id };

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59, 999);
            attendanceQuery.date = { $gte: start, $lte: end };
            advancesQuery.date = { $gte: start, $lte: end };
        }

        const attendance = await Attendance.find(attendanceQuery).sort({ date: -1 });
        const advances = await Advance.find(advancesQuery).sort({ date: -1 });

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

// @desc    Mark wages paid
// @route   POST /api/labour/mark-wages-paid
exports.markWagesPaid = async (req, res) => {
    try {
        const { month, year, labourId, contractorId } = req.body;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        let filter = { date: { $gte: start, $lte: end }, isPaid: false };
        if (labourId) {
            filter.labour = labourId;
            await Attendance.updateMany(filter, { $set: { isPaid: true } });
        } else if (contractorId) {
            const labours = await Labour.find({ contractor: contractorId, labourType: 'Vendor' });
            const ids = labours.map(l => l._id);
            filter.labour = { $in: ids };
            await Attendance.updateMany(filter, { $set: { isPaid: true } });
        } else {
            return res.status(400).json({ success: false, error: 'Must provide labourId or contractorId' });
        }

        res.status(200).json({ success: true, message: 'Wages marked as paid' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
