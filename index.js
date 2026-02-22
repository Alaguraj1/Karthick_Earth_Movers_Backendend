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

// Enable CORS
app.use(cors());

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const expenses = require('./routes/expenseRoutes');
const income = require('./routes/incomeRoutes');
const master = require('./routes/masterRoutes');
const labour = require('./routes/labourRoutes');
const uploads = require('./routes/uploadRoutes');
const reports = require('./routes/reportRoutes');
const production = require('./routes/productionRoutes');
const customers = require('./routes/customerRoutes');
const sales = require('./routes/salesRoutes');
const trips = require('./routes/tripRoutes');
const driverPayments = require('./routes/driverPaymentRoutes');
const vendors = require('./routes/vendorRoutes');

const errorHandler = require('./middlewares/errorMiddleware');

// Mount routers
app.use('/api/expenses', expenses);
app.use('/api/income', income);
app.use('/api/master', master);
app.use('/api/labour', labour);
app.use('/api/upload', uploads);
app.use('/api/reports', reports);
app.use('/api/production', production);
app.use('/api/customers', customers);
app.use('/api/sales', sales);
app.use('/api/trips', trips);
app.use('/api/driver-payments', driverPayments);
app.use('/api/vendors', vendors);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
