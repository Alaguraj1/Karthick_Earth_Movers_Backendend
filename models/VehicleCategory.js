const mongoose = require('mongoose');

const VehicleCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a vehicle category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VehicleCategory', VehicleCategorySchema);
