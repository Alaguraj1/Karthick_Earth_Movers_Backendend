const Permit = require('../models/Permit');

// @desc    Get all permits
// @route   GET /api/permits
exports.getPermits = async (req, res, next) => {
    try {
        const permits = await Permit.find().populate('vehicleIds', 'name vehicleNumber registrationNumber');
        res.status(200).json({ success: true, count: permits.length, data: permits });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single permit
// @route   GET /api/permits/:id
exports.getPermit = async (req, res, next) => {
    try {
        const permit = await Permit.findById(req.params.id).populate('vehicleIds', 'name vehicleNumber registrationNumber');
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });
        res.status(200).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Add new permit
// @route   POST /api/permits
exports.addPermit = async (req, res, next) => {
    try {
        const { selectedTripIds, ...permitData } = req.body;
        const Trip = require('../models/Trip');

        // Clean up empty vehicleIds (if none selected in multi-select, it might be an empty array)
        if (!permitData.vehicleIds) permitData.vehicleIds = [];

        permitData.usedTrips = selectedTripIds ? selectedTripIds.length : 0;
        if (permitData.usedTrips >= (permitData.totalTripsAllowed || 1)) {
            permitData.status = 'Completed';
        }

        const permit = await Permit.create(permitData);

        // Update selected trips to point to this permit
        if (selectedTripIds && selectedTripIds.length > 0) {
            await Trip.updateMany(
                { _id: { $in: selectedTripIds } },
                { permitId: permit._id }
            );
        }

        res.status(201).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Update permit
// @route   PUT /api/permits/:id
exports.updatePermit = async (req, res, next) => {
    try {
        const { selectedTripIds, ...updateData } = req.body;
        const Trip = require('../models/Trip');

        const permit = await Permit.findById(req.params.id);
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });

        // Clean up empty vehicleIds
        if (!updateData.vehicleIds) updateData.vehicleIds = [];

        // If selectedTripIds provided, sync
        if (selectedTripIds) {
            // Un-link from any other permits (already handled by updateMany below essentially)
            // But we specifically set our permitId to all selected trips
            await Trip.updateMany(
                { _id: { $in: selectedTripIds } },
                { permitId: permit._id }
            );

            // Clear permitId for trips that are no longer in our selection
            await Trip.updateMany(
                { permitId: permit._id, _id: { $nin: selectedTripIds } },
                { permitId: null }
            );

            updateData.usedTrips = selectedTripIds.length;
            if (updateData.usedTrips >= (updateData.totalTripsAllowed || permit.totalTripsAllowed)) {
                updateData.status = 'Completed';
            } else {
                updateData.status = 'Active';
            }
        }

        Object.assign(permit, updateData);
        await permit.save();

        res.status(200).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete permit
// @route   DELETE /api/permits/:id
exports.deletePermit = async (req, res, next) => {
    try {
        const permit = await Permit.findByIdAndDelete(req.params.id);
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });
        res.status(200).json({ success: true, message: 'Permit deleted' });
    } catch (error) {
        next(error);
    }
};
