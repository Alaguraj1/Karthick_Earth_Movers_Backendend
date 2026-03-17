const MachineProduction = require('../models/MachineProduction');
const Vehicle = require('../models/Vehicle');
const Labour = require('../models/Labour');
const asyncHandler = require('express-async-handler');

// @desc    Get all production logs
// @route   GET /api/machine-production
// @access  Private
exports.getProductions = asyncHandler(async (req, res) => {
    const { startDate, endDate, machineId } = req.query;

    let query = {};
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (machineId) {
        query.machine = machineId;
    }

    const productions = await MachineProduction.find(query)
        .populate('machine', 'name registrationNumber currentHmr')
        .populate('operator', 'name workType')
        .sort({ date: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: productions });
});

// @desc    Create production log
// @route   POST /api/machine-production
// @access  Private
exports.createProduction = asyncHandler(async (req, res) => {
    const { machine, endHmr } = req.body;

    const production = await MachineProduction.create(req.body);

    // Update Machine's current HMR if provided
    if (endHmr) {
        await Vehicle.findByIdAndUpdate(machine, { currentHmr: endHmr });
    }

    res.status(201).json({ success: true, data: production });
});

// @desc    Update production log
// @route   PUT /api/machine-production/:id
// @access  Private
exports.updateProduction = asyncHandler(async (req, res) => {
    let production = await MachineProduction.findById(req.params.id);
    if (!production) {
        return res.status(404).json({ success: false, message: 'Log not found' });
    }

    production = await MachineProduction.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // Update Machine's current HMR if it's the latest entry (simplified for now)
    if (req.body.endHmr) {
        await Vehicle.findByIdAndUpdate(production.machine, { currentHmr: req.body.endHmr });
    }

    res.status(200).json({ success: true, data: production });
});

// @desc    Delete production log
// @route   DELETE /api/machine-production/:id
// @access  Private
exports.deleteProduction = asyncHandler(async (req, res) => {
    const production = await MachineProduction.findById(req.params.id);
    if (!production) {
        return res.status(404).json({ success: false, message: 'Log not found' });
    }

    await production.deleteOne();
    res.status(200).json({ success: true, message: 'Log deleted successfully' });
});

// @desc    Get machine-wise operator (Helper for frontend)
// @route   GET /api/machine-production/operators/:machineId
// @access  Private
exports.getOperatorsForMachine = asyncHandler(async (req, res) => {
    // In this system, we can just return all labours whose workType is 'Operator'
    // or if the machine has a specific operatorName assigned.
    const operators = await Labour.find({
        workType: { $regex: /operator/i },
        status: 'active'
    }).sort('name');

    res.status(200).json({ success: true, data: operators });
});
