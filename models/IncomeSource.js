const mongoose = require('mongoose');

const incomeSourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a source name'],
        unique: true,
        trim: true
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('IncomeSource', incomeSourceSchema);
