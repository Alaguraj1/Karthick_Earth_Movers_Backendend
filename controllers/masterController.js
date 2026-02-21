const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeSource = require('../models/IncomeSource');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Labour = require('../models/Labour');
const StoneType = require('../models/StoneType');


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
            case 'labours':
                data = await Labour.find({ status: 'active' }).sort('name');
                break;
            case 'stone-types':
                data = await StoneType.find({ status: 'active' }).sort('name');
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
            case 'labours':
                data = await Labour.create(req.body);
                break;
            case 'stone-types':
                data = await StoneType.create(req.body);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid master data type' });
        }

        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
// @desc    Update master data
// @route   PUT /api/master/:type/:id
// @access  Public
exports.updateMasterData = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        let Model;

        switch (type) {
            case 'expense-categories': Model = ExpenseCategory; break;
            case 'income-sources': Model = IncomeSource; break;
            case 'vehicles': Model = Vehicle; break;
            case 'customers': Model = Customer; break;
            case 'labours': Model = Labour; break;
            case 'stone-types': Model = StoneType; break;
            default: return res.status(400).json({ success: false, message: 'Invalid master data type' });
        }

        const data = await Model.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete master data (soft delete)
// @route   DELETE /api/master/:type/:id
// @access  Public
exports.deleteMasterData = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        let Model;

        switch (type) {
            case 'expense-categories': Model = ExpenseCategory; break;
            case 'income-sources': Model = IncomeSource; break;
            case 'vehicles': Model = Vehicle; break;
            case 'customers': Model = Customer; break;
            case 'labours': Model = Labour; break;
            case 'stone-types': Model = StoneType; break;
            default: return res.status(400).json({ success: false, message: 'Invalid master data type' });
        }

        await Model.findByIdAndUpdate(id, { status: 'inactive' });
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        next(error);
    }
};
