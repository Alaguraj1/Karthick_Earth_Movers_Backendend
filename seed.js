const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ExpenseCategory = require('./models/ExpenseCategory');
const IncomeSource = require('./models/IncomeSource');
const Vehicle = require('./models/Vehicle');
const Customer = require('./models/Customer');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for seeding...');

        // Clear existing master data
        await ExpenseCategory.deleteMany();
        await IncomeSource.deleteMany();
        await Vehicle.deleteMany();
        await Customer.deleteMany();

        // Seed Expense Categories
        const expenseCategories = [
            { name: 'Diesel', description: 'Fuel for vehicles and machines' },
            { name: 'Machine Maintenance', description: 'Repairs and service' },
            { name: 'Labour Wages', description: 'Daily and weekly wages' },
            { name: 'Explosive Cost', description: 'Blasting materials' },
            { name: 'Transport Charges', description: 'Hiring external transport' },
            { name: 'Office & Misc', description: 'General expenses' }
        ];
        await ExpenseCategory.insertMany(expenseCategories);

        // Seed Income Sources
        const incomeSources = [
            { name: 'Stone Sales', description: 'Sale of crushed stones' },
            { name: 'Transport Charges', description: 'Income from transport services' },
            { name: 'Other Service', description: 'Misc services' }
        ];
        await IncomeSource.insertMany(incomeSources);

        // Seed Vehicles
        const vehicles = [
            { name: 'JCB 1', type: 'Machine' },
            { name: 'JCB 2', type: 'Machine' },
            { name: 'Lorry 1', vehicleNumber: 'TN 01 AB 1234', type: 'Vehicle' },
            { name: 'Lorry 2', vehicleNumber: 'TN 01 CD 5678', type: 'Vehicle' },
            { name: 'Generator 1', type: 'Machine' }
        ];
        await Vehicle.insertMany(vehicles);

        // Seed Customers
        const customers = [
            { name: 'General Customer' },
            { name: 'ABC Constructions', phone: '9876543210' },
            { name: 'XYZ Builders', phone: '1234567890' }
        ];
        await Customer.insertMany(customers);

        console.log('Master data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
