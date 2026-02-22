const express = require('express');
const DriverPayment = require('../models/DriverPayment');
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
        const payment = await DriverPayment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await DriverPayment.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
