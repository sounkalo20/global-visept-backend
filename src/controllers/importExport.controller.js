const pool = require('../config/db');
const AppError = require('../utils/AppError');
const ImportExportService = require('../services/ImportExportService');

/**
 * Récupère l'owner_id d'une entreprise
 */
const getOwnerId = async (companyId) => {
  const [rows] = await pool.query(
    "SELECT user_id FROM memberships WHERE company_id = ? AND role = 'owner' LIMIT 1",
    [companyId]
  );
  return rows.length > 0 ? rows[0].user_id : null;
};

// ─── 1. TÉLÉCHARGER LE MODÈLE OFFICIEL ─────────────────────
exports.getTemplate = async (req, res, next) => {
  try {
    const { module: moduleName } = req.params;
    const format = (req.query.format || 'xlsx').toLowerCase();

    if (!['products', 'clients', 'suppliers'].includes(moduleName)) {
      throw new AppError(`Module '${moduleName}' non reconnu pour le téléchargement de modèle.`, 400);
    }

    if (!['xlsx', 'csv'].includes(format)) {
      throw new AppError('Format invalide. Choisissez entre xlsx et csv.', 400);
    }

    const buffer = await ImportExportService.generateTemplate(moduleName, format);

    const ext = format === 'csv' ? 'csv' : 'xlsx';
    const contentType = format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const filename = `modele_import_visept_${moduleName}.${ext}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

// ─── 2. ANALYSE ET PRÉVISUALISATION (DRY-RUN) ──────────────
exports.previewImport = async (req, res, next) => {
  try {
    const { module: moduleName } = req.params;
    const companyId = req.company.id;
    const ownerId = await getOwnerId(companyId);

    if (!['products', 'clients', 'suppliers'].includes(moduleName)) {
      throw new AppError(`Module '${moduleName}' non supporté pour l'import.`, 400);
    }

    if (!req.file || !req.file.buffer) {
      throw new AppError('Aucun fichier fourni pour l\'importation.', 400);
    }

    // 1. Parsing du fichier
    const { rows, headers } = await ImportExportService.parseFileBuffer(
      req.file.buffer,
      req.file.originalname || ''
    );

    if (rows.length === 0) {
      throw new AppError('Le fichier ne contient aucune ligne de données exploitable.', 400);
    }

    // 2. Validation selon le module (Dry-Run)
    let validationResult;
    if (moduleName === 'products') {
      validationResult = await ImportExportService.validateProducts(rows, companyId, ownerId);
    } else if (moduleName === 'clients') {
      validationResult = await ImportExportService.validateClients(rows, companyId);
    } else if (moduleName === 'suppliers') {
      validationResult = await ImportExportService.validateSuppliers(rows, companyId);
    }

    res.status(200).json({
      success: true,
      message: 'Analyse terminée.',
      data: {
        detected_headers: headers,
        filename: req.file.originalname,
        ...validationResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. EXÉCUTION DE L'IMPORTATION TRANSACTIONNELLE ─────────
exports.executeImport = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { module: moduleName } = req.params;
    const { rows, duplicateStrategy = 'skip' } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;
    const ownerId = await getOwnerId(companyId);

    if (!['products', 'clients', 'suppliers'].includes(moduleName)) {
      throw new AppError(`Module '${moduleName}' non supporté.`, 400);
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new AppError('Aucune donnée valide à importer.', 400);
    }

    await connection.beginTransaction();

    let result;
    if (moduleName === 'products') {
      result = await ImportExportService.executeProductsImport(
        rows,
        { duplicateStrategy },
        companyId,
        ownerId,
        userId,
        connection
      );
    } else if (moduleName === 'clients') {
      result = await ImportExportService.executeClientsImport(
        rows,
        { duplicateStrategy },
        companyId,
        userId,
        connection
      );
    } else if (moduleName === 'suppliers') {
      result = await ImportExportService.executeSuppliersImport(
        rows,
        { duplicateStrategy },
        companyId,
        userId,
        connection
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Importation effectuée avec succès.',
      data: result,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── 4. EXPORTATION DES DONNÉES EN DIRECT ────────────────────
exports.exportData = async (req, res, next) => {
  try {
    const { module: moduleName } = req.params;
    const format = (req.query.format || 'xlsx').toLowerCase();
    const companyId = req.company.id;
    const ownerId = await getOwnerId(companyId);

    if (!['products', 'clients', 'suppliers'].includes(moduleName)) {
      throw new AppError(`Export non disponible pour le module '${moduleName}'.`, 400);
    }

    const buffer = await ImportExportService.exportData(moduleName, format, companyId, ownerId);

    const ext = format === 'csv' ? 'csv' : 'xlsx';
    const contentType = format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `export_visept_${moduleName}_${timestamp}.${ext}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};
