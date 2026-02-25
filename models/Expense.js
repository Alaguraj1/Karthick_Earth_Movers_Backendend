const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ['Diesel', 'Machine Maintenance', 'Labour Wages', 'Explosive Cost', 'Transport Charges', 'Office & Misc'],
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        description: {
            type: String,
        },
        vehicleOrMachine: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        rate: {
            type: Number,
        },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Credit', 'Bank Transfer', 'UPI', 'G-Pay'],
            default: 'Cash',
        },
        billUrl: {
            type: String,
        },
        meterReading: {
            type: String, // Can be Odometer or Hour meter
        },
        // Detailed Machine Maintenance Fields
        maintenanceType: {
            type: String,
        },
        sparePartsCost: {
            type: Number,
        },
        labourCharge: {
            type: Number,
        },
        vendorName: {
            type: String,
        },
        nextServiceDate: {
            type: Date,
        },
        // Detailed Labour Wages Fields
        labourId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Labour',
        },
        labourName: {
            type: String,
        },
        workType: {
            type: String,
        },
        wageType: {
            type: String,
        },
        advanceDeduction: {
            type: Number,
        },
        netPay: {
            type: Number,
        },
        siteAssigned: {
            type: String,
        },
        // Detailed Explosive Cost Fields
        site: {
            type: String,
        },
        explosiveType: {
            type: String,
        },
        unit: {
            type: String,
        },
        materials: [
            {
                name: String,
                unit: String,
                quantity: Number,
                rate: Number,
                amount: Number
            }
        ],
        supplierName: {
            type: String,
        },
        licenseNumber: {
            type: String,
        },
        supervisorName: {
            type: String,
        },
        // Detailed Transport Charges Fields
        transportType: {
            type: String,
        },
        fromLocation: {
            type: String,
        },
        toLocation: {
            type: String,
        },
        driverName: {
            type: String,
        },
        loadDetails: {
            type: String,
        },
        // Detailed Office & Misc Fields
        officeExpenseType: {
            type: String,
        },
        paidTo: {
            type: String,
        },
        billNumber: {
            type: String,
        },
        // Audit & Interconnectivity
        sourceModel: {
            type: String,
            enum: ['Production', 'Trip', 'Manual'],
            default: 'Manual'
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            description: 'Link to the production or trip entry'
        },
        referenceId: {
            type: String,
            description: 'Human readable reference (e.g. Production #102)'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
