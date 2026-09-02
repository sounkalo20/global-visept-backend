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
const returnRoutes = require('./routes/return.routes');
const clientRoutes = require('./routes/client.routes');
const debtRoutes = require('./routes/debt.routes');
const debtPaymentRoutes = require('./routes/debtPayment.routes');
// const clientRoutes = require('./routes/client.routes');
const expenseRoutes = require('./routes/expense.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');
const supplierRoutes = require('./routes/supplier.routes');
const supplierOrderRoutes = require('./routes/supplierOrder.routes')
const supplierPaymentRoutes = require('./routes/supplierPayment.routes');
// const returnRoutes = require('./routes/returns.routes');
// const reportsRoutes = require('./routes/reports.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const rolesRoutes = require('./routes/roles.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const employeeRoutes = require('./routes/employee.routes');
const cashRoutes = require('./routes/cash.routes');
const importExportRoutes = require('./routes/importExport.routes');
const profitRoutes = require('./routes/profit.routes');
const searchRoutes = require('./routes/search.routes');
const healthRoutes = require('./routes/health.routes');
const stockAnomalyRoutes = require('./routes/stockAnomaly.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const journalRoutes = require('./routes/journal.routes');
const reportsRoutes = require('./routes/reports.routes');
const supplierCreditRoutes = require('./routes/supplierCredit.routes');
const stockPredictionRoutes = require('./routes/stockPrediction.routes');

//routes pour les compagnies de type restaurant 
const restaurantProductRoutes = require('./routes/restaurant/product.routes');
const restaurantSaleRoutes = require('./routes/restaurant/sale.routes');
const restaurantDebtRoutes = require('./routes/restaurant/debt.routes');
const restaurantPaymentRoutes = require('./routes/restaurant/payment.route');
const restaurantModifierRoutes = require('./routes/restaurant/modifier.routes');
const restaurantSpaceRoutes = require('./routes/restaurant/space.routes');
const restaurantTableRoutes = require('./routes/restaurant/table.routes');

//dashboard routes
const dashboardRoutes = require('./routes/dashboard.routes');
const restaurantDashboardRoutes = require('./routes/restaurant/dashboard.routes');


const app = express();

// Middlewares globaux
app.use(cors({
  origin: "*",
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('src/uploads'));

// Route de base (Health check)
app.get("/", (req, res) => {
  res.json({
    message: "VISEPT API running",
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/debt-payments', debtPaymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/supplier-orders', supplierOrderRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/supplier-credits', supplierCreditRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stock-predictions', stockPredictionRoutes);
app.use('/api/inventories', inventoryRoutes);
app.use('/api/rbac', rolesRoutes); // Point d'entrée pour les rôles et permissions
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/profits', profitRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/stock-anomalies', stockAnomalyRoutes);

// Dashboard routes
app.use('/api/shop', dashboardRoutes);
app.use('/api/restaurant', restaurantDashboardRoutes);

// Routes pour les entreprises de type restaurant 
app.use('/api/restaurant', restaurantProductRoutes);
app.use('/api/restaurant', restaurantSaleRoutes);
app.use('/api/restaurant', restaurantDebtRoutes);
app.use('/api/restaurant', restaurantPaymentRoutes);
app.use('/api/restaurant', restaurantModifierRoutes);
app.use('/api/restaurant', restaurantSpaceRoutes);
app.use('/api/restaurant', restaurantTableRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// Global Error Handler (toujours en dernier)
app.use(errorHandler);

module.exports = app;