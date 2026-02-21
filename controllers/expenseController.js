const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
exports.addExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'No expense found' });
        }
        await expense.remove();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
