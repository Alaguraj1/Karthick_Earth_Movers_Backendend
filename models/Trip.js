const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        description: 'Linked customer for auto-generating sale'
    },
    stoneTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoneType',
        required: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sales',
        description: 'Link to the generated invoice'
    },
    fromLocation: {
        type: String,
        required: true,
        trim: true
    },
    toLocation: {
        type: String,
        required: true,
        trim: true
    },
    loadQuantity: {
        type: Number,
        required: true
    },
    loadUnit: {
        type: String,
        enum: ['Tons', 'Units', 'Loads'],
        default: 'Tons'
    },
    tripRate: {
        type: Number,
        required: true,
        description: 'Freight amount/Income from trip'
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Cancelled'],
        default: 'Completed'
    },
    isConvertedToSale: {
        type: Boolean,
        default: false
    },
    notes: String,
    dieselQuantity: { type: Number, default: 0 },
    dieselRate: { type: Number, default: 0 },
    dieselTotal: { type: Number, default: 0 },
    driverAmount: { type: Number, default: 0 },
    driverBata: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 }
}, { timestamps: true });

// Calculate profit before saving
TripSchema.pre('save', function () {
    this.dieselTotal = (this.dieselQuantity || 0) * (this.dieselRate || 0);
    this.totalExpense = (this.dieselTotal || 0) + (this.driverAmount || 0) + (this.driverBata || 0) + (this.otherExpenses || 0);
    this.netProfit = (this.tripRate || 0) - this.totalExpense;
});

module.exports = mongoose.model('Trip', TripSchema);
