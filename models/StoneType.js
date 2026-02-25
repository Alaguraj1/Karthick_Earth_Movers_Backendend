const mongoose = require('mongoose');

const stoneTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a stone type name'],
        trim: true,
        unique: true
    },
    unit: {
        type: String,
        default: 'Units',
        enum: ['Units', 'Tons', 'Kg', 'Litres']
    },
    defaultPrice: {
        type: Number,
        default: 0
    },
    openingStock: {
        type: Number,
        default: 0
    },
    currentStock: {
        type: Number,
        default: 0
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('StoneType', stoneTypeSchema);
