const express = require('express');
const router = express.Router();
const ExplosiveSupplier = require('../models/ExplosiveSupplier');
const LabourContractor = require('../models/LabourContractor');
const TransportVendor = require('../models/TransportVendor');
const VendorPayment = require('../models/VendorPayment');

// Explosive Suppliers CRUD
router.get('/explosive', async (req, res) => {
    try {
        const suppliers = await ExplosiveSupplier.find().sort({ createdAt: -1 });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/explosive', async (req, res) => {
    try {
        const supplier = await ExplosiveSupplier.create(req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/explosive/:id', async (req, res) => {
    try {
        const supplier = await ExplosiveSupplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/explosive/:id', async (req, res) => {
    try {
        await ExplosiveSupplier.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Labour Contractors CRUD
router.get('/labour', async (req, res) => {
    try {
        const contractors = await LabourContractor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contractors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/labour', async (req, res) => {
    try {
        const contractor = await LabourContractor.create(req.body);
        res.status(201).json({ success: true, data: contractor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/labour/:id', async (req, res) => {
    try {
        const contractor = await LabourContractor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: contractor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/labour/:id', async (req, res) => {
    try {
        await LabourContractor.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Transport Vendors CRUD
router.get('/transport', async (req, res) => {
    try {
        const vendors = await TransportVendor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/transport', async (req, res) => {
    try {
        const vendor = await TransportVendor.create(req.body);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/transport/:id', async (req, res) => {
    try {
        const vendor = await TransportVendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/transport/:id', async (req, res) => {
    try {
        await TransportVendor.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Payment History CRUD
router.get('/payments', async (req, res) => {
    try {
        const payments = await VendorPayment.find().sort({ date: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/payments', async (req, res) => {
    try {
        const payment = await VendorPayment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/payments/:id', async (req, res) => {
    try {
        await VendorPayment.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Outstanding Balances List
router.get('/outstanding', async (req, res) => {
    try {
        const bal = await VendorPayment.aggregate([
            {
                $group: {
                    _id: { vendorId: "$vendorId", vendorType: "$vendorType" },
                    totalInvoice: { $sum: "$invoiceAmount" },
                    totalPaid: { $sum: "$paidAmount" },
                    vendorName: { $first: "$vendorName" }
                }
            },
            {
                $project: {
                    vendorId: "$_id.vendorId",
                    vendorType: "$_id.vendorType",
                    totalInvoice: 1,
                    totalPaid: 1,
                    vendorName: 1,
                    balance: { $subtract: ["$totalInvoice", "$totalPaid"] }
                }
            }
        ]);
        res.json({ success: true, data: bal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
