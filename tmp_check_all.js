require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Labour = require('./models/Labour');

async function checkAllAttendance() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check Jan
        const janStart = new Date(2026, 0, 1);
        const janEnd = new Date(2026, 0, 31, 23, 59, 59, 999);
        const janAtt = await Attendance.find({ date: { $gte: janStart, $lte: janEnd } }).populate('labour', 'name');
        console.log(`\n--- JANUARY ---`);
        janAtt.forEach(a => console.log(`Date: ${new Date(a.date).toLocaleDateString()}, Labour: ${a.labour?.name}, Status: ${a.status}, Paid: ${a.isPaid}`));

        // Check Feb
        const febStart = new Date(2026, 1, 1);
        const febEnd = new Date(2026, 1, 28, 23, 59, 59, 999);
        const febAtt = await Attendance.find({ date: { $gte: febStart, $lte: febEnd } }).populate('labour', 'name');
        console.log(`\n--- FEBRUARY ---`);
        febAtt.forEach(a => console.log(`Date: ${new Date(a.date).toLocaleDateString()}, Labour: ${a.labour?.name}, Status: ${a.status}, Paid: ${a.isPaid}`));

        // Check Mar
        const marStart = new Date(2026, 2, 1);
        const marEnd = new Date(2026, 2, 31, 23, 59, 59, 999);
        const marAtt = await Attendance.find({ date: { $gte: marStart, $lte: marEnd } }).populate('labour', 'name');
        console.log(`\n--- MARCH ---`);
        marAtt.forEach(a => console.log(`Date: ${new Date(a.date).toLocaleDateString()}, Labour: ${a.labour?.name}, Status: ${a.status}, Paid: ${a.isPaid}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAllAttendance();
