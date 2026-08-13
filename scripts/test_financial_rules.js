const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/config/db');

// Controllers to test
const saleController = require('../src/controllers/sale.controller');
const debtController = require('../src/controllers/debt.controller');
const debtPaymentController = require('../src/controllers/debtPayment.controller');
const supplierOrderController = require('../src/controllers/supplierOrder.controller');
const supplierPaymentController = require('../src/controllers/supplierPayment.controller');
const restaurantSaleController = require('../src/controllers/restaurant/sale.controller');
const expenseController = require('../src/controllers/expense.controller');

// Helper to mock req, res, next
function createMockReqRes(body = {}, params = {}, query = {}, user = {}, company = {}) {
  const req = {
    body,
    params,
    query,
    user: { id: 1, ...user },
    company: { id: 1, ...company },
  };

  let statusCode = 200;
  let responseData = null;
  let caughtError = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  const next = (err) => {
    caughtError = err;
  };

  return { req, res, next, getStatus: () => statusCode, getData: () => responseData, getError: () => caughtError };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FINANCIAL RULES VERIFICATION TESTS');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  async function test(title, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ [PASS] ${title}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ [FAIL] ${title}:`, err.message);
    }
  }

  // 1. Fetch or create a test product, client and supplier
  const [companies] = await pool.query('SELECT id FROM companies LIMIT 1');
  if (companies.length === 0) {
    console.error('No companies found in database to run tests.');
    process.exit(1);
  }
  const companyId = companies[0].id;

  const [products] = await pool.query('SELECT id, retail_price, cost_price FROM products WHERE company_id = ? AND product_type = "product" AND (manage_stock = 0 OR current_stock >= 10) AND deleted_at IS NULL LIMIT 1', [companyId]);
  let testProductId;
  if (products.length > 0) {
    testProductId = products[0].id;
  } else {
    const slug = 'test-product-' + Date.now();
    const [ins] = await pool.query('INSERT INTO products (company_id, name, slug, sku, product_type, retail_price, cost_price, manage_stock, current_stock) VALUES (?, ?, ?, ?, "product", ?, ?, 0, 100)', [companyId, 'Test Product ' + Date.now(), slug, 'TEST-' + Date.now(), 1000, 500]);
    testProductId = ins.insertId;
  }

  const [clients] = await pool.query('SELECT id FROM clients WHERE company_id = ? AND deleted_at IS NULL LIMIT 1', [companyId]);
  let testClientId;
  if (clients.length > 0) {
    testClientId = clients[0].id;
  } else {
    const [ins] = await pool.query('INSERT INTO clients (company_id, full_name, phone) VALUES (?, ?, ?)', [companyId, 'Test Client', '99999999']);
    testClientId = ins.insertId;
  }

  const [suppliers] = await pool.query('SELECT id FROM suppliers WHERE company_id = ? AND deleted_at IS NULL LIMIT 1', [companyId]);
  let testSupplierId;
  if (suppliers.length > 0) {
    testSupplierId = suppliers[0].id;
  } else {
    const [ins] = await pool.query('INSERT INTO suppliers (company_id, company_name, phone, is_active) VALUES (?, ?, ?, 1)', [companyId, 'Test Supplier', '99999999']);
    testSupplierId = ins.insertId;
  }

  // ──────────────────────────────────────────
  // TEST 1 : Vente au détail avec prix = 0 FCFA (Total = 0)
  // ──────────────────────────────────────────
  await test('Vente au détail : rejet panier à 0 FCFA', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      items: [{ product_id: testProductId, quantity: 2, unit_price: 0, discount_amount: 0 }],
      discount_type: 'none',
      discount_value: 0,
      amount_paid: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await saleController.createSale(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with total > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 2 : Vente au détail avec remise = 100% (Total = 0)
  // ──────────────────────────────────────────
  await test('Vente au détail : rejet remise 100% (Total = 0 FCFA)', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      items: [{ product_id: testProductId, quantity: 1, unit_price: 5000, discount_amount: 0 }],
      discount_type: 'percentage',
      discount_value: 100,
      amount_paid: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await saleController.createSale(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400) {
      throw new Error(`Expected 400, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 3 : Vente au détail avec quantité nulle ou négative
  // ──────────────────────────────────────────
  await test('Vente au détail : rejet quantité <= 0', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      items: [{ product_id: testProductId, quantity: 0, unit_price: 5000, discount_amount: 0 }],
      amount_paid: 5000,
    }, {}, {}, { id: 1 }, { id: companyId });

    await saleController.createSale(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400) {
      throw new Error(`Expected 400, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 4 : Dette avec Total = 0 FCFA
  // ──────────────────────────────────────────
  await test('Dette : rejet total = 0 FCFA', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      client_id: testClientId,
      items: [{ product_id: testProductId, quantity: 1, unit_price: 0 }],
      discount_type: 'none',
      discount_value: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await debtController.createDebt(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with total > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 5 : Commande fournisseur avec Total = 0 FCFA
  // ──────────────────────────────────────────
  await test('Commande fournisseur : rejet total = 0 FCFA', async () => {
    const mock = createMockReqRes({
      supplier_id: testSupplierId,
      company_id: companyId,
      shipping_cost: 0,
      tax_amount: 0,
      items: [{ product_id: testProductId, quantity_ordered: 5, unit_cost: 0 }],
    }, {}, {}, { id: 1 }, { id: companyId });

    await supplierOrderController.createOrder(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with total > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // Create a test debt for payment test
  const [debts] = await pool.query('SELECT id FROM client_debts WHERE company_id = ? AND status != "paid" LIMIT 1', [companyId]);
  let testDebtId;
  if (debts.length > 0) {
    testDebtId = debts[0].id;
  } else {
    const [ins] = await pool.query('INSERT INTO client_debts (company_id, client_id, total_amount, remaining_amount, status) VALUES (?, ?, 10000, 10000, "pending")', [companyId, testClientId]);
    testDebtId = ins.insertId;
  }

  // ──────────────────────────────────────────
  // TEST 6 : Paiement dette avec montant <= 0
  // ──────────────────────────────────────────
  await test('Paiement dette : rejet montant = 0 ou négatif', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      client_debt_id: testDebtId,
      amount: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await debtPaymentController.createPayment(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with amount > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 7 : Paiement fournisseur avec montant <= 0
  // ──────────────────────────────────────────
  await test('Paiement fournisseur : rejet montant = 0 ou négatif', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      supplier_id: testSupplierId,
      amount: -500,
    }, { id: 'global' }, {}, { id: 1 }, { id: companyId });

    await supplierOrderController.addPayment(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with amount > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 8 : Dépense avec montant <= 0
  // ──────────────────────────────────────────
  await test('Dépense : rejet montant = 0 ou négatif', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      title: 'Facture test',
      category: 'other',
      amount: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await expenseController.createExpense(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with amount > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 9 : Vente valide (Total > 0)
  // ──────────────────────────────────────────
  await test('Vente au détail valide : acceptation (Total > 0 FCFA)', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      items: [{ product_id: testProductId, quantity: 1, unit_price: 2500, discount_amount: 0 }],
      discount_type: 'none',
      discount_value: 0,
      amount_paid: 2500,
      payment_method: 'cash',
    }, {}, {}, { id: 1 }, { id: companyId });

    await saleController.createSale(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (err) {
      throw new Error(`Expected success, got error: ${err.statusCode} - ${err.message}`);
    }
    if (mock.getStatus() !== 201) {
      throw new Error(`Expected status 201, got ${mock.getStatus()}`);
    }
  });

  // ──────────────────────────────────────────
  // TEST 10 : Vente restaurant avec plat à 0 FCFA
  // ──────────────────────────────────────────
  const [dishes] = await pool.query('SELECT id FROM products WHERE company_id = ? AND product_type = "dish" AND deleted_at IS NULL LIMIT 1', [companyId]);
  let testDishId;
  if (dishes.length > 0) {
    testDishId = dishes[0].id;
  } else {
    const slug = 'test-dish-' + Date.now();
    const [ins] = await pool.query('INSERT INTO products (company_id, name, slug, sku, product_type, retail_price, cost_price) VALUES (?, ?, ?, ?, "dish", 2000, 1000)', [companyId, 'Test Dish', slug, 'DISH-001']);
    testDishId = ins.insertId;
  }

  await test('Restaurant : rejet commande plat à 0 FCFA', async () => {
    const mock = createMockReqRes({
      company_id: companyId,
      items: [{ product_id: testDishId, quantity: 1, unit_price: 0, discount_amount: 0 }],
      discount_type: 'none',
      discount_value: 0,
      amount_paid: 0,
    }, {}, {}, { id: 1 }, { id: companyId });

    await restaurantSaleController.createSale(mock.req, mock.res, mock.next);
    const err = mock.getError();
    if (!err || err.statusCode !== 400 || !err.message.includes('supérieur à 0 FCFA')) {
      throw new Error(`Expected 400 with total > 0 message, got: ${err ? `${err.statusCode}: ${err.message}` : 'Success'}`);
    }
  });

  console.log(`\n====================================================`);
  console.log(`🏁 TESTS SUMMARY: ${passedCount} / ${totalCount} PASSED`);
  console.log(`====================================================\n`);

  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
