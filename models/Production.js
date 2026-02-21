const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    shift: {
        type: String,
        enum: ['Shift 1', 'Shift 2', 'Full Day'],
        required: true
    },
    siteName: String,
    supervisorName: String,

    // Machine Details (Multiple Machines Support)
    machines: [{
        machineId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Vehicle',
            required: true
        },
        workingHours: Number,
        dieselUsed: Number
    }],

    // Production & Stock Details (Multiple Stone Types Support)
    productionDetails: [{
        stoneType: {
            type: mongoose.Schema.ObjectId,
            ref: 'StoneType',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            enum: ['Tons', 'Units', 'Loads', 'Ton', 'Unit', 'KG', 'Kg', 'kg'],
            default: 'Tons'
        },
        noOfLoads: Number,
        crusherOutput: String,
        openingStock: { type: Number, default: 0 },
        dispatchedQuantity: { type: Number, default: 0 },
        closingStock: { type: Number, default: 0 }
    }],

    // Labour & Operator
    noOfWorkers: Number,
    operatorName: String,
    shiftWage: Number,

    remarks: {
        breakdown: { type: Boolean, default: false },
        rainDelay: { type: Boolean, default: false },
        powerCut: { type: Boolean, default: false },
        blastingDone: { type: Boolean, default: false },
        otherRemarks: String
    },
    createdBy: {
        type: String,
        default: 'Admin'
    }
}, { timestamps: true });

module.exports = mongoose.model('Production', productionSchema);
