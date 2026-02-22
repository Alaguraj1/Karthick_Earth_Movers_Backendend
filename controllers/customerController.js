const Customer = require('../models/Customer');
const Sales = require('../models/Sales');

// @desc    Get all customers
// @route   GET /api/customers
exports.getCustomers = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { gstNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
exports.getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        // Get customer's sales summary
        const sales = await Sales.find({ customer: req.params.id, status: 'active' });
        const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
        const totalPaid = sales.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalBalance = sales.reduce((sum, s) => sum + s.balanceAmount, 0);

        res.status(200).json({
            success: true,
            data: customer,
            summary: { totalSales, totalPaid, totalBalance, totalInvoices: sales.length }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add customer
// @route   POST /api/customers
exports.addCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        next(error);
    }
};
