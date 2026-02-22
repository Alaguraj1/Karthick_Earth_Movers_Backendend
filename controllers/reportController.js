const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const Sales = require('../models/Sales');
const Payment = require('../models/Payment');
const Income = require('../models/Income');
const VendorPayment = require('../models/VendorPayment');

// @desc    Get Day Book (Daily Income & Expense)
// @route   GET /api/reports/day-book
exports.getDayBook = async (req, res, next) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const query = {
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        const invoiceQuery = {
            invoiceDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'active'
        };
        const paymentQuery = {
            paymentDate: { $gte: startOfDay, $lte: endOfDay }
        };

        // Fetch all sources
        const [cashSales, payments, otherIncome, expenses, vendorPayments] = await Promise.all([
            Sales.find({ ...invoiceQuery, paymentType: 'Cash' }).populate('customer', 'name'),
            Payment.find(paymentQuery).populate('customer', 'name').populate('sales', 'invoiceNumber'),
            Income.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
            Expense.find({ ...query, paymentMode: { $ne: 'Credit' } }),
            VendorPayment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
        ]);

        const dayBook = [];

        // Map Cash Sales
        cashSales.forEach(s => {
            dayBook.push({
                time: s.createdAt,
                description: `Cash Sale - ${s.invoiceNumber} (${s.customer?.name || 'Walk-in'})`,
                income: s.grandTotal,
                expense: 0,
                paymentMode: 'Cash'
            });
        });

        // Map Customer Payments
        payments.forEach(p => {
            dayBook.push({
                time: p.paymentDate,
                description: `Payment Recv - ${p.customer?.name || 'Customer'} (Inv: ${p.sales?.invoiceNumber || 'N/A'})`,
                income: p.amount,
                expense: 0,
                paymentMode: p.paymentMode
            });
        });

        // Map Other Income
        otherIncome.forEach(i => {
            dayBook.push({
                time: i.date,
                description: `${i.source} - ${i.description || ''} (${i.customerName || 'N/A'})`,
                income: i.amount,
                expense: 0,
                paymentMode: 'Cash'
            });
        });

        // Map Expenses
        expenses.forEach(e => {
            dayBook.push({
                time: e.date,
                description: `${e.category} - ${e.description || e.vehicleOrMachine || ''}`,
                income: 0,
                expense: e.amount,
                paymentMode: e.paymentMode || 'Cash'
            });
        });

        // Map Vendor Payments
        vendorPayments.forEach(vp => {
            // Only count if there was an actual payment
            if (vp.paidAmount > 0) {
                dayBook.push({
                    time: vp.date,
                    description: `Vendor Payment - ${vp.vendorName || vp.vendorType} (Ref: ${vp.referenceNumber || 'N/A'})`,
                    income: 0,
                    expense: vp.paidAmount,
                    paymentMode: vp.paymentMode || 'Cash'
                });
            }
            // If there's an invoice amount but it's a credit purchase, we don't show it in Day Book (Cash flow basis)
            // Unless we want to show it as a non-cash entry. User wants "daily cash movement check".
        });

        // Sort by time
        dayBook.sort((a, b) => new Date(a.time) - new Date(b.time));

        res.status(200).json({
            success: true,
            date: startOfDay.toISOString().split('T')[0],
            data: dayBook,
            summary: {
                totalIncome: dayBook.reduce((acc, curr) => acc + curr.income, 0),
                totalExpense: dayBook.reduce((acc, curr) => acc + curr.expense, 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Cash Flow Report
// @route   GET /api/reports/cash-flow
exports.getCashFlow = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Calculate Opening Balance (Everything before start date)
        const [oldCashSales, oldPayments, oldOtherIncome, oldExpenses, oldVendorPayments] = await Promise.all([
            Sales.aggregate([{ $match: { invoiceDate: { $lt: start }, paymentType: 'Cash', status: 'active' } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
            Payment.aggregate([{ $match: { paymentDate: { $lt: start } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            Income.aggregate([{ $match: { date: { $lt: start } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            Expense.aggregate([{ $match: { date: { $lt: start }, paymentMode: { $ne: 'Credit' } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            VendorPayment.aggregate([{ $match: { date: { $lt: start } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }])
        ]);

        const openingIncome = (oldCashSales[0]?.total || 0) + (oldPayments[0]?.total || 0) + (oldOtherIncome[0]?.total || 0);
        const openingExpense = (oldExpenses[0]?.total || 0) + (oldVendorPayments[0]?.total || 0);
        const openingBalance = openingIncome - openingExpense;

        // Calculate Current Period
        const [periodCashSales, periodPayments, periodOtherIncome, periodExpenses, periodVendorPayments] = await Promise.all([
            Sales.aggregate([{ $match: { invoiceDate: { $gte: start, $lte: end }, paymentType: 'Cash', status: 'active' } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
            Payment.aggregate([{ $match: { paymentDate: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            Income.aggregate([{ $match: { date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            Expense.aggregate([{ $match: { date: { $gte: start, $lte: end }, paymentMode: { $ne: 'Credit' } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            VendorPayment.aggregate([{ $match: { date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }])
        ]);

        const totalReceived = (periodCashSales[0]?.total || 0) + (periodPayments[0]?.total || 0) + (periodOtherIncome[0]?.total || 0);
        const totalPaid = (periodExpenses[0]?.total || 0) + (periodVendorPayments[0]?.total || 0);
        const closingBalance = openingBalance + totalReceived - totalPaid;

        res.status(200).json({
            success: true,
            data: {
                openingBalance,
                totalReceived,
                totalPaid,
                closingBalance,
                period: { start, end }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Profit & Loss Report
// @route   GET /api/reports/profit-loss
exports.getProfitLoss = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Aggregate All Sales (Accrual Basis)
        const salesAgg = await Sales.aggregate([
            { $match: { invoiceDate: { $gte: start, $lte: end }, status: 'active' } },
            { $group: { _id: null, totalSales: { $sum: "$grandTotal" } } }
        ]);

        // Aggregate Other Income
        const otherIncomeAgg = await Income.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: "$source", total: { $sum: "$amount" } } }
        ]);

        // Aggregate All Expenses by Category
        const expenseAgg = await Expense.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } }
        ]);

        // Aggregate Vendor Invoices (Purchases)
        const vendorInvoiceAgg = await VendorPayment.aggregate([
            { $match: { date: { $gte: start, $lte: end }, invoiceAmount: { $gt: 0 } } },
            { $group: { _id: "$vendorType", total: { $sum: "$invoiceAmount" } } }
        ]);

        const totalIncome = (salesAgg[0]?.totalSales || 0) + otherIncomeAgg.reduce((acc, curr) => acc + curr.total, 0);

        // Merge Expense Categories and Vendor Purchases
        const combinedExpenses = [...expenseAgg];
        vendorInvoiceAgg.forEach(vi => {
            const existing = combinedExpenses.find(e => e._id === vi._id);
            if (existing) {
                existing.total += vi.total;
            } else {
                combinedExpenses.push(vi);
            }
        });

        const totalExpense = combinedExpenses.reduce((acc, curr) => acc + curr.total, 0);

        res.status(200).json({
            success: true,
            data: {
                income: {
                    sales: salesAgg[0]?.totalSales || 0,
                    other: otherIncomeAgg
                },
                expenses: combinedExpenses,
                totalIncome,
                totalExpense,
                netProfit: totalIncome - totalExpense
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Monthly/Yearly Summary Reports
// @route   GET /api/reports/summary
exports.getMonthlyYearlySummary = async (req, res, next) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();

        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

        // Monthly Sales
        const monthlySales = await Sales.aggregate([
            { $match: { invoiceDate: { $gte: startOfYear, $lte: endOfYear }, status: 'active' } },
            {
                $group: {
                    _id: { $month: "$invoiceDate" },
                    total: { $sum: "$grandTotal" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Monthly Expenses
        const monthlyExpenses = await Expense.aggregate([
            { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
            {
                $group: {
                    _id: { $month: "$date" },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            year: targetYear,
            data: {
                monthlySales,
                monthlyExpenses
            }
        });
    } catch (error) {
        next(error);
    }
};

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
