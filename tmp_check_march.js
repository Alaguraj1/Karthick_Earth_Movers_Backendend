require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Labour = require('./models/Labour');

async function checkMarchAttendance() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const month = 3; // March
        const year = 2026;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        console.log(`Checking attendance between ${start.toISOString()} and ${end.toISOString()}`);

        const attendance = await Attendance.find({
            date: { $gte: start, $lte: end }
        }).populate('labour', 'name');

        console.log(`Found ${attendance.length} records in March:`);
        attendance.forEach(a => {
            console.log(`- Date: ${new Date(a.date).toLocaleDateString()}, Labour: ${a.labour?.name}, Status: ${a.status}, isPaid: ${a.isPaid}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMarchAttendance();
