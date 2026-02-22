const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    sales: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sales',
        required: [true, 'Please select a sale']
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Please select a customer']
    },
    amount: {
        type: Number,
        required: [true, 'Please add payment amount'],
        min: 0
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
        default: 'Cash'
    },
    referenceNumber: String,
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
