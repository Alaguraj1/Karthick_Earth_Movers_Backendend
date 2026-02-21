const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expense = require('./models/Expense');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const expense = await Expense.create({
            category: 'Diesel',
            amount: 1,
            date: new Date(),
            description: 'Test'
        });
        console.log('Test expense created:', expense._id);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

test();
