const mongoose = require('mongoose');

const TransportVendorSchema = new mongoose.Schema({
    // 1. Basic Details
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: String,
    mobileNumber: {
        type: String,
        required: true
    },
    address: String,
    gstNumber: String,
    panNumber: String,

    // 2. Vehicle & Rate Details (Multi-vehicle support)
    vehicles: [
        {
            vehicleType: {
                type: String,
                enum: ['Lorry', 'JCB', 'Hitachi', 'Tractor', 'Tipper', 'Other'],
                default: 'Lorry'
            },
            vehicleName: String, // e.g., "Tata Prima", "JCB 3DX"
            vehicleNumber: {
                type: String,
                required: true
            },
            driverName: String,
            driverMobile: String,
            capacity: String, // e.g., "10 Ton", "6 Wheeler"
            ratePerTrip: {
                type: Number,
                required: true
            },
            padiKasu: {
                type: Number,
                default: 0
            }
        }
    ],

    // 3. Payment Details
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank', 'UPI'],
        default: 'Bank'
    },
    creditTerms: {
        type: String, // e.g., "7 days", "Per Trip"
        default: 'Per Trip'
    },
    advancePaid: {
        type: Number,
        default: 0
    },
    outstandingBalance: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('TransportVendor', TransportVendorSchema);
