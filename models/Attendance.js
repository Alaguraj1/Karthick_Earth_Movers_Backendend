const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    labour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day'],
        required: true,
    },
    overtimeHours: {
        type: Number,
        default: 0,
    },
    remarks: {
        type: String,
    },
}, { timestamps: true });

// Prevent duplicate attendance for same labor on same date
AttendanceSchema.index({ labour: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
