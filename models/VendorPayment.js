const mongoose = require('mongoose');

const VendorPaymentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'vendorType'
    },
    vendorType: {
        type: String,
        required: true,
        enum: ['ExplosiveSupplier', 'LabourContractor', 'TransportVendor']
    },
    vendorName: String, // Denormalized for easier display
    invoiceAmount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
        default: 'Cash'
    },
    referenceNumber: String,
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('VendorPayment', VendorPaymentSchema);
