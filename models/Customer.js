const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a customer name'],
        trim: true
    },
    phone: String,
    address: String,
    gstNumber: String,
    creditLimit: {
        type: Number,
        default: 0
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
