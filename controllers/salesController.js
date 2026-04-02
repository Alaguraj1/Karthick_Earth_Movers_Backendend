const Sales = require('../models/Sales');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const StoneType = require('../models/StoneType');
const Income = require('../models/Income');
const Trip = require('../models/Trip');

// @desc    Get all sales
// @route   GET /api/sales
exports.getSales = async (req, res, next) => {
    try {
        const { startDate, endDate, customer, paymentType, paymentStatus, receiptNumber } = req.query;
        let query = { status: 'active' };

        if (startDate && endDate) {
            query.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (customer) query.customer = customer;
        if (paymentType) query.paymentType = paymentType;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (receiptNumber) query.receiptNumber = { $regex: receiptNumber, $options: 'i' };

        const sales = await Sales.find(query)
            .populate('customer', 'name phone address gstNumber')
            .populate('vehicleId', 'vehicleNumber name registrationNumber')
            .populate('driverId', 'name')
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
            .populate('items.stoneType', 'name unit')
            .populate('vehicleId', 'vehicleNumber name registrationNumber')
            .populate('driverId', 'name');
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        const payments = await Payment.find({ sales: req.params.id }).sort({ paymentDate: -1 });
        const trips = await Trip.find({ saleId: req.params.id })
            .populate('vehicleId', 'vehicleNumber name category')
            .populate('driverId', 'name')
            .populate('stoneTypeId', 'name')
            .sort({ date: -1 });

        res.status(200).json({ success: true, data: sale, payments, trips });
    } catch (error) {
        next(error);
    }
};

// @desc    Add sale
// @route   POST /api/sales
exports.addSale = async (req, res, next) => {
    try {
        // 0. Clean up empty ObjectId strings
        if (!req.body.vehicleId || req.body.vehicleId === '') delete req.body.vehicleId;
        if (!req.body.driverId || req.body.driverId === '') delete req.body.driverId;
        if (req.body.items) {
            req.body.items.forEach(item => {
                if (!item.stoneType || item.stoneType === '') delete item.stoneType;
                item.amount = item.quantity * item.rate;
            });
        }

        // 1. Calculate item amounts

        // 2. Check Credit Limit for Credit Sales
        const customer = await Customer.findById(req.body.customer);
        if (req.body.paymentType === 'Credit' && customer && customer.creditLimit > 0) {
            const pendingSales = await Sales.find({
                customer: req.body.customer,
                paymentStatus: { $ne: 'Paid' },
                status: 'active'
            });
            const currentDebt = pendingSales.reduce((sum, s) => sum + s.balanceAmount, 0);
            const estimatedGrandTotal = (req.body.items || []).reduce((sum, item) => {
                const amt = (item.quantity || 0) * (item.rate || 0);
                const tax = (amt * (item.gstPercentage || 0)) / 100;
                return sum + amt + tax;
            }, 0);

            if (currentDebt + estimatedGrandTotal > customer.creditLimit) {
                return res.status(400).json({
                    success: false,
                    message: `Credit limit exceeded. Limit: ${customer.creditLimit}, Current Debt: ${currentDebt.toFixed(2)}`
                });
            }
        }

        const sale = await Sales.create(req.body);

        // 4. Record Income if Paid/Cash
        if (sale.amountPaid > 0) {
            await Income.create({
                source: 'Stone Sales',
                amount: sale.amountPaid,
                date: sale.invoiceDate,
                customerName: customer ? customer.name : 'Unknown',
                description: `Invoice: ${sale.invoiceNumber}`
            });
        }

        // 5. AUTO-CREATE TRIP if Vehicle is selected
        if (req.body.vehicleId) {
            const totalQty = (req.body.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            const firstItem = req.body.items && req.body.items.length > 0 ? req.body.items[0] : null;

            await Trip.create({
                date: sale.invoiceDate,
                vehicleId: req.body.vehicleId,
                driverId: req.body.driverId,
                driverName: req.body.driverName,
                customerId: req.body.customer,
                stoneTypeId: firstItem ? firstItem.stoneType : null,
                saleId: sale._id,
                fromLocation: req.body.fromLocation || 'Quarry',
                toLocation: req.body.toLocation || 'Site',
                loadQuantity: totalQty,
                loadUnit: firstItem ? firstItem.unit : 'Tons',
                tripRate: sale.grandTotal, // Income from this delivery
                isConvertedToSale: true,
                status: 'Completed',
                notes: `Auto-generated from Invoice: ${sale.invoiceNumber}`
            });
        }

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

        // Clean up empty ObjectId strings
        if (!req.body.vehicleId || req.body.vehicleId === '') req.body.vehicleId = null;
        if (!req.body.driverId || req.body.driverId === '') req.body.driverId = null;
        if (req.body.items) {
            req.body.items = req.body.items.map(item => ({
                ...item,
                stoneType: (item.stoneType === '' || !item.stoneType) ? null : item.stoneType,
                amount: item.quantity * item.rate
            }));
        }

        Object.assign(sale, req.body);
        await sale.save();

        // Sync with Trip
        if (sale.vehicleId) {
            const totalQty = (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            const firstItem = sale.items && sale.items.length > 0 ? sale.items[0] : null;

            const tripData = {
                date: sale.invoiceDate,
                vehicleId: sale.vehicleId,
                driverId: sale.driverId,
                driverName: sale.driverName,
                customerId: sale.customer,
                stoneTypeId: firstItem ? firstItem.stoneType : null,
                fromLocation: sale.fromLocation || 'Quarry',
                toLocation: sale.toLocation || 'Site',
                loadQuantity: totalQty,
                loadUnit: firstItem?.unit || 'Tons',
                tripRate: sale.grandTotal,
                notes: `Updated from Invoice: ${sale.invoiceNumber}`
            };

            await Trip.findOneAndUpdate(
                { saleId: sale._id },
                { $set: tripData, isConvertedToSale: true, status: 'Completed' },
                { upsert: true, new: true }
            );
        }

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

        // Also cancel the linked trip
        await Trip.findOneAndUpdate({ saleId: sale._id }, { status: 'Cancelled' });

        // Also delete the linked income record (if any)
        await Income.findOneAndDelete({ description: new RegExp(`Invoice: ${sale.invoiceNumber}`) });

        res.status(200).json({ success: true, message: 'Sale and linked trip cancelled' });
    } catch (error) {
        next(error);
    }
};

// @desc    Manual toggle delivery status (complete / re-open)
// @route   PATCH /api/sales/:id/delivery-status
exports.updateDeliveryStatus = async (req, res, next) => {
    try {
        const { deliveryStatus } = req.body;
        if (!['open', 'completed'].includes(deliveryStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid deliveryStatus. Use open or completed.' });
        }
        const sale = await Sales.findByIdAndUpdate(
            req.params.id,
            { deliveryStatus },
            { new: true }
        ).populate('customer', 'name phone address gstNumber');
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// @desc    Add payment to a sale
// @route   POST /api/sales/:id/payment
exports.addPayment = async (req, res, next) => {
    try {
        const sale = await Sales.findById(req.params.id).populate('customer');
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

        // Record Income for Payment
        await Income.create({
            source: 'Stone Sales',
            amount: payment.amount,
            date: payment.paymentDate || new Date(),
            customerName: sale.customer ? sale.customer.name : 'Unknown',
            description: `Payment for Invoice: ${sale.invoiceNumber}`
        });

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

// @desc    Bulk add sales from parsed Excel/CSV
// @route   POST /api/sales/bulk
exports.bulkAddSales = async (req, res, next) => {
    try {
        const { salesData } = req.body;
        if (!salesData || !Array.isArray(salesData)) {
            return res.status(400).json({ success: false, message: 'Invalid sales data format' });
        }

        // 1. Fetch Master Data for lookups
        const customers = await Customer.find({ status: 'active' });
        const stoneTypes = await StoneType.find({ status: 'active' });

        const customerMap = {};
        customers.forEach(c => customerMap[c.name.toLowerCase().trim()] = c._id);

        const stoneTypeMap = {};
        stoneTypes.forEach(s => stoneTypeMap[s.name.toLowerCase().trim()] = { 
            id: s._id, 
            hsnCode: s.hsnCode, 
            unit: s.unit,
            gstPercentage: s.gstPercentage 
        });

        const processedSales = [];
        const validationErrors = [];

        for (let i = 0; i < salesData.length; i++) {
            const item = salesData[i];
            const rowNum = i + 1;

            if (!item.customerName) {
                validationErrors.push(`Row ${rowNum}: Customer Name is missing`);
                continue;
            }

            const custId = customerMap[item.customerName.toLowerCase().trim()];
            if (!custId) {
                validationErrors.push(`Row ${rowNum}: Customer "${item.customerName}" not found in Master List`);
                continue;
            }

            const stoneKey = (item.item || '').toLowerCase().trim();
            const stone = stoneTypeMap[stoneKey];
            if (!stone) {
                validationErrors.push(`Row ${rowNum}: Item/Stone "${item.item}" not found in Master List`);
                continue;
            }

            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const amt = qty * rate;

            const gstPct = parseFloat(item.gstPercentage) || stone.gstPercentage || 0;
            const gstAmt = (amt * gstPct) / 100;

            const saleObj = {
                invoiceDate: item.invoiceDate || new Date(),
                customer: custId,
                paymentType: (item.paymentType || 'Cash').charAt(0).toUpperCase() + (item.paymentType || 'Cash').slice(1).toLowerCase(),
                fromLocation: item.fromLocation || 'Quarry',
                toLocation: item.toLocation || '',
                notes: item.notes || '',
                receiptNumber: item.receiptNumber || '',
                receiptFile: item.receiptFile || '',
                items: [{
                    item: item.item,
                    stoneType: stone.id,
                    quantity: qty,
                    unit: item.unit || stone.unit || 'Tons',
                    hsnCode: item.hsnCode || stone.hsnCode,
                    gstPercentage: gstPct,
                    gstAmount: gstAmt,
                    rate: rate,
                    amount: amt
                }],
                amountPaid: 0 // Handled by pre-save
            };

            processedSales.push(saleObj);
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation Errors', errors: validationErrors });
        }

        // 3. Save All
        const savedSales = await Sales.create(processedSales);

        // 4. Record Income for Paid/Cash sales
        for (const sale of savedSales) {
            if (sale.amountPaid > 0) {
                const customer = customers.find(c => c._id.toString() === sale.customer.toString());
                await Income.create({
                    source: 'Stone Sales',
                    amount: sale.amountPaid,
                    date: sale.invoiceDate,
                    customerName: customer ? customer.name : 'Unknown',
                    description: `Bulk Invoice: ${sale.invoiceNumber}`
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Successfully uploaded ${savedSales.length} sales records`,
            count: savedSales.length
        });

    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
