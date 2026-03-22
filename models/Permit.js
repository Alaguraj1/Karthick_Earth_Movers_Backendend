const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema({
    permitNumber: {
        type: String,
        required: [true, 'Please add a permit number'],
        trim: true
    },
    vehicleIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    }],
    date: {
        type: Date,
        required: [true, 'Please add a date'],
        default: Date.now
    },
    time: {
        type: String,
        required: [true, 'Please add a time']
    },
    totalTripsAllowed: {
        type: Number,
        required: [true, 'Please specify total trips allowed'],
        default: 1
    },
    usedTrips: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Completed'],
        default: 'Active'
    },
    notes: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for remaining trips
permitSchema.virtual('remainingTrips').get(function () {
    return this.totalTripsAllowed - this.usedTrips;
});

module.exports = mongoose.model('Permit', permitSchema);
