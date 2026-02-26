const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a vehicle/machine name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['Vehicle', 'Machine'],
        required: true
    },
    ownershipType: {
        type: String,
        enum: ['Own', 'Contract'],
        default: 'Own'
    },
    contractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportVendor'
    },
    category: {
        type: String,
        trim: true
    },
    // Common fields
    modelNumber: String,
    registrationNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    purchaseDate: Date,
    purchaseCost: Number,
    currentCondition: String,

    // Machine specific
    operatorName: String,

    // Vehicle specific
    vehicleNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    ownerName: String,
    driverName: String,
    rcInsuranceDetails: String,
    rcExpiryDate: Date,
    insuranceExpiryDate: Date,
    fitnessExpiryDate: Date,
    pollutionExpiryDate: Date,
    taxExpiryDate: Date,
    permitExpiryDate: Date,

    // Machine Specific - Meter Readings
    currentHmr: {
        type: Number,
        default: 0,
        description: 'Current Hour Meter Reading'
    },
    serviceDueHmr: {
        type: Number,
        default: 0,
        description: 'Next service due at this HMR'
    },
    mileageDetails: String,

    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
