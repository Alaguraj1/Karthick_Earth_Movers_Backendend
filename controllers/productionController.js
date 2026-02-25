const Production = require('../models/Production');
const StoneType = require('../models/StoneType');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');

// @desc    Get all production entries
// @route   GET /api/production
exports.getProductions = async (req, res, next) => {
    try {
        const { startDate, endDate, stoneType, machine } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (stoneType) query.stoneType = stoneType;
        if (machine) query.machine = machine;

        const productions = await Production.find(query)
            .populate('productionDetails.stoneType', 'name')
            .populate('machines.machineId', 'name registrationNumber category')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: productions.length,
            data: productions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add production entry
// @route   POST /api/production
exports.addProduction = async (req, res, next) => {
    try {
        const production = await Production.create(req.body);

        // Update Stock in StoneType
        if (req.body.productionDetails) {
            for (const item of req.body.productionDetails) {
                const netChange = (parseFloat(item.quantity) || 0) - (parseFloat(item.dispatchedQuantity) || 0);
                await StoneType.findByIdAndUpdate(item.stoneType, {
                    $inc: { currentStock: netChange }
                });
            }
        }

        // Create Expense for Labour Wages (if shiftWage is provided)
        if (req.body.shiftWage && req.body.shiftWage > 0) {
            // Collect all worker names
            const allNames = [];
            if (req.body.labourDetails) {
                allNames.push(...req.body.labourDetails.filter((l) => l.name).map((l) => l.name));
            }
            if (req.body.operatorDetails) {
                allNames.push(...req.body.operatorDetails.filter((o) => o.name).map((o) => o.name));
            }
            await Expense.create({
                category: 'Labour Wages',
                amount: req.body.shiftWage,
                date: req.body.date || new Date(),
                labourName: allNames.length > 0 ? allNames.join(', ') : 'Production Workers',
                siteAssigned: req.body.siteName,
                paymentMode: 'Cash',
                sourceModel: 'Production',
                sourceId: production._id,
                referenceId: `Production Shift: ${req.body.shift}`
            });
        }

        // Create Expense for Diesel Consumption (if provided in machines)
        if (req.body.machines) {
            for (const machineItem of req.body.machines) {
                if (machineItem.dieselUsed && machineItem.dieselUsed > 0) {
                    const vehicle = await Vehicle.findById(machineItem.machineId);
                    await Expense.create({
                        category: 'Diesel',
                        amount: 0, // Amount to be updated by accounts later
                        quantity: machineItem.dieselUsed,
                        date: req.body.date || new Date(),
                        description: `Diesel consumption recorded via Production entry`,
                        vehicleOrMachine: vehicle ? vehicle.name : 'Unknown',
                        paymentMode: 'Credit',
                        sourceModel: 'Production',
                        sourceId: production._id,
                        referenceId: `Production Machine: ${vehicle ? vehicle.name : 'Unknown'}`
                    });
                }

                // Update Machine HMR
                if (machineItem.workingHours && machineItem.workingHours > 0) {
                    await Vehicle.findByIdAndUpdate(machineItem.machineId, {
                        $inc: { currentHmr: machineItem.workingHours }
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            data: production
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update production entry
// @route   PUT /api/production/:id
exports.updateProduction = async (req, res, next) => {
    try {
        const production = await Production.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!production) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: production });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete production entry
// @route   DELETE /api/production/:id
exports.deleteProduction = async (req, res, next) => {
    try {
        const production = await Production.findByIdAndDelete(req.params.id);
        if (!production) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Stock Analysis
// @route   GET /api/production/stock-report
exports.getStockReport = async (req, res, next) => {
    try {
        const Sales = require('../models/Sales');

        // 1. Aggregate total production by stone type
        const productionStats = await Production.aggregate([
            { $unwind: "$productionDetails" },
            {
                $group: {
                    _id: "$productionDetails.stoneType",
                    totalProduced: { $sum: "$productionDetails.quantity" }
                }
            }
        ]);

        // 2. Aggregate total sales by stone type
        const salesStats = await Sales.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.stoneType",
                    totalSold: { $sum: "$items.quantity" }
                }
            }
        ]);

        const stoneTypes = await StoneType.find({ status: 'active' });

        const report = stoneTypes.map(st => {
            const pStats = productionStats.find(p => p._id.toString() === st._id.toString());
            const sStats = salesStats.find(s => s._id.toString() === st._id.toString());

            const produced = pStats ? pStats.totalProduced : 0;
            const sold = sStats ? sStats.totalSold : 0;
            const balance = (st.openingStock || 0) + produced - sold;

            return {
                _id: st._id,
                name: st.name,
                produced,
                dispatched: sold,
                balance: balance,
                unit: st.unit,
                defaultPrice: st.defaultPrice
            };
        });

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};
