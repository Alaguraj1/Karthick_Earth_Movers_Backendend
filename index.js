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
const uploads = require('./routes/uploadRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

// Mount routers
app.use('/api/expenses', expenses);
app.use('/api/income', income);
app.use('/api/master', master);
app.use('/api/upload', uploads);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
