const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeSource = require('../models/IncomeSource');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');

// @desc    Get all master data
// @route   GET /api/master/:type
// @access  Public
exports.getMasterData = async (req, res, next) => {
    try {
        const { type } = req.params;
        let data;

        switch (type) {
            case 'expense-categories':
                data = await ExpenseCategory.find({ status: 'active' }).sort('name');
                break;
            case 'income-sources':
                data = await IncomeSource.find({ status: 'active' }).sort('name');
                break;
            case 'vehicles':
                data = await Vehicle.find({ status: 'active' }).sort('name');
                break;
            case 'customers':
                data = await Customer.find({ status: 'active' }).sort('name');
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid master data type' });
        }

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Add master data
// @route   POST /api/master/:type
// @access  Public
exports.addMasterData = async (req, res, next) => {
    try {
        const { type } = req.params;
        let data;

        switch (type) {
            case 'expense-categories':
                data = await ExpenseCategory.create(req.body);
                break;
            case 'income-sources':
                data = await IncomeSource.create(req.body);
                break;
            case 'vehicles':
                data = await Vehicle.create(req.body);
                break;
            case 'customers':
                data = await Customer.create(req.body);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid master data type' });
        }

        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
