const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');

// @desc    Get machine/vehicle wise cost report
// @route   GET /api/reports/vehicle-cost
// @access  Public
exports.getVehicleCostReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        console.log('Vehicle Cost Report Query:', JSON.stringify(query));

        // 1. Get all active vehicles/machines
        const allVehicles = await Vehicle.find({ status: { $ne: 'inactive' } });

        // 2. Get all expenses grouped by vehicleOrMachine
        const expenseAgg = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$vehicleOrMachine",
                    fuelCost: {
                        $sum: { $cond: [{ $eq: ["$category", "Diesel"] }, "$amount", 0] }
                    },
                    maintenanceCost: {
                        $sum: { $cond: [{ $eq: ["$category", "Machine Maintenance"] }, "$amount", 0] }
                    },
                    operatorWages: {
                        $sum: { $cond: [{ $eq: ["$category", "Labour Wages"] }, "$amount", 0] }
                    },
                    otherCosts: {
                        $sum: { $cond: [{ $nin: ["$category", ["Diesel", "Machine Maintenance", "Labour Wages"]] }, "$amount", 0] }
                    },
                    totalCost: { $sum: "$amount" }
                }
            }
        ]);

        // 3. Merge aggregated data with all vehicles
        const report = allVehicles.map(v => {
            const plateNum = v.vehicleNumber || v.registrationNumber;
            const displayName = v.category ? `${v.category} (${plateNum})` : (plateNum ? `${v.name} (${plateNum})` : v.name);

            // Find matching expense record
            // We search for matches that start with the category/name or match the plate number
            const expenseData = expenseAgg.find(e =>
                e._id === displayName ||
                e._id === v.name ||
                (plateNum && e._id.includes(plateNum))
            ) || {
                fuelCost: 0,
                maintenanceCost: 0,
                operatorWages: 0,
                otherCosts: 0,
                totalCost: 0
            };

            return {
                _id: displayName,
                ...expenseData,
                vehicleType: v.type,
                vehicleCategory: v.category
            };
        });

        // Add any expense records that don't match a master vehicle (e.g. external transport)
        const matchedVehicleNames = report.map(r => r._id);
        const unmatchedExpenses = expenseAgg.filter(e => e._id && !matchedVehicleNames.some(name => name === e._id || (e._id.includes && e._id.includes(e._id))));

        // Actually simpler logic for unmatched:
        expenseAgg.forEach(e => {
            if (e._id && !report.some(r => r._id === e._id)) {
                report.push({
                    ...e,
                    vehicleType: 'Other',
                    vehicleCategory: 'External/Old'
                });
            }
        });

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detailed maintenance history
// @route   GET /api/reports/maintenance-history
// @access  Public
exports.getMaintenanceHistory = async (req, res, next) => {
    try {
        const { vehicleOrMachine } = req.query;
        let query = { category: 'Machine Maintenance' };
        if (vehicleOrMachine) {
            query.vehicleOrMachine = vehicleOrMachine;
        }

        const history = await Expense.find(query).sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detailed fuel tracking
// @route   GET /api/reports/fuel-tracking
// @access  Public
exports.getFuelTracking = async (req, res, next) => {
    try {
        const { vehicleOrMachine } = req.query;
        let query = { category: 'Diesel' };
        if (vehicleOrMachine) {
            query.vehicleOrMachine = vehicleOrMachine;
        }

        const fuelRecords = await Expense.find(query).sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: fuelRecords
        });
    } catch (error) {
        next(error);
    }
};
