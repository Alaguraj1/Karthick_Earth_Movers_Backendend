const mongoose = require('mongoose');

const ExplosiveSupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: String,
    contactPerson: String,
    contactNumber: {
        type: String,
        required: true
    },
    email: String,
    address: String,

    explosiveLicenseNumber: {
        type: String,
        required: true
    },
    licenseValidityDate: Date,
    gstNumber: String,
    panNumber: String,
    authorizedDealerId: String,

    supplyItems: [String],

    ratePerUnit: { type: Number, default: 0 },
    paymentTerms: String,
    creditLimit: { type: Number, default: 0 },

    notes: String
}, { timestamps: true });

module.exports = mongoose.model('ExplosiveSupplier', ExplosiveSupplierSchema);
