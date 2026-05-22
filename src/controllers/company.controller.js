const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

// ─── CRÉER UNE ENTREPRISE ──────────────────────────────
const createCompany = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, country, city, address, phone, business_type_id } = req.body;

    // Générer le slug à partir du nom
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now()}`;

    // Générer l'UUID pour l'API publique
    const uuid = uuidv4();

    // URL du logo si uploadé
    let logoUrl = null;
    if (req.file) {
      logoUrl = `${req.protocol}://${req.get('host')}/uploads/companies/${req.file.filename}`;
    }

    // Créer l'entreprise
    const [companyResult] = await connection.query(
      `INSERT INTO companies (uuid, name, slug, description, logo_url, business_type_id, 
       subscription_plan_id, subscription_status, country, city, address, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'active', ?, ?, ?, ?, 1)`,
      [
        uuid,
        name,
        slug,
        description || null,
        logoUrl,
        business_type_id || 1,
        country || null,
        city || null,
        address || null,
        phone || null,
      ]
    );

    const companyId = companyResult.insertId;

    // Ajouter l'utilisateur comme OWNER
    await connection.query(
      `INSERT INTO memberships (user_id, company_id, role, is_active, joined_at)
       VALUES (?, ?, 'owner', 1, NOW())`,
      [req.user.id, companyId]
    );

    await connection.commit();

    // Récupérer l'entreprise créée
    const [companies] = await connection.query(
      'SELECT * FROM companies WHERE id = ?',
      [companyId]
    );

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès.',
      data: {
        company: companies[0],
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── LISTER MES ENTREPRISES ─────────────────────────────
const getMyCompanies = async (req, res, next) => {
  try {
    const [companies] = await pool.query(
      `SELECT c.*, m.role as my_role
       FROM companies c
       INNER JOIN memberships m ON c.id = m.company_id
       WHERE m.user_id = ? AND m.is_active = 1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: {
        companies,
        total: companies.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAILS D'UNE ENTREPRISE ───────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur est bien membre de cette entreprise
    const [companies] = await pool.query(
      `SELECT c.*, m.role as my_role
       FROM companies c
       INNER JOIN memberships m ON c.id = m.company_id
       WHERE c.id = ? AND m.user_id = ? AND m.is_active = 1 AND c.deleted_at IS NULL`,
      [id, req.user.id]
    );

    if (companies.length === 0) {
      throw new AppError('Entreprise introuvable ou accès non autorisé.', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        company: companies[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCompany, getMyCompanies, getCompanyById };