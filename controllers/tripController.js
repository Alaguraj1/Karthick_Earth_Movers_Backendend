const Trip = require('../models/Trip');
const Sales = require('../models/Sales');
const StoneType = require('../models/StoneType');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const Labour = require('../models/Labour');
const TransportVendor = require('../models/TransportVendor');

// Helper to sync expenses from a trip
const syncExpensesFromTrip = async (tripId) => {
    try {
        const trip = await Trip.findById(tripId).populate('vehicleId').populate('driverId');
        if (!trip) return;

        // 1. Clear existing expenses for this trip to avoid duplicates
        await Expense.deleteMany({ sourceModel: 'Trip', sourceId: trip._id });

        const expenses = [];

        // 2. Create Labour Wage Expense for Driver Bata/Amount
        const totalDriverWage = (trip.driverAmount || 0) + (trip.driverBata || 0);
        if (totalDriverWage > 0) {
            expenses.push({
                category: 'Labour Wages',
                amount: totalDriverWage,
                date: trip.date,
                labourId: trip.driverId._id,
                labourName: trip.driverId?.name || 'Unknown Driver',
                description: `Driver Bata/Wage for Trip`,
                paymentMode: 'Cash',
                sourceModel: 'Trip',
                sourceId: trip._id,
                referenceId: `Trip: ${trip.fromLocation} to ${trip.toLocation}`
            });
        }

        // 3. Create Transport Charge Expense for Hired/Contract Vehicles
        if (trip.vehicleId?.ownershipType === 'Contract' && trip.vehicleId?.contractor) {
            expenses.push({
                category: 'Transport Charges',
                amount: trip.tripRate || 0,
                date: trip.date,
                description: `Freight charges (Credit) for Contract Vehicle: ${trip.vehicleId.vehicleNumber}`,
                vendorName: trip.vehicleId.contractor,
                paymentMode: 'Credit',
                sourceModel: 'Trip',
                sourceId: trip._id,
                referenceId: `Trip: ${trip.fromLocation} to ${trip.toLocation}`
            });
        }

        // 4. Create Other Expenses if applicable
        if (trip.otherExpenses > 0) {
            expenses.push({
                category: 'Office & Misc',
                amount: trip.otherExpenses,
                date: trip.date,
                description: `Miscellaneous expenses for Trip`,
                paymentMode: 'Cash',
                sourceModel: 'Trip',
                sourceId: trip._id,
                referenceId: `Trip: ${trip.fromLocation} to ${trip.toLocation}`
            });
        }

        if (expenses.length > 0) {
            await Expense.insertMany(expenses);
        }
    } catch (error) {
        console.error('Error syncing trip expenses:', error);
    }
};

// Helper to sync vendor outstanding balance
const syncVendorBalanceFromTrip = async (trip, action) => {
    try {
        const vehicle = await Vehicle.findById(trip.vehicleId);
        if (vehicle && vehicle.ownershipType === 'Contract' && vehicle.contractor) {
            const amount = parseFloat(trip.tripRate) || 0;
            const delta = action === 'add' ? amount : -amount;

            await TransportVendor.findByIdAndUpdate(vehicle.contractor, {
                $inc: { outstandingBalance: delta }
            });
        }
    } catch (error) {
        console.error('Error syncing vendor balance:', error);
    }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Public
exports.getTrips = async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        const trips = await Trip.find(query)
            .populate('vehicleId', 'name vehicleNumber registrationNumber category ownershipType contractor')
            .populate('driverId', 'name')
            .populate('customerId', 'name phone')
            .populate('stoneTypeId', 'name unit')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Convert Trip to Sale
// @route   POST /api/trips/:id/convert-to-sale
exports.convertToSale = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
        if (trip.isConvertedToSale) return res.status(400).json({ success: false, message: 'Trip already converted to sale' });

        if (!trip.customerId) return res.status(400).json({ success: false, message: 'Trip must have a linked customer to convert to sale' });

        // Generate Invoice Number
        const count = await Sales.countDocuments();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const sale = await Sales.create({
            invoiceNumber,
            invoiceDate: trip.date,
            customer: trip.customerId,
            items: [{
                stoneType: trip.stoneTypeId,
                quantity: trip.loadQuantity,
                unit: trip.loadUnit,
                rate: trip.tripRate / trip.loadQuantity, // Estimated rate
                amount: trip.tripRate
            }],
            subTotal: trip.tripRate,
            grandTotal: trip.tripRate,
            paymentStatus: 'Pending',
            paymentType: 'Credit',
            status: 'active',
            vehicleId: trip.vehicleId,
            driverId: trip.driverId,
            fromLocation: trip.fromLocation,
            toLocation: trip.toLocation,
            notes: `Auto-generated from Trip on ${new Date(trip.date).toLocaleDateString()}`
        });

        trip.isConvertedToSale = true;
        trip.saleId = sale._id;
        await trip.save();

        res.status(201).json({
            success: true,
            data: sale,
            message: 'Trip successfully converted to Sale'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Public
exports.getTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        res.status(200).json({ success: true, data: trip });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new trip
// @route   POST /api/trips
// @access  Public
exports.createTrip = async (req, res) => {
    try {
        const trip = await Trip.create(req.body);

        // SYNC VENDOR BALANCE
        await syncVendorBalanceFromTrip(trip, 'add');

        // SYNC EXPENSES
        await syncExpensesFromTrip(trip._id);

        res.status(201).json({ success: true, data: trip });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Public
exports.updateTrip = async (req, res) => {
    try {
        const oldTrip = await Trip.findById(req.params.id);
        if (!oldTrip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        // 1. Remove old balance
        await syncVendorBalanceFromTrip(oldTrip, 'remove');

        // 2. Update trip
        Object.assign(oldTrip, req.body);
        const updatedTrip = await oldTrip.save();

        // 3. Add new balance
        await syncVendorBalanceFromTrip(updatedTrip, 'add');

        // 4. SYNC EXPENSES
        await syncExpensesFromTrip(updatedTrip._id);

        res.status(200).json({ success: true, data: updatedTrip });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Public
exports.deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        const tripId = trip._id;

        // 1. Remove balance
        await syncVendorBalanceFromTrip(trip, 'remove');

        await trip.deleteOne();

        // Remove associated expenses
        await Expense.deleteMany({ sourceModel: 'Trip', sourceId: tripId });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get trip stats/profitability
// @route   GET /api/trips/stats
// @access  Public
exports.getTripStats = async (req, res) => {
    try {
        const stats = await Trip.aggregate([
            {
                $group: {
                    _id: null,
                    totalTrips: { $sum: 1 },
                    totalIncome: { $sum: '$tripRate' },
                    totalDieselCost: { $sum: '$dieselTotal' },
                    totalDriverPayment: { $sum: '$driverAmount' },
                    totalBata: { $sum: '$driverBata' },
                    totalOtherExpenses: { $sum: '$otherExpenses' },
                    totalProfit: { $sum: '$netProfit' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {
                totalTrips: 0,
                totalIncome: 0,
                totalDieselCost: 0,
                totalDriverPayment: 0,
                totalBata: 0,
                totalOtherExpenses: 0,
                totalProfit: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
