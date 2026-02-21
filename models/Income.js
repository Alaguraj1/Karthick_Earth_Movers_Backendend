const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            required: true,
            enum: ['Stone Sales', 'Transport Charges', 'Other Service'],
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        customerName: {
            type: String,
        },
        vehicleNumber: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ['Paid', 'Pending', 'Partial'],
            default: 'Paid',
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Income', IncomeSchema);
