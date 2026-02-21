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
        // Aggregate production by stone type
        const productionData = await Production.aggregate([
            { $unwind: "$productionDetails" },
            {
                $group: {
                    _id: "$productionDetails.stoneType",
                    totalProduced: { $sum: "$productionDetails.quantity" },
                    totalDispatched: { $sum: "$productionDetails.dispatchedQuantity" }
                }
            }
        ]);

        const stoneTypes = await StoneType.find({ status: 'active' });

        const report = stoneTypes.map(st => {
            const prod = productionData.find(p => p._id.toString() === st._id.toString());
            const produced = prod ? prod.totalProduced : 0;
            const dispatched = prod ? prod.totalDispatched : 0;
            return {
                _id: st._id,
                name: st.name,
                produced,
                dispatched,
                balance: produced - dispatched,
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
