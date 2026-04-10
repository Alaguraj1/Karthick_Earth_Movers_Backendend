const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const fullWipe = async () => {
    try {
        console.log('Connecting to database for full wipe...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections to clear.`);

        for (const collection of collections) {
            const collectionName = collection.name;

            // Skip system collections
            if (collectionName.startsWith('system.')) continue;

            console.log(`Clearing collection: ${collectionName}...`);
            await mongoose.connection.db.collection(collectionName).deleteMany({});
        }

        console.log('\n--- ALL DATA WIPED SUCCESSFULLY ---');

        console.log('\nRe-seeding essential admin accounts...');

        // This is a direct copy of seed-admin.js logic to ensure access
        const User = require('./models/User');
        await User.create({
            name: 'System Developer',
            username: 'developer',
            email: 'alaguraj.webdeveloper@gmail.com',
            password: 'Alaguraj@2026',
            role: 'Owner'
        });

        console.log('Essential admin user re-created:');
        console.log('Username: developer');
        console.log('Password: Alaguraj@2026');

        await mongoose.connection.close();
        console.log('\nFull wipe complete. Your database is now fresh and ready for use.');
        process.exit(0);
    } catch (error) {
        console.error('Full wipe failed:', error);
        process.exit(1);
    }
};

fullWipe();
