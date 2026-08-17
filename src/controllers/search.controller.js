const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/search?q=xxx&company_id=yyy
 *
 * Recherche globale pour les entreprises de type boutique (SHOP).
 * Effectue des requêtes SQL parallèles filtrées par company_id et RBAC.
 */
const globalSearch = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          results: [],
          total: 0,
        },
      });
    }

    const query = q.trim();
    const searchTerm = `%${query}%`;

    // 1. Vérifier que l'entreprise est bien de type boutique (SHOP)
    const [companyData] = await pool.query(
      `SELECT c.id, bt.code as business_type_code 
       FROM companies c
       JOIN business_types bt ON c.business_type_id = bt.id
       WHERE c.id = ?`,
      [companyId]
    );

    if (companyData.length === 0 || companyData[0].business_type_code !== 'SHOP') {
      return res.status(200).json({
        success: true,
        data: {
          results: [],
          total: 0,
        },
      });
    }

    // 2. Déterminer les permissions de l'utilisateur
    const isSuperAdmin = Boolean(req.user?.is_super_admin);
    let userPermissions = [];
    let isOwner = false;

    if (!isSuperAdmin) {
      const roleId = req.membership.role_id;
      if (roleId) {
        const [roleRows] = await pool.query(
          'SELECT is_system, name FROM roles WHERE id = ? AND company_id = ?',
          [roleId, companyId]
        );
        if (roleRows.length > 0) {
          if (roleRows[0].is_system && roleRows[0].name === 'Propriétaire') {
            isOwner = true;
          }
        }

        const [permRows] = await pool.query(
          `SELECT p.code FROM permissions p
           JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = ?`,
          [roleId]
        );
        userPermissions = permRows.map((r) => r.code);
      }
    }

    const hasPerm = (code) => isSuperAdmin || isOwner || userPermissions.includes(code);

    const searchPromises = [];

    // 1. PRODUITS (products.view)
    if (hasPerm('products.view')) {
      searchPromises.push(
        pool.query(
          `SELECT id, name, sku, barcode, retail_price, current_stock, image_url 
           FROM products 
           WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1
             AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
           ORDER BY (name LIKE ?) DESC, name ASC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm, searchTerm, `${query}%`]
        ).then(([rows]) =>
          rows.map((p) => ({
            type: 'product',
            typeLabel: 'Produit',
            id: p.id,
            title: p.name,
            subtitle: `${p.sku ? `SKU: ${p.sku} · ` : ''}${Number(p.retail_price).toLocaleString()} FCFA (Stock: ${p.current_stock})`,
            url: `/shop/products?search=${encodeURIComponent(p.name)}`,
            image: p.image_url || null,
          }))
        )
      );
    }

    // 2. CLIENTS (clients.view)
    if (hasPerm('clients.view')) {
      searchPromises.push(
        pool.query(
          `SELECT id, full_name, phone, email, current_debt 
           FROM clients 
           WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1
             AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)
           ORDER BY (full_name LIKE ?) DESC, full_name ASC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm, searchTerm, `${query}%`]
        ).then(([rows]) =>
          rows.map((c) => ({
            type: 'client',
            typeLabel: 'Client',
            id: c.id,
            title: c.full_name,
            subtitle: `📞 ${c.phone}${Number(c.current_debt) > 0 ? ` · Dette: ${Number(c.current_debt).toLocaleString()} FCFA` : ''}`,
            url: `/shop/clients/${c.id}`,
          }))
        )
      );
    }

    // 3. VENTES (sales.view)
    if (hasPerm('sales.view')) {
      searchPromises.push(
        pool.query(
          `SELECT s.id, s.sale_number, s.total_amount, s.payment_status, s.sale_date,
                  c.full_name as client_name
           FROM sales s
           LEFT JOIN clients c ON s.client_id = c.id
           WHERE s.company_id = ?
             AND (s.sale_number LIKE ? OR c.full_name LIKE ?)
           ORDER BY s.id DESC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm]
        ).then(([rows]) =>
          rows.map((s) => ({
            type: 'sale',
            typeLabel: 'Vente',
            id: s.id,
            title: `Vente ${s.sale_number}`,
            subtitle: `${s.client_name ? `Client: ${s.client_name} · ` : ''}${Number(s.total_amount).toLocaleString()} FCFA (${new Date(s.sale_date).toLocaleDateString('fr-FR')})`,
            url: `/shop/sales/${s.id}`,
          }))
        )
      );
    }

    // 4. FOURNISSEURS (suppliers.view)
    if (hasPerm('suppliers.view')) {
      searchPromises.push(
        pool.query(
          `SELECT id, company_name, contact_name, phone, city 
           FROM suppliers 
           WHERE company_id = ? AND deleted_at IS NULL
             AND (company_name LIKE ? OR contact_name LIKE ? OR phone LIKE ?)
           ORDER BY (company_name LIKE ?) DESC, company_name ASC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm, searchTerm, `${query}%`]
        ).then(([rows]) =>
          rows.map((sup) => ({
            type: 'supplier',
            typeLabel: 'Fournisseur',
            id: sup.id,
            title: sup.company_name,
            subtitle: `${sup.contact_name ? `${sup.contact_name} · ` : ''}📞 ${sup.phone}${sup.city ? ` (${sup.city})` : ''}`,
            url: `/shop/suppliers/${sup.id}`,
          }))
        )
      );
    }

    // 5. COMMANDES FOURNISSEURS (purchases.view)
    if (hasPerm('purchases.view')) {
      searchPromises.push(
        pool.query(
          `SELECT so.id, so.order_number, so.total_amount, so.status, so.created_at,
                  s.company_name as supplier_name
           FROM supplier_orders so
           LEFT JOIN suppliers s ON so.supplier_id = s.id
           WHERE so.company_id = ?
             AND (so.order_number LIKE ? OR s.company_name LIKE ?)
           ORDER BY so.id DESC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm]
        ).then(([rows]) =>
          rows.map((o) => ({
            type: 'supplier_order',
            typeLabel: 'Cmd Fournisseur',
            id: o.id,
            title: `Commande ${o.order_number}`,
            subtitle: `${o.supplier_name ? `Fournisseur: ${o.supplier_name} · ` : ''}${Number(o.total_amount).toLocaleString()} FCFA`,
            url: `/shop/supplier-orders`,
          }))
        )
      );
    }

    // 6. DETTES (dashboard.view ou sales.view)
    if (hasPerm('dashboard.view') || hasPerm('sales.view')) {
      searchPromises.push(
        pool.query(
          `SELECT cd.id, cd.total_amount, cd.remaining_amount, cd.status,
                  c.full_name as client_name, c.phone as client_phone
           FROM client_debts cd
           JOIN clients c ON cd.client_id = c.id
           WHERE cd.company_id = ?
             AND (c.full_name LIKE ? OR c.phone LIKE ?)
           ORDER BY cd.remaining_amount DESC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm]
        ).then(([rows]) =>
          rows.map((d) => ({
            type: 'debt',
            typeLabel: 'Dette',
            id: d.id,
            title: `Dette - ${d.client_name}`,
            subtitle: `Reste: ${Number(d.remaining_amount).toLocaleString()} FCFA / Total: ${Number(d.total_amount).toLocaleString()} FCFA`,
            url: `/shop/debts/${d.id}`,
          }))
        )
      );
    }

    // 7. DÉPENSES (dashboard.view)
    if (hasPerm('dashboard.view')) {
      searchPromises.push(
        pool.query(
          `SELECT id, title, amount, category, expense_date 
           FROM expenses 
           WHERE company_id = ? AND deleted_at IS NULL
             AND (title LIKE ? OR description LIKE ?)
           ORDER BY expense_date DESC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm]
        ).then(([rows]) =>
          rows.map((e) => ({
            type: 'expense',
            typeLabel: 'Dépense',
            id: e.id,
            title: e.title,
            subtitle: `${Number(e.amount).toLocaleString()} FCFA (${new Date(e.expense_date).toLocaleDateString('fr-FR')})`,
            url: `/shop/expenses?search=${encodeURIComponent(e.title)}`,
          }))
        )
      );
    }

    // 8. RETOURS PRODUITS (sales.view)
    if (hasPerm('sales.view')) {
      searchPromises.push(
        pool.query(
          `SELECT sr.id, sr.return_number, sr.total_amount_returned, sr.created_at,
                  s.sale_number
           FROM sale_returns sr
           LEFT JOIN sales s ON sr.sale_id = s.id
           WHERE sr.company_id = ?
             AND (sr.return_number LIKE ? OR s.sale_number LIKE ?)
           ORDER BY sr.id DESC 
           LIMIT 5`,
          [companyId, searchTerm, searchTerm]
        ).then(([rows]) =>
          rows.map((r) => ({
            type: 'return',
            typeLabel: 'Retour Produit',
            id: r.id,
            title: `Retour ${r.return_number}`,
            subtitle: `${r.sale_number ? `Vente: ${r.sale_number} · ` : ''}Remboursé: ${Number(r.total_amount_returned || 0).toLocaleString()} FCFA`,
            url: `/shop/returns`,
          }))
        )
      );
    }

    const searchResultsArrays = await Promise.all(searchPromises);
    const flattenedResults = searchResultsArrays.flat();

    res.status(200).json({
      success: true,
      data: {
        results: flattenedResults,
        total: flattenedResults.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
