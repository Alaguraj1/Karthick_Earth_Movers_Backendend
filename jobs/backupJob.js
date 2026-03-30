const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const performWeeklyBackup = async () => {
    try {
        console.log('Initiating database backup...');
        const collections = await mongoose.connection.db.collections();
        const backupData = {};

        // Export all collections to JSON
        for (let collection of collections) {
            const data = await collection.find({}).toArray();
            backupData[collection.collectionName] = data;
        }

        const backupsDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir);
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const backupFileName = `karthick_earth_movers_backup_${dateStr}_${Date.now()}.json`;
        const backupPath = path.join(backupsDir, backupFileName);

        // Save stringified JSON of the entire DB
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`Backup saved locally to ${backupPath}`);

        // Setup Nodemailer transporter using environment variables
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Karthick Earth Movers'}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
            to: 'alaguraj.webdeveloper@gmail.com',
            subject: `Weekly Database Backup - ${dateStr}`,
            text: 'Hello,\n\nPlease find the scheduled weekly database backup attached as a JSON file.\n\nNote: If this file is too large for plain JSON email limit, you may need to compress it in the future.\n\nRegards,\nAutomated System',
            attachments: [
                {
                    filename: backupFileName,
                    path: backupPath
                }
            ]
        };

        // Send Email
        await transporter.sendMail(mailOptions);
        console.log('Weekly backup email successfully sent to alaguraj.webdeveloper@gmail.com');

        // Optional: Clean up the file to save disk space after sending
        // fs.unlinkSync(backupPath);

    } catch (error) {
        console.error('Failed to run weekly backup job:', error);
    }
};

// Start cron schedule
const initBackupJob = () => {
    // Schedule to run every Sunday at 00:00 (Midnight)
    // format: Minute Hour DayOfMonth Month DayOfWeek
    cron.schedule('0 0 * * 0', () => {
        console.log('Running scheduled weekly Cron Job: Database Backup');
        performWeeklyBackup();
    });
    console.log('Weekly backup cron job has been initialized (Runs every Sunday at Midnight).');
};

module.exports = { initBackupJob, performWeeklyBackup };
