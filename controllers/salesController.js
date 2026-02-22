const Sales = require('../models/Sales');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

// @desc    Get all sales
// @route   GET /api/sales
exports.getSales = async (req, res, next) => {
    try {
        const { startDate, endDate, customer, paymentType, paymentStatus } = req.query;
        let query = { status: 'active' };

        if (startDate && endDate) {
            query.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (customer) query.customer = customer;
        if (paymentType) query.paymentType = paymentType;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const sales = await Sales.find(query)
            .populate('customer', 'name phone address gstNumber')
            .sort({ invoiceDate: -1 });

        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
exports.getSale = async (req, res, next) => {
    try {
        const sale = await Sales.findById(req.params.id)
            .populate('customer', 'name phone address gstNumber')
            .populate('items.stoneType', 'name unit');
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        const payments = await Payment.find({ sales: req.params.id }).sort({ paymentDate: -1 });

        res.status(200).json({ success: true, data: sale, payments });
    } catch (error) {
        next(error);
    }
};

// @desc    Add sale
// @route   POST /api/sales
exports.addSale = async (req, res, next) => {
    try {
        // Calculate item amounts
        if (req.body.items) {
            req.body.items = req.body.items.map(item => ({
                ...item,
                amount: item.quantity * item.rate
            }));
        }

        const sale = await Sales.create(req.body);
        const populatedSale = await Sales.findById(sale._id).populate('customer', 'name phone address gstNumber');
        res.status(201).json({ success: true, data: populatedSale });
    } catch (error) {
        next(error);
    }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
exports.updateSale = async (req, res, next) => {
    try {
        const sale = await Sales.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Calculate item amounts
        if (req.body.items) {
            req.body.items = req.body.items.map(item => ({
                ...item,
                amount: item.quantity * item.rate
            }));
        }

        Object.assign(sale, req.body);
        await sale.save();

        const updatedSale = await Sales.findById(sale._id).populate('customer', 'name phone address gstNumber');
        res.status(200).json({ success: true, data: updatedSale });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel sale
// @route   DELETE /api/sales/:id
exports.deleteSale = async (req, res, next) => {
    try {
        const sale = await Sales.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.status(200).json({ success: true, message: 'Sale cancelled' });
    } catch (error) {
        next(error);
    }
};

// @desc    Add payment to a sale
// @route   POST /api/sales/:id/payment
exports.addPayment = async (req, res, next) => {
    try {
        const sale = await Sales.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        const payment = await Payment.create({
            sales: req.params.id,
            customer: sale.customer,
            ...req.body
        });

        // Update sale payment status
        sale.amountPaid += payment.amount;
        sale.balanceAmount = sale.grandTotal - sale.amountPaid;

        if (sale.balanceAmount <= 0) {
            sale.paymentStatus = 'Paid';
            sale.balanceAmount = 0;
        } else {
            sale.paymentStatus = 'Partial';
        }

        await sale.save();

        res.status(201).json({
            success: true,
            data: payment,
            updatedSale: sale
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get pending payments report
// @route   GET /api/sales/pending-payments
exports.getPendingPayments = async (req, res, next) => {
    try {
        const pendingSales = await Sales.find({
            status: 'active',
            paymentStatus: { $in: ['Unpaid', 'Partial'] }
        })
            .populate('customer', 'name phone address creditLimit')
            .sort({ dueDate: 1 });

        // Group by customer
        const customerMap = {};
        pendingSales.forEach(sale => {
            const custId = sale.customer._id.toString();
            if (!customerMap[custId]) {
                customerMap[custId] = {
                    customer: sale.customer,
                    totalSales: 0,
                    totalPaid: 0,
                    totalBalance: 0,
                    invoices: []
                };
            }
            customerMap[custId].totalSales += sale.grandTotal;
            customerMap[custId].totalPaid += sale.amountPaid;
            customerMap[custId].totalBalance += sale.balanceAmount;
            customerMap[custId].invoices.push({
                _id: sale._id,
                invoiceNumber: sale.invoiceNumber,
                invoiceDate: sale.invoiceDate,
                grandTotal: sale.grandTotal,
                amountPaid: sale.amountPaid,
                balanceAmount: sale.balanceAmount,
                dueDate: sale.dueDate,
                paymentStatus: sale.paymentStatus
            });
        });

        const report = Object.values(customerMap);

        res.status(200).json({
            success: true,
            totalPending: report.reduce((sum, r) => sum + r.totalBalance, 0),
            count: report.length,
            data: report
        });
    } catch (error) {
        next(error);
    }
};
