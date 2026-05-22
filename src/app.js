const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const errorHandler = require('./utils/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const categoriesRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const saleRoutes = require('./routes/sale.routes');
const clientRoutes = require('./routes/client.routes');
const debtRoutes = require('./routes/debt.routes');
const debtPaymentRoutes = require('./routes/debtPayment.routes');
const expenseRoutes = require('./routes/expense.routes');


const app = express();
app.use(errorHandler);
app.use('/uploads', express.static('src/uploads'));

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/debt-payments', debtPaymentRoutes);
app.use('/api/expenses', expenseRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "VISEPT API running",
  });
});

module.exports = app;