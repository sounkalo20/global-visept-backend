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

    // Vérifier si l'utilisateur a l'accès illimité
    const [userRows] = await connection.query('SELECT has_unlimited_access FROM users WHERE id = ?', [req.user.id]);
    const hasUnlimited = userRows[0]?.has_unlimited_access === 1;

    let initialPlanId = 1; // FREE par défaut

    if (hasUnlimited) {
      const [planRows] = await connection.query("SELECT id FROM subscription_plans WHERE code = 'UNLIMITED'");
      if (planRows.length > 0) {
        initialPlanId = planRows[0].id;
      }
    }

    // Créer l'entreprise
    const [companyResult] = await connection.query(
      `INSERT INTO companies (uuid, name, slug, description, logo_url, business_type_id, 
       subscription_plan_id, subscription_status, subscription_ends_at, country, city, address, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?, ?, 1)`,
      [
        uuid,
        name,
        slug,
        description || null,
        logoUrl,
        business_type_id || 1,
        initialPlanId,
        country || null,
        city || null,
        address || null,
        phone || null,
      ]
    );

    const companyId = companyResult.insertId;

    // --- RBAC: Créer les rôles par défaut pour la nouvelle entreprise ---
    const [ownerRoleRes] = await connection.query(
      "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, 1)",
      [companyId, 'Propriétaire', "Tous les droits sur l'entreprise"]
    );
    const ownerRoleId = ownerRoleRes.insertId;

    const [managerRoleRes] = await connection.query(
      "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, 1)",
      [companyId, 'Gérant', "Gestion complète sauf paramètres"]
    );
    const managerRoleId = managerRoleRes.insertId;

    const [cashierRoleRes] = await connection.query(
      "INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, 1)",
      [companyId, 'Caissier', "Encaissement et ventes uniquement"]
    );
    const cashierRoleId = cashierRoleRes.insertId;

    // Assigner toutes les permissions au Propriétaire
    const [allPerms] = await connection.query('SELECT id FROM permissions');
    if (allPerms.length > 0) {
      const ownerPerms = allPerms.map(p => [ownerRoleId, p.id]);
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [ownerPerms]);
    }

    // Assigner les permissions au Gérant (tout sauf settings et roles)
    const [managerPermsData] = await connection.query("SELECT id FROM permissions WHERE code NOT LIKE 'settings.%' AND code NOT LIKE 'roles.%'");
    if (managerPermsData.length > 0) {
      const managerPerms = managerPermsData.map(p => [managerRoleId, p.id]);
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [managerPerms]);
    }

    // Assigner les permissions au Caissier
    const [cashierPermsData] = await connection.query("SELECT id FROM permissions WHERE code IN ('dashboard.view', 'products.view', 'sales.view', 'sales.create', 'sales.print', 'sales.return')");
    if (cashierPermsData.length > 0) {
      const cashierPerms = cashierPermsData.map(p => [cashierRoleId, p.id]);
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [cashierPerms]);
    }

    // Ajouter l'utilisateur comme OWNER
    await connection.query(
      `INSERT INTO memberships (user_id, company_id, role, role_id, is_active, joined_at)
       VALUES (?, ?, 'owner', ?, 1, NOW())`,
      [req.user.id, companyId, ownerRoleId]
    );

    await connection.commit();

    // Récupérer l'entreprise créée
    const [companies] = await connection.query(
      'SELECT * FROM companies WHERE id = ?',
      [companyId]
    );

    const companyData = companies[0];
    companyData.my_role = 'owner';

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès.',
      data: {
        company: companyData,
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
// controllers/company.controller.js (REMPLACER getMyCompanies)

// ─── LISTER MES ENTREPRISES ─────────────────────────────
const getMyCompanies = async (req, res, next) => {
  try {
    const [companies] = await pool.query(
      `SELECT 
        c.*,
        CASE 
          WHEN r.name = 'Propriétaire' THEN 'owner' 
          WHEN r.name = 'Gérant' THEN 'manager' 
          WHEN r.name = 'Caissier' THEN 'cashier' 
          ELSE COALESCE(m.role, r.name) 
        END as my_role,
        r.name as role_name,
        m.role_id,
        m.joined_at as my_joined_at,
        bt.code as business_type_code,
        bt.name as business_type_name,
        bt.icon as business_type_icon,
        sp.id as plan_id,
        sp.code as plan_code,
        sp.name as plan_name,
        sp.price_monthly,
        sp.price_yearly,
        sp.features as plan_features,
        sp.max_employees,
        sp.max_products,
        sp.max_clients,
        -- Stats
        (SELECT COUNT(*) FROM memberships WHERE company_id = c.id AND is_active = 1) as total_members,
        (SELECT COUNT(*) FROM products WHERE company_id = c.id AND deleted_at IS NULL) as total_products,
        (SELECT COUNT(*) FROM clients WHERE company_id = c.id AND deleted_at IS NULL) as total_clients,
        (SELECT COUNT(*) FROM suppliers WHERE company_id = c.id AND deleted_at IS NULL) as total_suppliers,
        (SELECT COUNT(*) FROM sales WHERE company_id = c.id) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE company_id = c.id AND status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM expenses WHERE company_id = c.id AND deleted_at IS NULL) as total_expenses,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = c.id AND deleted_at IS NULL) as total_expenses_amount,
        -- Dernière activité
        (SELECT MAX(sale_date) FROM sales WHERE company_id = c.id) as last_sale_at,
        (SELECT MAX(created_at) FROM expenses WHERE company_id = c.id AND deleted_at IS NULL) as last_expense_at,
        -- Dettes clients
        (SELECT COALESCE(SUM(current_debt), 0) FROM clients WHERE company_id = c.id AND deleted_at IS NULL) as total_client_debt,
        -- Dettes fournisseurs
        (SELECT COALESCE(SUM(current_balance), 0) FROM suppliers WHERE company_id = c.id AND deleted_at IS NULL) as total_supplier_debt,
        -- Commandes fournisseurs en cours
        (SELECT COUNT(*) FROM supplier_orders WHERE company_id = c.id AND status IN ('draft', 'ordered', 'confirmed', 'partially_received')) as pending_supplier_orders,
        -- Prochaine facture
        (SELECT si.period_end 
         FROM subscription_invoices si 
         WHERE si.company_id = c.id AND si.status = 'paid' 
         ORDER BY si.period_end DESC LIMIT 1) as subscription_next_billing,
        -- Paiements en attente de validation
        (SELECT COUNT(*) FROM subscription_payment_proofs WHERE company_id = c.id AND status = 'pending') as pending_payment_proofs,
        -- Dernière preuve de paiement
        (SELECT spp.status 
         FROM subscription_payment_proofs spp 
         WHERE spp.company_id = c.id 
         ORDER BY spp.created_at DESC LIMIT 1) as last_payment_proof_status
       FROM companies c
       INNER JOIN memberships m ON c.id = m.company_id
       LEFT JOIN roles r ON m.role_id = r.id
       JOIN business_types bt ON c.business_type_id = bt.id
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       WHERE m.user_id = ? AND m.is_active = 1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    // Parser les features JSON pour chaque company
    const companiesWithParsedFeatures = companies.map(company => ({
      ...company,
      plan_features: company.plan_features
        ? (typeof company.plan_features === 'string'
          ? JSON.parse(company.plan_features)
          : company.plan_features)
        : {},
    }));

    res.status(200).json({
      success: true,
      data: {
        companies: companiesWithParsedFeatures,
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
      `SELECT c.*, 
        CASE 
          WHEN r.name = 'Propriétaire' THEN 'owner' 
          WHEN r.name = 'Gérant' THEN 'manager' 
          WHEN r.name = 'Caissier' THEN 'cashier' 
          ELSE COALESCE(m.role, r.name) 
        END as my_role,
        r.name as role_name,
        m.role_id
       FROM companies c
       INNER JOIN memberships m ON c.id = m.company_id
       LEFT JOIN roles r ON m.role_id = r.id
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

// controllers/company.controller.js (AJOUTER ces fonctions)

// ─── MODIFIER UNE ENTREPRISE ────────────────────────────
const updateCompany = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, description, country, city, address, phone, business_type_id } = req.body;

    // Vérifier que l'utilisateur est owner ou manager de cette entreprise
    const [memberships] = await connection.query(
      `SELECT m.role, r.name as role_name FROM memberships m
       LEFT JOIN roles r ON m.role_id = r.id
       WHERE m.company_id = ? AND m.user_id = ? AND m.is_active = 1 AND (r.name IN ('Propriétaire', 'Gérant') OR m.role IN ('owner', 'manager'))`,
      [id, req.user.id]
    );

    if (memberships.length === 0) {
      throw new AppError('Vous n\'avez pas les droits pour modifier cette entreprise.', 403);
    }

    // Vérifier que l'entreprise existe
    const [companies] = await connection.query(
      'SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (companies.length === 0) {
      throw new AppError('Entreprise introuvable.', 404);
    }

    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = `${slugBase}-${Date.now()}`;
      updates.push('name = ?, slug = ?');
      values.push(name, slug);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }

    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country || null);
    }

    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city || null);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address || null);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }

    if (business_type_id !== undefined) {
      updates.push('business_type_id = ?');
      values.push(business_type_id);
    }

    // Gestion du logo
    if (req.file) {
      const logoUrl = `${req.protocol}://${req.get('host')}/uploads/companies/${req.file.filename}`;
      updates.push('logo_url = ?');
      values.push(logoUrl);
    }

    if (updates.length === 0) {
      throw new AppError('Aucune donnée à mettre à jour.', 400);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await connection.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();

    // Récupérer l'entreprise mise à jour
    const [updatedCompany] = await connection.query(
      `SELECT c.*, 
        CASE 
          WHEN r.name = 'Propriétaire' THEN 'owner' 
          WHEN r.name = 'Gérant' THEN 'manager' 
          WHEN r.name = 'Caissier' THEN 'cashier' 
          ELSE COALESCE(m.role, r.name) 
        END as my_role
       FROM companies c
       INNER JOIN memberships m ON c.id = m.company_id
       LEFT JOIN roles r ON m.role_id = r.id
       WHERE c.id = ? AND m.user_id = ?`,
      [id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Entreprise mise à jour avec succès.',
      data: {
        company: updatedCompany[0],
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── DEMANDER UN UPGRADE D'ABONNEMENT ──────────────────
const requestSubscriptionUpgrade = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { plan_id, payment_method, payment_reference, notes } = req.body;

    // Vérifier que l'utilisateur est owner
    const [memberships] = await connection.query(
      `SELECT m.role, r.name as role_name FROM memberships m
       LEFT JOIN roles r ON m.role_id = r.id
       WHERE m.company_id = ? AND m.user_id = ? AND m.is_active = 1 AND (r.name = 'Propriétaire' OR m.role = 'owner')`,
      [id, req.user.id]
    );

    if (memberships.length === 0) {
      throw new AppError("Seul le propriétaire peut changer d'abonnement.", 403);
    }

    // Vérifier que l'entreprise existe
    const [companies] = await connection.query(
      'SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (companies.length === 0) {
      throw new AppError('Entreprise introuvable.', 404);
    }

    const company = companies[0];

    // Vérifier que le plan existe et est actif
    const [plans] = await connection.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1',
      [plan_id]
    );

    if (plans.length === 0) {
      throw new AppError("Plan d'abonnement introuvable ou inactif.", 404);
    }

    const newPlan = plans[0];

    // Vérifier qu'on ne demande pas le même plan
    if (company.subscription_plan_id === newPlan.id && company.subscription_status === 'active') {
      throw new AppError("Vous êtes déjà sur ce plan d'abonnement.", 400);
    }

    // Vérifier que le plan supérieur est bien un upgrade
    if (newPlan.price_monthly <= 0) {
      // Passage au plan gratuit : pas besoin de paiement
      await connection.beginTransaction();

      await connection.query(
        'UPDATE companies SET subscription_plan_id = ?, subscription_status = ?, updated_at = NOW() WHERE id = ?',
        [newPlan.id, 'active', id]
      );

      await connection.commit();

      const [updatedCompany] = await connection.query(
        `SELECT c.*, sp.name as plan_name, sp.code as plan_code
         FROM companies c
         JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
         WHERE c.id = ?`,
        [id]
      );

      return res.status(200).json({
        success: true,
        message: 'Vous êtes passé au plan gratuit.',
        data: { company: updatedCompany[0] },
      });
    }

    // Pour un plan payant : vérifier la preuve de paiement
    if (!req.file) {
      throw new AppError('La preuve de paiement (capture/image) est requise pour un plan payant.', 400);
    }

    if (!payment_method) {
      throw new AppError('La méthode de paiement est requise.', 400);
    }

    await connection.beginTransaction();

    // 1. Créer une facture d'abonnement
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Calculer le montant (on prend le prix mensuel par défaut)
    const amount = newPlan.price_monthly;

    const [invoiceResult] = await connection.query(
      `INSERT INTO subscription_invoices (
        company_id, plan_id, amount, currency, status,
        payment_method, period_start, period_end
      ) VALUES (?, ?, ?, 'XOF', 'pending', ?, ?, ?)`,
      [
        id,
        newPlan.id,
        amount,
        payment_method,
        periodStart.toISOString().split('T')[0],
        periodEnd.toISOString().split('T')[0],
      ]
    );

    const invoiceId = invoiceResult.insertId;

    // 2. Enregistrer la preuve de paiement
    const proofUrl = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;

    await connection.query(
      `INSERT INTO subscription_payment_proofs (
        company_id, subscription_invoice_id, plan_id, amount,
        payment_method, payment_reference, proof_file_url,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        invoiceId,
        newPlan.id,
        amount,
        payment_method,
        payment_reference || null,
        proofUrl,
        notes || null,
      ]
    );

    // 3. Mettre à jour le statut de l'entreprise (en attente de validation)
    await connection.query(
      `UPDATE companies 
       SET subscription_plan_id = ?, 
           subscription_status = 'past_due',
           updated_at = NOW()
       WHERE id = ?`,
      [newPlan.id, id]
    );

    await connection.commit();

    // Récupérer les infos mises à jour
    const [updatedCompany] = await connection.query(
      `SELECT c.*, sp.name as plan_name, sp.code as plan_code
       FROM companies c
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       WHERE c.id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Votre demande de changement d\'abonnement a été soumise. Elle sera traitée par un administrateur.',
      data: {
        company: updatedCompany[0],
        invoice_id: invoiceId,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── RÉCUPÉRER L'HISTORIQUE DES FACTURES ────────────────
const getCompanyInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur est membre
    const [memberships] = await connection.query(
      'SELECT id FROM memberships WHERE company_id = ? AND user_id = ? AND is_active = 1',
      [id, req.user.id]
    );

    if (memberships.length === 0) {
      throw new AppError('Accès non autorisé.', 403);
    }

    const [invoices] = await connection.query(
      `SELECT si.*, sp.name as plan_name, sp.code as plan_code,
              spp.status as proof_status, spp.proof_file_url, spp.rejection_reason
       FROM subscription_invoices si
       JOIN subscription_plans sp ON si.plan_id = sp.id
       LEFT JOIN subscription_payment_proofs spp ON si.id = spp.subscription_invoice_id
       WHERE si.company_id = ?
       ORDER BY si.created_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    next(error);
  }
};

// ─── RÉCUPÉRER LES PREUVES DE PAIEMENT ──────────────────
const getPaymentProofs = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [memberships] = await pool.query(
      'SELECT id FROM memberships WHERE company_id = ? AND user_id = ? AND is_active = 1',
      [id, req.user.id]
    );

    if (memberships.length === 0) {
      throw new AppError('Accès non autorisé.', 403);
    }

    const [proofs] = await pool.query(
      `SELECT spp.*, sp.name as plan_name, sp.code as plan_code,
              si.period_start, si.period_end,
              u.first_name as reviewer_firstname, u.last_name as reviewer_lastname
       FROM subscription_payment_proofs spp
       JOIN subscription_plans sp ON spp.plan_id = sp.id
       LEFT JOIN subscription_invoices si ON spp.subscription_invoice_id = si.id
       LEFT JOIN users u ON spp.reviewed_by = u.id
       WHERE spp.company_id = ?
       ORDER BY spp.created_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: { proofs },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PARAMÈTRES DU REÇU (F19) ───────────────────────────
const defaultReceiptSettings = {
  show_logo: true,
  logo_url: null,
  header_text: "Merci de votre visite !",
  footer_text: "Les articles achetés ne sont ni repris ni échangés sauf accord préalable.",
  show_address: true,
  show_phone: true,
  show_seller_name: true,
  show_customer_name: true,
  show_qr: false,
  qr_content: "https://visept.app",
  paper_size: "80mm",
  font_size: "normal",
  show_payment_details: true,
  show_barcode: true,
  currency_symbol: "FCFA"
};

const getReceiptSettings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [companies] = await pool.query(
      'SELECT id, name, logo_url, address, phone, city, country, settings FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (companies.length === 0) {
      throw new AppError('Entreprise introuvable.', 404);
    }

    const company = companies[0];
    let settings = {};
    try {
      settings = typeof company.settings === 'string' ? JSON.parse(company.settings) : (company.settings || {});
    } catch (e) {
      settings = {};
    }

    const receiptConfig = {
      ...defaultReceiptSettings,
      logo_url: company.logo_url,
      ...(settings.receipt || {}),
    };

    res.status(200).json({
      success: true,
      data: {
        company_info: {
          id: company.id,
          name: company.name,
          address: company.address,
          city: company.city,
          country: company.country,
          phone: company.phone,
          logo_url: company.logo_url,
        },
        receipt: receiptConfig,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateReceiptSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    let newReceiptSettings = req.body;

    if (typeof newReceiptSettings === 'string') {
      try {
        newReceiptSettings = JSON.parse(newReceiptSettings);
      } catch (e) {
        newReceiptSettings = {};
      }
    }

    const [companies] = await pool.query(
      'SELECT settings, logo_url FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (companies.length === 0) {
      throw new AppError('Entreprise introuvable.', 404);
    }

    let existingSettings = {};
    try {
      existingSettings = typeof companies[0].settings === 'string'
        ? JSON.parse(companies[0].settings)
        : (companies[0].settings || {});
    } catch (e) {
      existingSettings = {};
    }

    // Convertir les chaînes 'true'/'false' en booléens si envoyés via FormData
    const parseBool = (val) => val === true || val === 'true';
    if (newReceiptSettings.show_logo !== undefined) newReceiptSettings.show_logo = parseBool(newReceiptSettings.show_logo);
    if (newReceiptSettings.show_address !== undefined) newReceiptSettings.show_address = parseBool(newReceiptSettings.show_address);
    if (newReceiptSettings.show_phone !== undefined) newReceiptSettings.show_phone = parseBool(newReceiptSettings.show_phone);
    if (newReceiptSettings.show_seller_name !== undefined) newReceiptSettings.show_seller_name = parseBool(newReceiptSettings.show_seller_name);
    if (newReceiptSettings.show_customer_name !== undefined) newReceiptSettings.show_customer_name = parseBool(newReceiptSettings.show_customer_name);
    if (newReceiptSettings.show_qr !== undefined) newReceiptSettings.show_qr = parseBool(newReceiptSettings.show_qr);
    if (newReceiptSettings.show_payment_details !== undefined) newReceiptSettings.show_payment_details = parseBool(newReceiptSettings.show_payment_details);

    // Gestion du logo personnalisé de reçu si uploadé
    let receiptLogoUrl = newReceiptSettings.logo_url || existingSettings?.receipt?.logo_url || companies[0].logo_url;
    if (req.file) {
      receiptLogoUrl = `${req.protocol}://${req.get('host')}/uploads/companies/${req.file.filename}`;
    }

    const mergedReceipt = {
      ...defaultReceiptSettings,
      ...(existingSettings.receipt || {}),
      ...newReceiptSettings,
      logo_url: receiptLogoUrl,
    };

    const updatedFullSettings = {
      ...existingSettings,
      receipt: mergedReceipt,
    };

    await pool.query(
      'UPDATE companies SET settings = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedFullSettings), id]
    );

    res.status(200).json({
      success: true,
      message: 'Paramètres du reçu mis à jour avec succès.',
      data: {
        receipt: mergedReceipt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getMyCompanies,
  getCompanyById,
  updateCompany,
  requestSubscriptionUpgrade,
  getCompanyInvoices,
  getPaymentProofs,
  getReceiptSettings,
  updateReceiptSettings,
};