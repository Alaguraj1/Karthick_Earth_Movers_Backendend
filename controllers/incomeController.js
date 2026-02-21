const Income = require('../models/Income');

// @desc    Get all income
// @route   GET /api/income
exports.getIncome = async (req, res) => {
    try {
        const income = await Income.find().sort({ date: -1 });
        res.status(200).json({ success: true, count: income.length, data: income });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new income
// @route   POST /api/income
exports.addIncome = async (req, res) => {
    try {
        const income = await Income.create(req.body);
        res.status(201).json({ success: true, data: income });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
};
