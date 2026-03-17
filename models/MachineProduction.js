const mongoose = require('mongoose');

const machineProductionSchema = new mongoose.Schema({
    machine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Please select a machine']
    },
    date: {
        type: Date,
        required: [true, 'Please select a date'],
        default: Date.now
    },
    startTime: {
        type: String,
        required: [true, 'Please select start time']
    },
    endTime: {
        type: String,
        required: [true, 'Please select end time']
    },
    breakTime: {
        type: Number,
        default: 0,
        description: 'Break time in minutes'
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: [true, 'Please select an operator']
    },
    dieselLiters: {
        type: Number,
        default: 0
    },
    workType: {
        type: String,
        required: [true, 'Please specify work type']
    },
    startHmr: {
        type: Number,
        default: 0
    },
    endHmr: {
        type: Number,
        default: 0
    },
    totalHours: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String
    }
}, { timestamps: true });

// Pre-save hook to calculate total hours if possible or update machine status
machineProductionSchema.pre('save', async function () {
    if (this.startHmr && this.endHmr) {
        this.totalHours = this.endHmr - this.startHmr;
    }
});

module.exports = mongoose.model('MachineProduction', machineProductionSchema);
