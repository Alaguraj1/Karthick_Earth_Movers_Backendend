const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehicle = require('./models/Vehicle');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        const vehicles = await Vehicle.find({ status: { $ne: 'inactive' } });
        console.log('VEHICLES_FOUND');
        console.log(JSON.stringify(vehicles.map(v => ({
            _id: v._id,
            vehicleNumber: v.vehicleNumber,
            registrationNumber: v.registrationNumber,
            name: v.name,
            category: v.category,
            status: v.status
        })), null, 2));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
