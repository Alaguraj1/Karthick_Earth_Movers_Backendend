const express = require('express');
const DriverPayment = require('../models/DriverPayment');
const Trip = require('../models/Trip');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const payments = await DriverPayment.find().sort({ date: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const Trip = require('../models/Trip'); // Import Trip model
        const payment = await DriverPayment.create(req.body);

        // If tripId is provided, update the Trip record's driver expenses
        if (req.body.tripId) {
            const trip = await Trip.findById(req.body.tripId);
            if (trip) {
                console.log(`Syncing payment to Trip ${trip._id}: Amount=${req.body.amount}, Padi=${req.body.padiKasu}`);
                // Update trip driver expenses from payment data
                trip.driverAmount = Number(req.body.amount || 0);
                trip.driverBata = Number(req.body.padiKasu || 0);

                // Saving the trip will trigger the profit recalculation hook
                await trip.save();
                console.log('Trip updated successfully with profit:', trip.netProfit);
            }
        }

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const oldPayment = await DriverPayment.findById(req.params.id);
        const payment = await DriverPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Synchronize with Trip if tripId exists
        if (req.body.tripId) {
            const trip = await Trip.findById(req.body.tripId);
            if (trip) {
                console.log(`Updating Trip ${trip._id} from payment update: Amount=${req.body.amount}, Padi=${req.body.padiKasu}`);
                trip.driverAmount = Number(req.body.amount || 0);
                trip.driverBata = Number(req.body.padiKasu || 0);
                await trip.save();
                console.log('Trip updated successfully with profit:', trip.netProfit);
            }
        }
        // If tripId was removed or changed
        else if (oldPayment?.tripId && !req.body.tripId) {
            const oldTrip = await Trip.findById(oldPayment.tripId);
            if (oldTrip) {
                console.log(`Clearing Trip ${oldTrip._id} as payment was unlinked or tripId was removed`);
                oldTrip.driverAmount = 0;
                oldTrip.driverBata = 0;
                await oldTrip.save();
                console.log('Trip expenses reset to 0');
            }
        }

        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const payment = await DriverPayment.findById(req.params.id);

        if (payment && payment.tripId) {
            const trip = await Trip.findById(payment.tripId);
            if (trip) {
                console.log(`Clearing Trip ${trip._id} because payment ${payment._id} is being deleted`);
                trip.driverAmount = 0;
                trip.driverBata = 0;
                await trip.save();
                console.log('Trip expenses reset successfully');
            }
        }

        await DriverPayment.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
