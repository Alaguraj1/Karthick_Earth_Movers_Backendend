const mongoose = require('mongoose');

const explosiveMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a material name'],
        trim: true,
        unique: true
    },
    unit: {
        type: String,
        default: 'Nos',
        enum: ['Nos', 'Box', 'Kg', 'Meters', 'Units']
    },
    defaultPrice: {
        type: Number,
        default: 0
    },
    openingStock: {
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

module.exports = mongoose.model('ExplosiveMaterial', explosiveMaterialSchema);
