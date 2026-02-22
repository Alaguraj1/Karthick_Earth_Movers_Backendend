const mongoose = require('mongoose');

const LabourContractorSchema = new mongoose.Schema({
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

    // 2. Contract Details (Multi-row support)
    contracts: [
        {
            workType: {
                type: String,
                enum: ['Quarry loading', 'Drilling', 'Crusher labour', 'Blasting support', 'Transporter', 'Other'],
                required: true
            },
            rateType: {
                type: String,
                enum: ['Per Day', 'Per Ton', 'Per Load', 'Monthly Contract'],
                required: true
            },
            agreedRate: {
                type: Number,
                required: true
            },
            labourCount: {
                type: Number,
                default: 0
            }
        }
    ],

    // 3. Labour Strength
    noOfWorkers: {
        type: Number,
        default: 0
    },
    supervisorName: String,
    shift: {
        type: String,
        enum: ['Day', 'Night', 'Both'],
        default: 'Day'
    },

    // 4. Payment Details
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank', 'UPI'],
        default: 'Cash'
    },
    creditTerms: {
        type: String,
        enum: ['7 days', '15 days', '30 days', 'Immediate'],
        default: '7 days'
    },
    advancePaid: {
        type: Number,
        default: 0
    },
    outstandingBalance: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('LabourContractor', LabourContractorSchema);
