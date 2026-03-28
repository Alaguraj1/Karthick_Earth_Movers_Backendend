const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS explicitly for your frontend domains
app.use(cors({
    origin: ['https://karthick-earth-movers.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const expenses = require('./routes/expenseRoutes');
const income = require('./routes/incomeRoutes');
const master = require('./routes/masterRoutes');
const labour = require('./routes/labourRoutes');
const uploads = require('./routes/uploadRoutes');
const reports = require('./routes/reportRoutes');

const customers = require('./routes/customerRoutes');
const sales = require('./routes/salesRoutes');
const trips = require('./routes/tripRoutes');
const driverPayments = require('./routes/driverPaymentRoutes');
const vendors = require('./routes/vendorRoutes');
const auth = require('./routes/authRoutes');
const users = require('./routes/userRoutes');
const permits = require('./routes/permitRoutes');
const machineProduction = require('./routes/machineProductionRoutes');

const errorHandler = require('./middlewares/errorMiddleware');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Server is healthy and running smoothly', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/expenses', expenses);
app.use('/api/income', income);
app.use('/api/master', master);
app.use('/api/labour', labour);
app.use('/api/upload', uploads);
app.use('/api/reports', reports);

app.use('/api/customers', customers);
app.use('/api/sales', sales);
app.use('/api/trips', trips);
app.use('/api/driver-payments', driverPayments);
app.use('/api/vendors', vendors);
app.use('/api/permits', permits);
app.use('/api/machine-production', machineProduction);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
