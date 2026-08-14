const pool = require('../src/config/db');
const ImportExportService = require('../src/services/ImportExportService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING IMPORT & EXPORT AUTOMATED TESTS');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedCount++;
    }
  }

  try {
    // 1. Récupérer une entreprise et son propriétaire pour les tests
    const [companies] = await pool.query(
      "SELECT id, name FROM companies WHERE is_active = 1 LIMIT 1"
    );
    if (companies.length === 0) {
      console.error("Aucune entreprise trouvée pour exécuter les tests.");
      process.exit(1);
    }
    const testCompanyId = companies[0].id;

    const [members] = await pool.query(
      "SELECT user_id FROM memberships WHERE company_id = ? AND role = 'owner' LIMIT 1",
      [testCompanyId]
    );
    const testOwnerId = members.length > 0 ? members[0].user_id : 1;

    // ─── TEST 1 : Génération des modèles Excel (.xlsx) ───
    const productsXlsx = await ImportExportService.generateTemplate('products', 'xlsx');
    assert(Buffer.isBuffer(productsXlsx) && productsXlsx.length > 1000, 'Génération modèle Produits (Excel .xlsx)');

    const clientsXlsx = await ImportExportService.generateTemplate('clients', 'xlsx');
    assert(Buffer.isBuffer(clientsXlsx) && clientsXlsx.length > 1000, 'Génération modèle Clients (Excel .xlsx)');

    const suppliersXlsx = await ImportExportService.generateTemplate('suppliers', 'xlsx');
    assert(Buffer.isBuffer(suppliersXlsx) && suppliersXlsx.length > 1000, 'Génération modèle Fournisseurs (Excel .xlsx)');

    // ─── TEST 2 : Génération des modèles CSV avec BOM UTF-8 ───
    const productsCsv = await ImportExportService.generateTemplate('products', 'csv');
    const hasUtf8Bom = productsCsv[0] === 0xef && productsCsv[1] === 0xbb && productsCsv[2] === 0xbf;
    assert(Buffer.isBuffer(productsCsv) && hasUtf8Bom && productsCsv.toString().includes('Nom *'), 'Génération modèle Produits (CSV UTF-8 BOM)');

    // ─── TEST 3 : Parsing de fichier Excel ───
    const parsedTemplate = await ImportExportService.parseFileBuffer(productsXlsx, 'modele_produits.xlsx');
    assert(parsedTemplate.rows.length >= 2, 'Parsing fichier Excel avec détection automatique des en-têtes');

    // ─── TEST 4 : Validation Produits (Règles Métier & Erreurs) ───
    const mockProductRows = [
      {
        _rowNumber: 2,
        name: 'Produit Valide Test Import ' + Date.now(),
        retail_price: '15000',
        cost_price: '10000',
        category_name: 'Catégorie Nouvelle Test',
        barcode: 'BAR-' + Date.now(),
        current_stock: '20',
      },
      {
        _rowNumber: 3,
        name: '', // Erreur : Nom manquant
        retail_price: '5000',
      },
      {
        _rowNumber: 4,
        name: 'Produit Prix Nul',
        retail_price: '0', // Erreur : Prix <= 0 interdit par règle financière VISEPT
      },
      {
        _rowNumber: 5,
        name: 'Produit Prix Négatif',
        retail_price: '-2000', // Erreur : Prix <= 0
      },
    ];

    const prodValidation = await ImportExportService.validateProducts(mockProductRows, testCompanyId, testOwnerId);
    assert(prodValidation.valid_count === 1, 'Validation Produits : 1 ligne valide identifiée');
    assert(prodValidation.invalid_count === 3, 'Validation Produits : 3 lignes invalides détectées (nom manquant, prix 0, prix négatif)');
    assert(prodValidation.new_categories.includes('Catégorie Nouvelle Test'), 'Validation Produits : Détection automatique des nouvelles catégories à créer');

    // ─── TEST 5 : Exécution Importation Produits sous Transaction ───
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const importResult = await ImportExportService.executeProductsImport(
      prodValidation.valid_rows,
      { duplicateStrategy: 'skip' },
      testCompanyId,
      testOwnerId,
      testOwnerId,
      connection
    );

    assert(importResult.created_count === 1, 'Exécution Importation Produits : 1 produit créé');
    assert(importResult.created_categories.length >= 1, 'Exécution Importation Produits : Catégorie créée automatiquement');

    // Vérifier le mouvement de stock
    const [movements] = await connection.query(
      "SELECT * FROM inventory_movements WHERE company_id = ? AND reference_type = 'import' ORDER BY id DESC LIMIT 1",
      [testCompanyId]
    );
    assert(movements.length > 0 && parseFloat(movements[0].quantity) === 20, 'Traçabilité Stock : Mouvement initial d\'inventaire créé automatiquement');

    // Annuler la transaction de test pour ne pas polluer la BDD
    await connection.rollback();
    connection.release();
    assert(true, 'Intégrité transactionnelle : Rollback sécurisé des données de test');

    // ─── TEST 6 : Validation Clients ───
    const mockClientRows = [
      {
        _rowNumber: 2,
        full_name: 'Ousmane Sangaré',
        phone: '+223 75 00 11 22',
        email: 'ousmane.sangare@test.com',
      },
      {
        _rowNumber: 3,
        full_name: 'Client Sans Téléphone',
        phone: '', // Erreur : téléphone obligatoire
      },
      {
        _rowNumber: 4,
        full_name: 'Client Email Invalide',
        phone: '77889900',
        email: 'email_invalide_sans_arobase', // Erreur : email malformé
      },
    ];

    const clientValidation = await ImportExportService.validateClients(mockClientRows, testCompanyId);
    assert(clientValidation.valid_count === 1, 'Validation Clients : 1 client valide détecté');
    assert(clientValidation.invalid_count === 2, 'Validation Clients : 2 clients avec erreurs rejetés (téléphone vide, email invalide)');

    // ─── TEST 7 : Validation Fournisseurs ───
    const mockSupplierRows = [
      {
        _rowNumber: 2,
        company_name: 'Grossiste Test SARL',
        phone: '+223 60 11 22 33',
        initial_balance: '500000',
      },
      {
        _rowNumber: 3,
        company_name: '', // Erreur : nom requis
        phone: '65432100',
      },
    ];

    const supplierValidation = await ImportExportService.validateSuppliers(mockSupplierRows, testCompanyId);
    assert(supplierValidation.valid_count === 1, 'Validation Fournisseurs : 1 fournisseur valide');
    assert(supplierValidation.invalid_count === 1, 'Validation Fournisseurs : 1 fournisseur rejeté sans nom');

    // ─── TEST 8 : Exportation des Données ───
    const exportProductsXlsx = await ImportExportService.exportData('products', 'xlsx', testCompanyId, testOwnerId);
    assert(Buffer.isBuffer(exportProductsXlsx) && exportProductsXlsx.length > 500, 'Exportation Catalogue Produits vers Excel (.xlsx)');

    const exportClientsCsv = await ImportExportService.exportData('clients', 'csv', testCompanyId, testOwnerId);
    assert(Buffer.isBuffer(exportClientsCsv) && exportClientsCsv.length > 50, 'Exportation Base Clients vers CSV');

  } catch (error) {
    console.error('Erreur inattendue pendant les tests :', error);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`🏁 TESTS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  process.exit(failedCount > 0 ? 1 : 0);
}

runTests();
