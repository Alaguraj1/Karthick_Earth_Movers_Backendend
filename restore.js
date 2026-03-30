require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');

// Command line argument for backup file
const backupFilePath = process.argv[2];

if (!backupFilePath) {
    console.error('\n❌ ERROR: Please provide the path to the backup JSON file.');
    console.error('Usage: node restore.js <path-to-json-file>\n');
    console.error('Example: node restore.js ./backups/karthick_earth_movers_backup_2026.json\n');
    process.exit(1);
}

// Utility to recursively restore MongoDB data types (ObjectIds and Dates) from JSON strings
const reviveMongoTypes = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            // Check if it's an ISO 8601 Date string
            const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(obj);
            if (isDate) return new Date(obj);

            // Check if it's exactly 24 hex characters, which is likely an ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(obj);
            if (isObjectId) return new mongoose.Types.ObjectId(obj);
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => reviveMongoTypes(item));
    }

    const revived = {};
    for (const [key, value] of Object.entries(obj)) {
        revived[key] = reviveMongoTypes(value);
    }
    return revived;
};

const runRestore = async () => {
    try {
        if (!fs.existsSync(backupFilePath)) {
            console.error(`\n❌ ERROR: Backup file not found at ${backupFilePath}`);
            process.exit(1);
        }

        console.log(`\n⏳ Loading backup data from ${backupFilePath}...`);
        const fileContent = fs.readFileSync(backupFilePath, 'utf-8');
        let backupData;
        try {
            backupData = JSON.parse(fileContent);
        } catch (e) {
            console.error('\n❌ ERROR: Invalid JSON format in the backup file.');
            process.exit(1);
        }

        console.log(`\n🔗 Connecting to MongoDB...`);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected successfully.');

        const db = mongoose.connection.db;

        // Interactive Prompt to prevent accidental overrides
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\n⚠️  WARNING: This will WIPE OUT existing data in the database and OVERWRITE it with the backup. Are you absolutely sure? (yes/no): ', async (answer) => {
            if (answer.toLowerCase() !== 'yes') {
                console.log('\n🛑 Restore cancelled by user.');
                process.exit(0);
            }

            console.log('\n🚀 Starting restore process...');

            for (const [collectionName, documents] of Object.entries(backupData)) {
                console.log(`\n📦 Processing collection: ${collectionName} (${documents.length} records)`);
                
                const collection = db.collection(collectionName);
                
                // Clear existing records
                await collection.deleteMany({});
                console.log(`  - 🧹 Cleared existing records in ${collectionName}`);

                if (documents.length > 0) {
                    // Convert stringified ObjectIds and Dates back to their native Mongo formats
                    const revivedDocs = documents.map(doc => reviveMongoTypes(doc));
                    
                    // Insert all documents
                    await collection.insertMany(revivedDocs);
                    console.log(`  - 📥 Successfully inserted ${documents.length} records`);
                } else {
                    console.log(`  - ⏭️  Skipped insertion (0 records found in backup for this collection)`);
                }
            }

            console.log('\n🎉 RESTORE COMPLETED SUCCESSFULLY!');
            mongoose.connection.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('\n❌ FATAL ERROR During Restore:', error);
        process.exit(1);
    }
};

runRestore();
