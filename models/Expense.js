const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ['Diesel', 'Machine Maintenance', 'Labour Wages', 'Explosive Cost', 'Transport Charges', 'Office & Misc'],
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
        description: {
            type: String,
        },
        vehicleOrMachine: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        rate: {
            type: Number,
        },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Credit', 'Bank Transfer'],
            default: 'Cash',
        },
        billUrl: {
            type: String,
        },
        meterReading: {
            type: String, // Can be Odometer or Hour meter
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
