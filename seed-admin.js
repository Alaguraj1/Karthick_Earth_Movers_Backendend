const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for admin seeding...');

        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'owner' });

        if (adminExists) {
            console.log('Admin user already exists.');
        } else {
            // Create Owner
            await User.create({
                name: 'System Developer',
                username: 'developer',
                email: 'alaguraj.webdeveloper@gmail.com',
                password: 'Alaguraj@2026',
                role: 'Owner'
            });
            console.log('Owner user created: username: owner, password: ownerpassword123');
        }

        // Create Accountant
        const accountantExists = await User.findOne({ username: 'accountant' });
        if (!accountantExists) {
            await User.create({
                name: 'Primary Accountant',
                username: 'accountant',
                email: 'accountant@karthickearthmovers.com',
                password: 'accountantpassword123',
                role: 'Accountant'
            });
            console.log('Accountant user created: username: accountant, password: accountantpassword123');
        }

        // Create Supervisor
        const supervisorExists = await User.findOne({ username: 'supervisor' });
        if (!supervisorExists) {
            await User.create({
                name: 'Site Supervisor',
                username: 'supervisor',
                email: 'supervisor@karthickearthmovers.com',
                password: 'supervisorpassword123',
                role: 'Supervisor'
            });
            console.log('Supervisor user created: username: supervisor, password: supervisorpassword123');
        }

        console.log('User roles seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedAdmin();
