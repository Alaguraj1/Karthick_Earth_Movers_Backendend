const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a vehicle/machine name'],
        trim: true
    },
    vehicleNumber: {
        type: String,
        unique: true,
        sparse: true, // Allow multiple nulls/empty if it's a machine without number
        trim: true
    },
    type: {
        type: String,
        enum: ['Vehicle', 'Machine'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
