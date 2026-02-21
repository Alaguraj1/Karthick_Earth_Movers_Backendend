const mongoose = require('mongoose');

const LabourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    mobile: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
    },
    workType: {
        type: String, // e.g., Helper, Operator, Driver, etc.
    },
    wage: {
        type: Number,
        default: 0,
    },
    wageType: {
        type: String,
        enum: ['Daily', 'Monthly'],
        default: 'Daily',
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Labour', LabourSchema);
