const mongoose = require('mongoose');

const DriverPaymentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    driverName: {
        type: String, // Or ref to Labour
        required: true
    },
    paymentType: {
        type: String,
        enum: ['Per Trip', 'Monthly Salary', 'Bata', 'Allowance', 'Advance'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'UPI/G-Pay'],
        default: 'Cash'
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('DriverPayment', DriverPaymentSchema);
