require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Labour = require('./models/Labour');

async function fixMarchAttendance() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const month = 3; // March
        const year = 2026;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        // Update all attendance records in March to be unpaid MUST EXACTLY MATCH
        const result = await Attendance.updateMany(
            { date: { $gte: start, $lte: end } },
            { $set: { isPaid: false } }
        );

        console.log(`Updated ${result.modifiedCount} records in March to be unpaid (isPaid: false)`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixMarchAttendance();
