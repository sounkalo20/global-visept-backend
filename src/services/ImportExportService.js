const ExcelJS = require('exceljs');
const pool = require('../config/db');
const ProductCatalogService = require('./ProductCatalogService');

/**
 * Normalisation de clé de colonne (ex: "Nom du produit *" -> "nom")
 */
function normalizeHeaderKey(header) {
  if (!header) return '';
  return header
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprimer les accents
    .replace(/[\*\(].*?[\)\*]/g, '') // supprimer (*) ou (...)
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * Mapping des alias de colonnes vers les clés internes
 */
const COLUMN_ALIASES = {
  // Produits
  nom: 'name',
  nom_produit: 'name',
  nom_du_produit: 'name',
  designation: 'name',
  libelle: 'name',
  prix_vente: 'retail_price',
  prix_de_vente: 'retail_price',
  prix_detail: 'retail_price',
  prix_d_achat: 'cost_price',
  prix_achat: 'cost_price',
  cout_achat: 'cost_price',
  prix_gros: 'wholesale_price',
  prix_de_gros: 'wholesale_price',
  qte_min_gros: 'wholesale_min_qty',
  quantite_min_gros: 'wholesale_min_qty',
  quantite_minimale_gros: 'wholesale_min_qty',
  categorie: 'category_name',
  code_barre: 'barcode',
  code_barres: 'barcode',
  barcode: 'barcode',
  sku: 'sku',
  reference: 'sku',
  ref: 'sku',
  unite: 'unit_name',
  unite_de_mesure: 'unit_name',
  stock_boutique: 'current_stock',
  stock: 'current_stock',
  stock_initial: 'current_stock',
  quantite: 'current_stock',
  seuil_alerte: 'low_stock_threshold',
  seuil_alerte_stock: 'low_stock_threshold',
  stock_alerte: 'low_stock_threshold',
  nom_entrepot: 'warehouse_name',
  entrepot: 'warehouse_name',
  stock_entrepot: 'warehouse_stock',
  description: 'description',
  notes: 'description',

  // Clients
  nom_complet: 'full_name',
  prenom: 'first_name',
  prenom_nom: 'full_name',
  telephone: 'phone',
  tel: 'phone',
  contact: 'phone',
  numero: 'phone',
  email: 'email',
  mail: 'email',
  courriel: 'email',
  adresse: 'address',
  ville: 'city',

  // Fournisseurs
  nom_entreprise: 'company_name',
  nom_fournisseur: 'company_name',
  entreprise: 'company_name',
  societe: 'company_name',
  fournisseur: 'company_name',
  nom_contact: 'contact_name',
  responsable: 'contact_name',
  pays: 'country',
  solde_initial: 'initial_balance',
  solde_initial_du: 'initial_balance',
  dette_initiale: 'initial_balance',
};

class ImportExportService {
  /**
   * ─────────────────────────────────────────────────────────────
   * 1. GÉNÉRATION DES MODÈLES OFFICIELS (EXCEL & CSV)
   * ─────────────────────────────────────────────────────────────
   */
  static async generateTemplate(moduleName, format = 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VISEPT Official Data System';
    workbook.created = new Date();

    if (moduleName === 'products') {
      this._buildProductsTemplate(workbook);
    } else if (moduleName === 'clients') {
      this._buildClientsTemplate(workbook);
    } else if (moduleName === 'suppliers') {
      this._buildSuppliersTemplate(workbook);
    } else {
      throw new Error(`Module '${moduleName}' non supporté pour les modèles d'importation.`);
    }

    if (format === 'csv') {
      const dataSheet = workbook.getWorksheet('Données') || workbook.worksheets[0];
      const csvBuffer = await workbook.csv.writeBuffer({ sheetId: dataSheet.id });
      // Ajouter le BOM UTF-8 pour ouverture correcte dans Excel Windows
      return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), csvBuffer]);
    } else {
      return await workbook.xlsx.writeBuffer();
    }
  }

  static _styleHeaderRow(row, bgHex = '1E3A8A') {
    row.height = 28;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgHex },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFF' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '0F172A' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } },
      };
    });
  }

  static _styleDataRows(sheet, startRow = 2) {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= startRow) {
        row.height = 22;
        row.eachCell((cell) => {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: '334155' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'F1F5F9' } },
            left: { style: 'thin', color: { argb: 'F1F5F9' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'F1F5F9' } },
          };
        });
      }
    });
  }

  static _buildProductsTemplate(workbook) {
    // ─── FEUILLE 1 : DONNÉES ───
    const dataSheet = workbook.addWorksheet('Données', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
    });

    dataSheet.columns = [
      { header: 'Nom *', key: 'name', width: 28 },
      { header: 'Prix de vente (FCFA) *', key: 'retail_price', width: 24 },
      { header: 'Prix d\'achat (FCFA)', key: 'cost_price', width: 20 },
      { header: 'Catégorie', key: 'category_name', width: 20 },
      { header: 'Code-barres', key: 'barcode', width: 20 },
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'Unité', key: 'unit_name', width: 14 },
      { header: 'Stock boutique', key: 'current_stock', width: 16 },
      { header: 'Seuil alerte stock', key: 'low_stock_threshold', width: 18 },
      { header: 'Prix de gros (FCFA)', key: 'wholesale_price', width: 20 },
      { header: 'Qté min. gros', key: 'wholesale_min_qty', width: 16 },
      { header: 'Nom Entrepôt', key: 'warehouse_name', width: 22 },
      { header: 'Stock Entrepôt', key: 'warehouse_stock', width: 16 },
      { header: 'Description', key: 'description', width: 32 },
    ];

    this._styleHeaderRow(dataSheet.getRow(1), '1E40AF');

    // Lignes d'exemples
    dataSheet.addRow({
      name: 'Smartphone Samsung Galaxy A14',
      retail_price: 110000,
      cost_price: 95000,
      category_name: 'Téléphones',
      barcode: '8806091234567',
      sku: 'SAM-A14-64G',
      unit_name: 'Pièce',
      current_stock: 15,
      low_stock_threshold: 3,
      wholesale_price: 105000,
      wholesale_min_qty: 3,
      warehouse_name: 'Entrepôt Central',
      warehouse_stock: 30,
      description: 'Samsung A14 64Go 4Go RAM Noir',
    });

    dataSheet.addRow({
      name: 'Chargeur Rapide 25W Type-C',
      retail_price: 7500,
      cost_price: 4000,
      category_name: 'Accessoires',
      barcode: '6934177701234',
      sku: 'CHG-25W-TYPC',
      unit_name: 'Pièce',
      current_stock: 50,
      low_stock_threshold: 10,
      wholesale_price: 6000,
      wholesale_min_qty: 5,
      warehouse_name: '',
      warehouse_stock: 0,
      description: 'Adaptateur secteur USB-C charge rapide',
    });

    this._styleDataRows(dataSheet, 2);

    // ─── FEUILLE 2 : INSTRUCTIONS ───
    const instSheet = workbook.addWorksheet('Instructions');
    instSheet.columns = [
      { header: 'Colonne', key: 'col', width: 25 },
      { header: 'Statut', key: 'status', width: 16 },
      { header: 'Type / Format attendu', key: 'format', width: 28 },
      { header: 'Description & Règles Métier VISEPT', key: 'desc', width: 55 },
    ];
    this._styleHeaderRow(instSheet.getRow(1), '0F172A');

    const instructions = [
      { col: 'Nom *', status: 'OBLIGATOIRE', format: 'Texte (2 - 200 car.)', desc: 'Nom unique du produit dans votre boutique. Créé aussi dans le Catalogue Global.' },
      { col: 'Prix de vente (FCFA) *', status: 'OBLIGATOIRE', format: 'Nombre > 0', desc: 'Prix de vente au détail. STRICTEMENT supérieur à 0 FCFA (Règle VISEPT).' },
      { col: 'Prix d\'achat (FCFA)', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Prix de revient ou d\'achat auprès du fournisseur (par défaut 0).' },
      { col: 'Catégorie', status: 'Facultatif', format: 'Texte', desc: 'Nom de la catégorie. Si elle n\'existe pas encore, elle sera créée automatiquement.' },
      { col: 'Code-barres', status: 'Facultatif', format: 'Chiffres / Alphanumérique', desc: 'Code EAN-13, UPC ou personnalisé. Utilisé pour le scanner et le Catalogue Global.' },
      { col: 'SKU', status: 'Facultatif', format: 'Alphanumérique', desc: 'Référence interne unique de votre boutique.' },
      { col: 'Unité', status: 'Facultatif', format: 'Pièce, kg, g, L, ml, m', desc: 'Unité de mesure du produit (par défaut "Pièce").' },
      { col: 'Stock boutique', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Quantité initiale en boutique. Enregistre un mouvement d\'inventaire officiel.' },
      { col: 'Seuil alerte stock', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Niveau de stock déclenchant l\'alerte de réapprovisionnement (défaut 10).' },
      { col: 'Prix de gros (FCFA)', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Prix remisé appliqué à partir de la quantité minimum de gros.' },
      { col: 'Qté min. gros', status: 'Facultatif', format: 'Entier ≥ 1', desc: 'Nombre minimal d\'unités pour bénéficier du prix de gros (défaut 1).' },
      { col: 'Nom Entrepôt', status: 'Facultatif', format: 'Texte', desc: 'Nom exact d\'un de vos entrepôts pour y injecter du stock centralisé.' },
      { col: 'Stock Entrepôt', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Quantité stockée dans l\'entrepôt spécifié (mouvement de stock créé).' },
      { col: 'Description', status: 'Facultatif', format: 'Texte libre', desc: 'Détails complémentaires ou spécifications du produit.' },
    ];

    instructions.forEach(ins => instSheet.addRow(ins));
    this._styleDataRows(instSheet, 2);
  }

  static _buildClientsTemplate(workbook) {
    const dataSheet = workbook.addWorksheet('Données', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
    });

    dataSheet.columns = [
      { header: 'Nom complet *', key: 'full_name', width: 28 },
      { header: 'Téléphone *', key: 'phone', width: 22 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Ville', key: 'city', width: 20 },
      { header: 'Notes', key: 'notes', width: 32 },
    ];

    this._styleHeaderRow(dataSheet.getRow(1), '1E40AF');

    dataSheet.addRow({
      full_name: 'Mamadou Traoré',
      phone: '+223 70 11 22 33',
      email: 'mamadou.traore@example.com',
      address: 'Hamdallaye ACI 2000',
      ville: 'Bamako',
      notes: 'Client fidèle',
    });

    dataSheet.addRow({
      full_name: 'Fatoumata Coulibaly',
      phone: '76451289',
      email: '',
      address: 'Badalabougou Rue 12',
      ville: 'Bamako',
      notes: 'Grossiste occasionnel',
    });

    this._styleDataRows(dataSheet, 2);

    const instSheet = workbook.addWorksheet('Instructions');
    instSheet.columns = [
      { header: 'Colonne', key: 'col', width: 25 },
      { header: 'Statut', key: 'status', width: 16 },
      { header: 'Format attendu', key: 'format', width: 25 },
      { header: 'Règles & Explications', key: 'desc', width: 55 },
    ];
    this._styleHeaderRow(instSheet.getRow(1), '0F172A');

    [
      { col: 'Nom complet *', status: 'OBLIGATOIRE', format: 'Texte (min. 2 car.)', desc: 'Nom et prénom du client ou nom d\'entreprise cliente.' },
      { col: 'Téléphone *', status: 'OBLIGATOIRE', format: 'Numéro de téléphone', desc: 'Identifiant unique du client au sein de votre boutique.' },
      { col: 'Email', status: 'Facultatif', format: 'Email valide (nom@domaine.com)', desc: 'Adresse email pour envoi des reçus et factures.' },
      { col: 'Adresse', status: 'Facultatif', format: 'Texte', desc: 'Quartier, rue, porte ou indications de livraison.' },
      { col: 'Ville', status: 'Facultatif', format: 'Texte', desc: 'Ville de résidence du client (ex: Bamako, Abidjan).' },
      { col: 'Notes', status: 'Facultatif', format: 'Texte libre', desc: 'Remarques internes ou préférences du client.' },
    ].forEach(ins => instSheet.addRow(ins));
    this._styleDataRows(instSheet, 2);
  }

  static _buildSuppliersTemplate(workbook) {
    const dataSheet = workbook.addWorksheet('Données', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
    });

    dataSheet.columns = [
      { header: 'Nom Entreprise *', key: 'company_name', width: 28 },
      { header: 'Téléphone *', key: 'phone', width: 22 },
      { header: 'Nom Contact', key: 'contact_name', width: 24 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Ville', key: 'city', width: 20 },
      { header: 'Pays', key: 'country', width: 18 },
      { header: 'Solde initial dû (FCFA)', key: 'initial_balance', width: 24 },
      { header: 'Notes', key: 'notes', width: 32 },
    ];

    this._styleHeaderRow(dataSheet.getRow(1), '1E40AF');

    dataSheet.addRow({
      company_name: 'Distributeur Électro Mali',
      phone: '+223 66 77 88 99',
      contact_name: 'Bakary Diakité',
      email: 'contact@electromali.com',
      address: 'Zone Industrielle',
      ville: 'Bamako',
      country: 'Mali',
      initial_balance: 0,
      notes: 'Fournisseur d\'accessoires téléphoniques',
    });

    this._styleDataRows(dataSheet, 2);

    const instSheet = workbook.addWorksheet('Instructions');
    instSheet.columns = [
      { header: 'Colonne', key: 'col', width: 25 },
      { header: 'Statut', key: 'status', width: 16 },
      { header: 'Format attendu', key: 'format', width: 25 },
      { header: 'Règles & Explications', key: 'desc', width: 55 },
    ];
    this._styleHeaderRow(instSheet.getRow(1), '0F172A');

    [
      { col: 'Nom Entreprise *', status: 'OBLIGATOIRE', format: 'Texte (min. 2 car.)', desc: 'Raison sociale ou nom du fournisseur.' },
      { col: 'Téléphone *', status: 'OBLIGATOIRE', format: 'Numéro de téléphone', desc: 'Numéro de contact principal du fournisseur.' },
      { col: 'Nom Contact', status: 'Facultatif', format: 'Texte', desc: 'Nom du commercial ou du représentant attitré.' },
      { col: 'Email', status: 'Facultatif', format: 'Email valide', desc: 'Email de contact du fournisseur.' },
      { col: 'Adresse', status: 'Facultatif', format: 'Texte', desc: 'Adresse physique ou siège social.' },
      { col: 'Ville', status: 'Facultatif', format: 'Texte', desc: 'Ville du fournisseur.' },
      { col: 'Pays', status: 'Facultatif', format: 'Texte (défaut Mali)', desc: 'Pays du fournisseur.' },
      { col: 'Solde initial dû (FCFA)', status: 'Facultatif', format: 'Nombre ≥ 0', desc: 'Montant déjà dû au fournisseur à la reprise des comptes.' },
      { col: 'Notes', status: 'Facultatif', format: 'Texte libre', desc: 'Conditions de livraison, délais ou accords.' },
    ].forEach(ins => instSheet.addRow(ins));
    this._styleDataRows(instSheet, 2);
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * 2. PARSING UNIVERSEL DES FICHIERS (EXCEL & CSV)
   * ─────────────────────────────────────────────────────────────
   */
  static async parseFileBuffer(buffer, originalFilename = '') {
    const isCsv = originalFilename.toLowerCase().endsWith('.csv');
    const workbook = new ExcelJS.Workbook();

    if (isCsv) {
      // Détecter le séparateur (, ou ; ou \t)
      const textContent = buffer.toString('utf-8');
      const firstLine = textContent.split(/\r?\n/)[0] || '';
      let delimiter = ',';
      if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = ';';
      } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = '\t';
      }

      await workbook.csv.read(require('stream').Readable.from(buffer), {
        parserOptions: { delimiter },
      });
    } else {
      await workbook.xlsx.load(buffer);
    }

    // Récupérer la première feuille de données
    const sheet = workbook.getWorksheet('Données') || workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 1) {
      throw new Error('Le fichier envoyé est vide ou ne contient aucune feuille de données valide.');
    }

    const headerRow = sheet.getRow(1);
    const headers = [];
    const headerMapping = {};

    headerRow.eachCell((cell, colNumber) => {
      const rawHeader = cell.value ? cell.value.toString().trim() : '';
      const normalizedKey = normalizeHeaderKey(rawHeader);
      const mappedKey = COLUMN_ALIASES[normalizedKey] || normalizedKey;
      headers[colNumber] = { raw: rawHeader, key: mappedKey };
      headerMapping[mappedKey] = colNumber;
    });

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Ignorer l'en-tête
      const rowData = { _rowNumber: rowNumber };
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerInfo = headers[colNumber];
        if (headerInfo && headerInfo.key) {
          let val = cell.value;
          // Si le cell contient un objet riche ou une formule
          if (val && typeof val === 'object') {
            if (val.result !== undefined) val = val.result;
            else if (val.text !== undefined) val = val.text;
          }
          if (typeof val === 'string') val = val.trim();
          rowData[headerInfo.key] = val !== undefined && val !== null ? val : '';
          if (val !== '' && val !== null && val !== undefined) {
            hasData = true;
          }
        }
      });

      if (hasData) {
        rows.push(rowData);
      }
    });

    return { rows, headers: Object.keys(headerMapping) };
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * 3. MOTEURS DE VALIDATION (DRY-RUN)
   * ─────────────────────────────────────────────────────────────
   */

  /**
   * Validation Produits
   */
  static async validateProducts(parsedRows, companyId, ownerId, connection = pool) {
    // 1. Charger le contexte existant
    const [existingProducts] = await connection.query(
      `SELECT id, name, barcode, sku FROM products WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    const [existingCategories] = await connection.query(
      `SELECT id, name FROM categories WHERE owner_id = ? AND deleted_at IS NULL`,
      [ownerId]
    );

    const [units] = await connection.query(`SELECT id, code, name, symbol FROM measurement_units`);

    const [warehouses] = await connection.query(
      `SELECT id, name FROM warehouses WHERE owner_id = ? AND status = 'active'`,
      [ownerId]
    );

    const existingNamesMap = new Map();
    const existingBarcodesMap = new Map();
    const existingSkusMap = new Map();

    existingProducts.forEach((p) => {
      if (p.name) existingNamesMap.set(p.name.toLowerCase().trim(), p.id);
      if (p.barcode) existingBarcodesMap.set(p.barcode.trim(), p.id);
      if (p.sku) existingSkusMap.set(p.sku.toLowerCase().trim(), p.id);
    });

    const categoryMap = new Map();
    existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));

    const unitMap = new Map();
    units.forEach((u) => {
      unitMap.set(u.name.toLowerCase().trim(), u.id);
      unitMap.set(u.code.toLowerCase().trim(), u.id);
      unitMap.set(u.symbol.toLowerCase().trim(), u.id);
    });

    const warehouseMap = new Map();
    warehouses.forEach((w) => warehouseMap.set(w.name.toLowerCase().trim(), w.id));

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const newCategoriesToCreate = new Set();

    // Vérifier les doublons intra-fichier
    const fileNamesSeen = new Set();
    const fileBarcodesSeen = new Set();

    for (const row of parsedRows) {
      const lineErrors = [];
      const lineWarnings = [];
      const rowNum = row._rowNumber;

      // a. Validation du Nom
      const name = (row.name || '').toString().trim();
      if (!name || name.length < 2) {
        lineErrors.push({
          column: 'Nom *',
          value: name,
          message: 'Le nom du produit est obligatoire (min. 2 caractères).',
        });
      }

      // b. Validation du Prix de vente (Règle VISEPT : > 0 FCFA)
      const rawRetailPrice = row.retail_price;
      const retailPrice = parseFloat(rawRetailPrice);
      if (rawRetailPrice === undefined || rawRetailPrice === '' || isNaN(retailPrice) || retailPrice <= 0) {
        lineErrors.push({
          column: 'Prix de vente (FCFA) *',
          value: rawRetailPrice,
          message: 'Le prix de vente est obligatoire et doit être strictement supérieur à 0 FCFA.',
        });
      }

      // c. Validation du Prix d'achat
      let costPrice = 0;
      if (row.cost_price !== undefined && row.cost_price !== '') {
        costPrice = parseFloat(row.cost_price);
        if (isNaN(costPrice) || costPrice < 0) {
          lineErrors.push({
            column: 'Prix d\'achat (FCFA)',
            value: row.cost_price,
            message: 'Le prix d\'achat doit être un nombre positif ou nul.',
          });
        }
      }

      // d. Validation du Code-barres
      const barcode = row.barcode ? row.barcode.toString().trim() : null;
      if (barcode) {
        if (fileBarcodesSeen.has(barcode)) {
          lineErrors.push({
            column: 'Code-barres',
            value: barcode,
            message: 'Ce code-barres apparaît plusieurs fois dans votre fichier.',
          });
        }
        fileBarcodesSeen.add(barcode);
      }

      // e. Validation de l'Unité
      let unitId = 1;
      const unitName = (row.unit_name || '').toString().trim();
      if (unitName) {
        const foundUnitId = unitMap.get(unitName.toLowerCase());
        if (foundUnitId) {
          unitId = foundUnitId;
        } else {
          lineWarnings.push({
            column: 'Unité',
            value: unitName,
            message: `Unité '${unitName}' inconnue. L'unité 'Pièce' sera attribuée par défaut.`,
          });
        }
      }

      // f. Validation de la Catégorie
      const categoryName = (row.category_name || '').toString().trim();
      let categoryId = null;
      if (categoryName) {
        categoryId = categoryMap.get(categoryName.toLowerCase()) || null;
        if (!categoryId) {
          newCategoriesToCreate.add(categoryName);
          lineWarnings.push({
            column: 'Catégorie',
            value: categoryName,
            message: `La catégorie '${categoryName}' n'existe pas encore et sera créée automatiquement.`,
          });
        }
      }

      // g. Validation des stocks boutique & entrepôt
      let currentStock = 0;
      if (row.current_stock !== undefined && row.current_stock !== '') {
        currentStock = parseFloat(row.current_stock);
        if (isNaN(currentStock) || currentStock < 0) {
          lineErrors.push({
            column: 'Stock boutique',
            value: row.current_stock,
            message: 'Le stock boutique doit être un nombre supérieur ou égal à 0.',
          });
        }
      }

      let lowStockThreshold = 10;
      if (row.low_stock_threshold !== undefined && row.low_stock_threshold !== '') {
        lowStockThreshold = parseFloat(row.low_stock_threshold);
        if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
          lowStockThreshold = 10;
        }
      }

      let wholesalePrice = 0;
      if (row.wholesale_price !== undefined && row.wholesale_price !== '') {
        wholesalePrice = parseFloat(row.wholesale_price);
        if (isNaN(wholesalePrice) || wholesalePrice < 0) {
          lineErrors.push({
            column: 'Prix de gros (FCFA)',
            value: row.wholesale_price,
            message: 'Le prix de gros doit être un nombre positif ou nul.',
          });
        }
      }

      let wholesaleMinQty = 1;
      if (row.wholesale_min_qty !== undefined && row.wholesale_min_qty !== '') {
        wholesaleMinQty = parseInt(row.wholesale_min_qty, 10);
        if (isNaN(wholesaleMinQty) || wholesaleMinQty < 1) {
          wholesaleMinQty = 1;
        }
      }

      // Entrepôt
      const warehouseName = (row.warehouse_name || '').toString().trim();
      let warehouseId = null;
      let warehouseStock = 0;
      if (warehouseName) {
        warehouseId = warehouseMap.get(warehouseName.toLowerCase()) || null;
        if (!warehouseId) {
          lineErrors.push({
            column: 'Nom Entrepôt',
            value: warehouseName,
            message: `L'entrepôt '${warehouseName}' est introuvable parmi vos entrepôts actifs.`,
          });
        } else {
          warehouseStock = parseFloat(row.warehouse_stock || 0);
          if (isNaN(warehouseStock) || warehouseStock < 0) {
            lineErrors.push({
              column: 'Stock Entrepôt',
              value: row.warehouse_stock,
              message: 'Le stock d\'entrepôt doit être supérieur ou égal à 0.',
            });
          }
        }
      }

      // Détection des doublons en base (par nom ou par code-barres)
      let isDuplicate = false;
      let existingProductId = null;
      if (name && existingNamesMap.has(name.toLowerCase())) {
        isDuplicate = true;
        existingProductId = existingNamesMap.get(name.toLowerCase());
      } else if (barcode && existingBarcodesMap.has(barcode)) {
        isDuplicate = true;
        existingProductId = existingBarcodesMap.get(barcode);
      }

      const cleanItem = {
        _rowNumber: rowNum,
        name,
        retail_price: retailPrice,
        cost_price: costPrice,
        category_name: categoryName,
        category_id: categoryId,
        barcode: barcode || null,
        sku: row.sku ? row.sku.toString().trim() : null,
        unit_id: unitId,
        unit_name: unitName || 'Pièce',
        current_stock: currentStock,
        low_stock_threshold: lowStockThreshold,
        wholesale_price: wholesalePrice,
        wholesale_min_qty: wholesaleMinQty,
        warehouse_name: warehouseName || null,
        warehouse_id: warehouseId,
        warehouse_stock: warehouseStock,
        description: row.description || null,
        is_duplicate: isDuplicate,
        existing_product_id: existingProductId,
        errors: lineErrors,
        warnings: lineWarnings,
      };

      if (lineErrors.length > 0) {
        invalidRows.push(cleanItem);
      } else {
        if (isDuplicate) {
          duplicateRows.push(cleanItem);
        }
        validRows.push(cleanItem);
      }
    }

    return {
      module: 'products',
      total_rows: parsedRows.length,
      valid_count: validRows.length,
      invalid_count: invalidRows.length,
      duplicate_count: duplicateRows.length,
      new_categories_count: newCategoriesToCreate.size,
      new_categories: Array.from(newCategoriesToCreate),
      valid_rows: validRows,
      invalid_rows: invalidRows,
      duplicate_rows: duplicateRows,
    };
  }

  /**
   * Validation Clients
   */
  static async validateClients(parsedRows, companyId, connection = pool) {
    const [existingClients] = await connection.query(
      `SELECT id, phone, email, full_name FROM clients WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    const existingPhones = new Map();
    const existingEmails = new Map();

    existingClients.forEach((c) => {
      if (c.phone) existingPhones.set(c.phone.replace(/[^0-9+]/g, ''), c.id);
      if (c.email) existingEmails.set(c.email.toLowerCase().trim(), c.id);
    });

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const filePhonesSeen = new Set();

    for (const row of parsedRows) {
      const lineErrors = [];
      const lineWarnings = [];
      const rowNum = row._rowNumber;

      const fullName = (row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ')).trim();
      if (!fullName || fullName.length < 2) {
        lineErrors.push({
          column: 'Nom complet *',
          value: fullName,
          message: 'Le nom du client est obligatoire (min. 2 caractères).',
        });
      }

      const rawPhone = (row.phone || '').toString().trim();
      const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
      if (!cleanPhone || cleanPhone.length < 4) {
        lineErrors.push({
          column: 'Téléphone *',
          value: rawPhone,
          message: 'Un numéro de téléphone valide est obligatoire.',
        });
      } else {
        if (filePhonesSeen.has(cleanPhone)) {
          lineErrors.push({
            column: 'Téléphone *',
            value: rawPhone,
            message: 'Ce numéro de téléphone apparaît plusieurs fois dans votre fichier.',
          });
        }
        filePhonesSeen.add(cleanPhone);
      }

      const email = (row.email || '').toString().trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        lineErrors.push({
          column: 'Email',
          value: email,
          message: 'Format d\'adresse email invalide.',
        });
      }

      let isDuplicate = false;
      let existingClientId = null;
      if (cleanPhone && existingPhones.has(cleanPhone)) {
        isDuplicate = true;
        existingClientId = existingPhones.get(cleanPhone);
      } else if (email && existingEmails.has(email)) {
        isDuplicate = true;
        existingClientId = existingEmails.get(email);
      }

      const cleanItem = {
        _rowNumber: rowNum,
        full_name: fullName,
        phone: rawPhone,
        clean_phone: cleanPhone,
        email: email || null,
        address: row.address ? row.address.toString().trim() : null,
        city: row.city ? row.city.toString().trim() : null,
        notes: row.notes ? row.notes.toString().trim() : null,
        is_duplicate: isDuplicate,
        existing_client_id: existingClientId,
        errors: lineErrors,
        warnings: lineWarnings,
      };

      if (lineErrors.length > 0) {
        invalidRows.push(cleanItem);
      } else {
        if (isDuplicate) duplicateRows.push(cleanItem);
        validRows.push(cleanItem);
      }
    }

    return {
      module: 'clients',
      total_rows: parsedRows.length,
      valid_count: validRows.length,
      invalid_count: invalidRows.length,
      duplicate_count: duplicateRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      duplicate_rows: duplicateRows,
    };
  }

  /**
   * Validation Fournisseurs
   */
  static async validateSuppliers(parsedRows, companyId, connection = pool) {
    const [existingSuppliers] = await connection.query(
      `SELECT id, company_name, phone, email FROM suppliers WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    const existingPhones = new Map();
    const existingNames = new Map();

    existingSuppliers.forEach((s) => {
      if (s.phone) existingPhones.set(s.phone.replace(/[^0-9+]/g, ''), s.id);
      if (s.company_name) existingNames.set(s.company_name.toLowerCase().trim(), s.id);
    });

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const filePhonesSeen = new Set();

    for (const row of parsedRows) {
      const lineErrors = [];
      const lineWarnings = [];
      const rowNum = row._rowNumber;

      const companyName = (row.company_name || '').toString().trim();
      if (!companyName || companyName.length < 2) {
        lineErrors.push({
          column: 'Nom Entreprise *',
          value: companyName,
          message: 'Le nom de l\'entreprise fournisseur est obligatoire (min. 2 caractères).',
        });
      }

      const rawPhone = (row.phone || '').toString().trim();
      const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
      if (!cleanPhone || cleanPhone.length < 4) {
        lineErrors.push({
          column: 'Téléphone *',
          value: rawPhone,
          message: 'Un numéro de téléphone valide est obligatoire.',
        });
      } else {
        if (filePhonesSeen.has(cleanPhone)) {
          lineErrors.push({
            column: 'Téléphone *',
            value: rawPhone,
            message: 'Ce numéro de téléphone apparaît plusieurs fois dans le fichier.',
          });
        }
        filePhonesSeen.add(cleanPhone);
      }

      const email = (row.email || '').toString().trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        lineErrors.push({
          column: 'Email',
          value: email,
          message: 'Format d\'adresse email invalide.',
        });
      }

      let initialBalance = 0;
      if (row.initial_balance !== undefined && row.initial_balance !== '') {
        initialBalance = parseFloat(row.initial_balance);
        if (isNaN(initialBalance) || initialBalance < 0) {
          lineErrors.push({
            column: 'Solde initial dû',
            value: row.initial_balance,
            message: 'Le solde initial doit être un montant positif ou nul.',
          });
        }
      }

      let isDuplicate = false;
      let existingSupplierId = null;
      if (cleanPhone && existingPhones.has(cleanPhone)) {
        isDuplicate = true;
        existingSupplierId = existingPhones.get(cleanPhone);
      } else if (companyName && existingNames.has(companyName.toLowerCase())) {
        isDuplicate = true;
        existingSupplierId = existingNames.get(companyName.toLowerCase());
      }

      const cleanItem = {
        _rowNumber: rowNum,
        company_name: companyName,
        contact_name: row.contact_name ? row.contact_name.toString().trim() : null,
        phone: rawPhone,
        clean_phone: cleanPhone,
        email: email || null,
        address: row.address ? row.address.toString().trim() : null,
        city: row.city ? row.city.toString().trim() : null,
        country: row.country ? row.country.toString().trim() : 'Mali',
        initial_balance: initialBalance,
        notes: row.notes ? row.notes.toString().trim() : null,
        is_duplicate: isDuplicate,
        existing_supplier_id: existingSupplierId,
        errors: lineErrors,
        warnings: lineWarnings,
      };

      if (lineErrors.length > 0) {
        invalidRows.push(cleanItem);
      } else {
        if (isDuplicate) duplicateRows.push(cleanItem);
        validRows.push(cleanItem);
      }
    }

    return {
      module: 'suppliers',
      total_rows: parsedRows.length,
      valid_count: validRows.length,
      invalid_count: invalidRows.length,
      duplicate_count: duplicateRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      duplicate_rows: duplicateRows,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * 4. EXÉCUTION TRANSACTIONNELLE DES IMPORTS
   * ─────────────────────────────────────────────────────────────
   */

  /**
   * Exécution Import Produits
   */
  static async executeProductsImport(rows, options = {}, companyId, ownerId, userId, connection) {
    const { duplicateStrategy = 'skip' } = options; // 'skip' | 'update' | 'error'
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const createdCategories = [];

    // Cache des catégories
    const [existingCategories] = await connection.query(
      `SELECT id, name FROM categories WHERE owner_id = ? AND deleted_at IS NULL`,
      [ownerId]
    );
    const categoryMap = new Map();
    existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));

    for (const item of rows) {
      if (item.errors && item.errors.length > 0) {
        skippedCount++;
        continue;
      }

      // 1. Gérer la catégorie si renseignée
      let finalCategoryId = item.category_id || null;
      if (item.category_name && !finalCategoryId) {
        const catKey = item.category_name.toLowerCase().trim();
        if (categoryMap.has(catKey)) {
          finalCategoryId = categoryMap.get(catKey);
        } else {
          // Créer la catégorie automatiquement
          const catSlug = `${item.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
          const [catRes] = await connection.query(
            `INSERT INTO categories (owner_id, name, slug, is_active) VALUES (?, ?, ?, 1)`,
            [ownerId, item.category_name, catSlug]
          );
          finalCategoryId = catRes.insertId;
          categoryMap.set(catKey, finalCategoryId);
          createdCategories.push(item.category_name);
        }
      }

      // 2. Gestion des doublons
      if (item.is_duplicate) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateStrategy === 'update' && item.existing_product_id) {
          await connection.query(
            `UPDATE products SET 
              retail_price = ?,
              cost_price = ?,
              wholesale_price = ?,
              wholesale_min_qty = ?,
              category_id = COALESCE(?, category_id),
              description = COALESCE(?, description),
              low_stock_threshold = ?,
              updated_at = NOW()
             WHERE id = ? AND company_id = ?`,
            [
              item.retail_price,
              item.cost_price || 0,
              item.wholesale_price || 0,
              item.wholesale_min_qty || 1,
              finalCategoryId,
              item.description,
              item.low_stock_threshold || 10,
              item.existing_product_id,
              companyId,
            ]
          );
          updatedCount++;
          continue;
        } else if (duplicateStrategy === 'error') {
          throw new Error(`Le produit '${item.name}' existe déjà (Ligne #${item._rowNumber}).`);
        }
      }

      // 3. Catalogue Global
      let catalogProductId = null;
      if (ownerId) {
        const catalogProduct = await ProductCatalogService.findOrCreateCatalogProduct(
          ownerId,
          {
            name: item.name,
            barcode: item.barcode,
            description: item.description,
            unit_id: item.unit_id || 1,
            category_id: finalCategoryId,
          },
          connection
        );
        catalogProductId = catalogProduct.id;
      }

      // 4. Insérer dans `products`
      const slug = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const currentStock = parseFloat(item.current_stock) || 0;

      const [prodRes] = await connection.query(
        `INSERT INTO products (
          company_id, catalog_product_id, category_id, unit_id, name, slug, description,
          barcode, sku, cost_price, retail_price, wholesale_price,
          wholesale_min_qty, allow_custom_price, product_type, manage_stock,
          current_stock, low_stock_threshold, is_active, is_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'product', 1, ?, ?, 1, 1)`,
        [
          companyId,
          catalogProductId,
          finalCategoryId,
          item.unit_id || 1,
          item.name,
          slug,
          item.description,
          item.barcode,
          item.sku,
          item.cost_price || 0,
          item.retail_price,
          item.wholesale_price || 0,
          item.wholesale_min_qty || 1,
          currentStock,
          item.low_stock_threshold || 10,
        ]
      );

      const newProductId = prodRes.insertId;
      createdCount++;

      // 5. Mouvement de stock boutique initial
      if (currentStock > 0) {
        await connection.query(
          `INSERT INTO inventory_movements (
            company_id, product_id, movement_type, quantity, stock_before, stock_after,
            reference_type, unit_cost, note, performed_by
          ) VALUES (?, ?, 'adjustment', ?, 0, ?, 'import', ?, 'Stock initial lors de l\\'importation', ?)`,
          [companyId, newProductId, currentStock, currentStock, item.cost_price || 0, userId]
        );
      }

      // 6. Stock initial en Entrepôt si renseigné
      if (item.warehouse_id && item.warehouse_stock > 0 && catalogProductId) {
        await connection.query(
          `INSERT INTO warehouse_stocks (warehouse_id, catalog_product_id, quantity)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
          [item.warehouse_id, catalogProductId, item.warehouse_stock]
        );

        await connection.query(
          `INSERT INTO warehouse_movements (
            warehouse_id, catalog_product_id, movement_type, quantity, stock_before, stock_after,
            reference_type, performed_by, notes
          ) VALUES (?, ?, 'in_from_supplier', ?, 0, ?, 'import', ?, 'Stock initial Entrepôt via Importation')`,
          [item.warehouse_id, catalogProductId, item.warehouse_stock, item.warehouse_stock, userId]
        );
      }
    }

    return {
      module: 'products',
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      created_categories: createdCategories,
    };
  }

  /**
   * Exécution Import Clients
   */
  static async executeClientsImport(rows, options = {}, companyId, userId, connection) {
    const { duplicateStrategy = 'skip' } = options;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of rows) {
      if (item.errors && item.errors.length > 0) {
        skippedCount++;
        continue;
      }

      if (item.is_duplicate) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateStrategy === 'update' && item.existing_client_id) {
          await connection.query(
            `UPDATE clients SET 
              full_name = ?,
              email = COALESCE(?, email),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              notes = COALESCE(?, notes),
              updated_at = NOW()
             WHERE id = ? AND company_id = ?`,
            [
              item.full_name,
              item.email,
              item.address,
              item.city,
              item.notes,
              item.existing_client_id,
              companyId,
            ]
          );
          updatedCount++;
          continue;
        } else if (duplicateStrategy === 'error') {
          throw new Error(`Le client '${item.full_name}' existe déjà.`);
        }
      }

      await connection.query(
        `INSERT INTO clients (
          company_id, full_name, phone, email, address, city, notes, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          companyId,
          item.full_name,
          item.phone,
          item.email,
          item.address,
          item.city,
          item.notes,
        ]
      );
      createdCount++;
    }

    return {
      module: 'clients',
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
    };
  }

  /**
   * Exécution Import Fournisseurs
   */
  static async executeSuppliersImport(rows, options = {}, companyId, userId, connection) {
    const { duplicateStrategy = 'skip' } = options;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of rows) {
      if (item.errors && item.errors.length > 0) {
        skippedCount++;
        continue;
      }

      if (item.is_duplicate) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateStrategy === 'update' && item.existing_supplier_id) {
          await connection.query(
            `UPDATE suppliers SET 
              contact_name = COALESCE(?, contact_name),
              email = COALESCE(?, email),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              country = COALESCE(?, country),
              notes = COALESCE(?, notes),
              updated_at = NOW()
             WHERE id = ? AND company_id = ?`,
            [
              item.contact_name,
              item.email,
              item.address,
              item.city,
              item.country,
              item.notes,
              item.existing_supplier_id,
              companyId,
            ]
          );
          updatedCount++;
          continue;
        } else if (duplicateStrategy === 'error') {
          throw new Error(`Le fournisseur '${item.company_name}' existe déjà.`);
        }
      }

      await connection.query(
        `INSERT INTO suppliers (
          company_id, company_name, contact_name, phone, email,
          address, city, country, notes, current_balance, total_purchases, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [
          companyId,
          item.company_name,
          item.contact_name,
          item.phone,
          item.email,
          item.address,
          item.city,
          item.country || 'Mali',
          item.notes,
          item.initial_balance || 0,
        ]
      );
      createdCount++;
    }

    return {
      module: 'suppliers',
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * 5. MOTEURS D'EXPORTATION (EXCEL & CSV)
   * ─────────────────────────────────────────────────────────────
   */
  static async exportData(moduleName, format = 'xlsx', companyId, ownerId, connection = pool) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VISEPT Export Engine';
    workbook.created = new Date();

    if (moduleName === 'products') {
      const [products] = await connection.query(
        `SELECT p.*, c.name as category_name, u.name as unit_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN measurement_units u ON p.unit_id = u.id
         WHERE p.company_id = ? AND p.deleted_at IS NULL
         ORDER BY p.name ASC`,
        [companyId]
      );

      const sheet = workbook.addWorksheet('Produits', { views: [{ state: 'frozen', ySplit: 1 }] });
      sheet.columns = [
        { header: 'Nom', key: 'name', width: 28 },
        { header: 'Prix de vente (FCFA)', key: 'retail_price', width: 22 },
        { header: 'Prix d\'achat (FCFA)', key: 'cost_price', width: 20 },
        { header: 'Stock actuel', key: 'current_stock', width: 16 },
        { header: 'Catégorie', key: 'category_name', width: 20 },
        { header: 'Code-barres', key: 'barcode', width: 20 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Unité', key: 'unit_name', width: 14 },
        { header: 'Prix de gros (FCFA)', key: 'wholesale_price', width: 20 },
        { header: 'Qté min. gros', key: 'wholesale_min_qty', width: 16 },
        { header: 'Seuil alerte', key: 'low_stock_threshold', width: 16 },
        { header: 'Statut', key: 'status', width: 14 },
      ];

      this._styleHeaderRow(sheet.getRow(1), '1E3A8A');

      products.forEach((p) => {
        sheet.addRow({
          name: p.name,
          retail_price: parseFloat(p.retail_price) || 0,
          cost_price: parseFloat(p.cost_price) || 0,
          current_stock: parseFloat(p.current_stock) || 0,
          category_name: p.category_name || '-',
          barcode: p.barcode || '-',
          sku: p.sku || '-',
          unit_name: p.unit_name || 'Pièce',
          wholesale_price: parseFloat(p.wholesale_price) || 0,
          wholesale_min_qty: p.wholesale_min_qty || 1,
          low_stock_threshold: parseFloat(p.low_stock_threshold) || 10,
          status: p.is_active ? 'Actif' : 'Inactif',
        });
      });
      this._styleDataRows(sheet, 2);
    } else if (moduleName === 'clients') {
      const [clients] = await connection.query(
        `SELECT * FROM clients WHERE company_id = ? AND deleted_at IS NULL ORDER BY full_name ASC`,
        [companyId]
      );

      const sheet = workbook.addWorksheet('Clients', { views: [{ state: 'frozen', ySplit: 1 }] });
      sheet.columns = [
        { header: 'Nom complet', key: 'full_name', width: 28 },
        { header: 'Téléphone', key: 'phone', width: 22 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Adresse', key: 'address', width: 28 },
        { header: 'Ville', key: 'city', width: 20 },
        { header: 'Achats cumulés (FCFA)', key: 'total_purchases', width: 24 },
        { header: 'Dette actuelle (FCFA)', key: 'current_debt', width: 22 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];

      this._styleHeaderRow(sheet.getRow(1), '1E3A8A');

      clients.forEach((c) => {
        sheet.addRow({
          full_name: c.full_name,
          phone: c.phone,
          email: c.email || '-',
          address: c.address || '-',
          ville: c.city || '-',
          total_purchases: parseFloat(c.total_purchases) || 0,
          current_debt: parseFloat(c.current_debt) || 0,
          notes: c.notes || '-',
        });
      });
      this._styleDataRows(sheet, 2);
    } else if (moduleName === 'suppliers') {
      const [suppliers] = await connection.query(
        `SELECT * FROM suppliers WHERE company_id = ? AND deleted_at IS NULL ORDER BY company_name ASC`,
        [companyId]
      );

      const sheet = workbook.addWorksheet('Fournisseurs', { views: [{ state: 'frozen', ySplit: 1 }] });
      sheet.columns = [
        { header: 'Nom Entreprise', key: 'company_name', width: 28 },
        { header: 'Contact', key: 'contact_name', width: 24 },
        { header: 'Téléphone', key: 'phone', width: 22 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Adresse', key: 'address', width: 28 },
        { header: 'Ville', key: 'city', width: 20 },
        { header: 'Pays', key: 'country', width: 18 },
        { header: 'Solde dû (FCFA)', key: 'current_balance', width: 22 },
        { header: 'Achats totaux (FCFA)', key: 'total_purchases', width: 24 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];

      this._styleHeaderRow(sheet.getRow(1), '1E3A8A');

      suppliers.forEach((s) => {
        sheet.addRow({
          company_name: s.company_name,
          contact_name: s.contact_name || '-',
          phone: s.phone,
          email: s.email || '-',
          address: s.address || '-',
          ville: s.city || '-',
          country: s.country || 'Mali',
          current_balance: parseFloat(s.current_balance) || 0,
          total_purchases: parseFloat(s.total_purchases) || 0,
          notes: s.notes || '-',
        });
      });
      this._styleDataRows(sheet, 2);
    } else {
      throw new Error(`Export non supporté pour '${moduleName}'.`);
    }

    if (format === 'csv') {
      const csvBuffer = await workbook.csv.writeBuffer({ sheetId: workbook.worksheets[0].id });
      return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), csvBuffer]);
    } else {
      return await workbook.xlsx.writeBuffer();
    }
  }
}

module.exports = ImportExportService;
