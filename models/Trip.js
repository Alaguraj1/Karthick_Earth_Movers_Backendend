const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    vehicleNumber: {
        type: String,
        required: true,
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['Lorry', 'Tipper', 'Tractor', 'JCB', 'Poclain', 'Other'],
        default: 'Lorry'
    },
    driverName: {
        type: String,
        required: true,
        trim: true
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
    materialType: {
        type: String,
        enum: ['Jelly', 'M-Sand', 'P-Sand', 'Boulder', 'Dust', 'GSB', 'WMM'],
        default: 'Jelly'
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
    startingPoint: {
        type: String,
        trim: true
    },
    endingPoint: {
        type: String,
        trim: true
    },

    // Diesel Expenses
    dieselQuantity: {
        type: Number,
        default: 0
    },
    dieselRate: {
        type: Number,
        default: 0
    },
    dieselTotal: {
        type: Number,
        default: 0
    },

    // Driver Payment
    driverPaymentType: {
        type: String,
        enum: ['Trip', 'Monthly'],
        default: 'Trip'
    },
    driverAmount: {
        type: Number,
        default: 0
    },
    driverBata: {
        type: Number,
        default: 0
    },

    // Other Expenses
    otherExpenses: {
        type: Number,
        default: 0
    },

    // Financial Summary
    totalExpense: {
        type: Number,
        default: 0
    },
    netProfit: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Cancelled'],
        default: 'Completed'
    },
    notes: String
}, { timestamps: true });

// Calculate profit before saving
TripSchema.pre('save', function () {
    this.dieselTotal = (this.dieselQuantity || 0) * (this.dieselRate || 0);
    this.totalExpense = (this.dieselTotal || 0) + (this.driverAmount || 0) + (this.driverBata || 0) + (this.otherExpenses || 0);
    this.netProfit = (this.tripRate || 0) - this.totalExpense;
});

module.exports = mongoose.model('Trip', TripSchema);
