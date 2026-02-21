const mongoose = require('mongoose');

const AdvanceSchema = new mongoose.Schema({
    labour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'G-Pay'],
        default: 'Cash',
    },
    remarks: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Advance', AdvanceSchema);
