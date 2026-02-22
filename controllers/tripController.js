const Trip = require('../models/Trip');

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
        const trips = await Trip.find(query).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
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
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        Object.assign(trip, req.body);
        await trip.save();

        res.status(200).json({ success: true, data: trip });
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
        await trip.deleteOne();
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
