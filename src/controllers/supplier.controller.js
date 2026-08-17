// controllers/supplier.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// ─── CRÉER UN FOURNISSEUR ─────────────────────────────
const createSupplier = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const {
            company_name,
            contact_name,
            phone,
            email,
            address,
            city,
            country,
            notes,
            initial_balance = 0,
        } = req.body;
        const companyId = req.company.id;

        // Vérifier unicité du téléphone pour cette entreprise
        const [existingPhone] = await connection.query(
            'SELECT id FROM suppliers WHERE company_id = ? AND phone = ? AND deleted_at IS NULL',
            [companyId, phone]
        );

        if (existingPhone.length > 0) {
            throw new AppError(
                'Un fournisseur avec ce numéro de téléphone existe déjà dans votre entreprise.',
                409
            );
        }

        // Vérifier unicité de l'email si fourni
        if (email) {
            const [existingEmail] = await connection.query(
                'SELECT id FROM suppliers WHERE company_id = ? AND email = ? AND deleted_at IS NULL',
                [companyId, email]
            );

            if (existingEmail.length > 0) {
                throw new AppError(
                    'Un fournisseur avec cet email existe déjà dans votre entreprise.',
                    409
                );
            }
        }

        await connection.beginTransaction();

        // Insérer le fournisseur
        const [result] = await connection.query(
            `INSERT INTO suppliers (
        company_id, company_name, contact_name, phone, email,
        address, city, country, notes, current_balance, total_purchases, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                companyId,
                company_name,
                contact_name || null,
                phone,
                email || null,
                address || null,
                city || null,
                country || null,
                notes || null,
                initial_balance || 0,
                0,
            ]
        );

        // Si un solde initial est défini, créer un mouvement dans supplier_payments
        // ou simplement laisser le current_balance tel quel
        // (le current_balance représente ce qu'on doit au fournisseur)

        await connection.commit();

        // Récupérer le fournisseur créé
        const [suppliers] = await connection.query(
            'SELECT * FROM suppliers WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Fournisseur créé avec succès.',
            data: {
                supplier: suppliers[0],
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES FOURNISSEURS ───────────────────────────
const getSuppliers = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '', // 'active', 'inactive', 'with_debt'
            sort_by = 'created_at',
            sort_order = 'DESC',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allowedSortColumns = ['company_name', 'created_at', 'total_purchases', 'current_balance'];
        const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereConditions = ['s.company_id = ?', 's.deleted_at IS NULL'];
        let queryParams = [companyId];

        if (search) {
            whereConditions.push('(s.company_name LIKE ? OR s.contact_name LIKE ? OR s.phone LIKE ? OR s.city LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status === 'active') {
            whereConditions.push('s.is_active = 1');
        } else if (status === 'inactive') {
            whereConditions.push('s.is_active = 0');
        } else if (status === 'with_debt') {
            whereConditions.push('s.current_balance > 0');
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        // Requête avec comptage des commandes
        const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM supplier_orders so WHERE so.supplier_id = s.id) as total_orders,
        (SELECT COUNT(*) FROM supplier_orders so WHERE so.supplier_id = s.id AND so.status IN ('draft', 'ordered', 'confirmed')) as pending_orders
      FROM suppliers s
      ${whereClause}
      ORDER BY s.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

        queryParams.push(parseInt(limit), offset);

        const [suppliers] = await pool.query(query, queryParams);

        // Total pour pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM suppliers s
      ${whereClause}
    `;
        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                suppliers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    total_pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAIL D'UN FOURNISSEUR ───────────────────────────
const getSupplierById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        // Récupérer le fournisseur
        const [suppliers] = await pool.query(
            'SELECT * FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [id, companyId]
        );

        if (suppliers.length === 0) {
            throw new AppError('Fournisseur introuvable.', 404);
        }

        const supplier = suppliers[0];

        // Récupérer les commandes liées (10 dernières)
        const [orders] = await pool.query(
            `SELECT so.*,
              (SELECT COUNT(*) FROM supplier_order_items soi WHERE soi.supplier_order_id = so.id) as items_count
       FROM supplier_orders so
       WHERE so.supplier_id = ? AND so.company_id = ?
       ORDER BY so.created_at DESC
       LIMIT 10`,
            [id, companyId]
        );

        // Récupérer les paiements liés (10 derniers)
        const [payments] = await pool.query(
            `SELECT sp.*, u.first_name as paid_by_firstname, u.last_name as paid_by_lastname
       FROM supplier_payments sp
       LEFT JOIN users u ON sp.paid_by = u.id
       WHERE sp.supplier_id = ? AND sp.company_id = ?
       ORDER BY sp.payment_date DESC, sp.created_at DESC
       LIMIT 10`,
            [id, companyId]
        );

        // Statistiques
        const [stats] = await pool.query(
            `SELECT 
        COUNT(DISTINCT so.id) as total_orders,
        COALESCE(SUM(so.total_amount), 0) as total_purchases_amount,
        COALESCE(SUM(so.total_paid), 0) as total_paid,
        COALESCE(SUM(so.remaining_balance), 0) as total_remaining
       FROM supplier_orders so
       WHERE so.supplier_id = ? AND so.company_id = ? AND so.status != 'canceled'`,
            [id, companyId]
        );

        res.status(200).json({
            success: true,
            data: {
                supplier,
                stats: stats[0],
                recent_orders: orders,
                recent_payments: payments,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UN FOURNISSEUR ───────────────────────────
const updateSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const {
            company_name,
            contact_name,
            phone,
            email,
            address,
            city,
            country,
            notes,
            is_active,
        } = req.body;

        // Vérifier que le fournisseur existe et appartient à l'entreprise
        const [suppliers] = await pool.query(
            'SELECT * FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [id, companyId]
        );

        if (suppliers.length === 0) {
            throw new AppError('Fournisseur introuvable.', 404);
        }

        const supplier = suppliers[0];

        // Vérifier unicité du téléphone si modifié
        if (phone && phone !== supplier.phone) {
            const [existingPhone] = await pool.query(
                'SELECT id FROM suppliers WHERE company_id = ? AND phone = ? AND id != ? AND deleted_at IS NULL',
                [companyId, phone, id]
            );

            if (existingPhone.length > 0) {
                throw new AppError(
                    'Un fournisseur avec ce numéro de téléphone existe déjà dans votre entreprise.',
                    409
                );
            }
        }

        // Vérifier unicité de l'email si modifié
        if (email && email !== supplier.email) {
            const [existingEmail] = await pool.query(
                'SELECT id FROM suppliers WHERE company_id = ? AND email = ? AND id != ? AND deleted_at IS NULL',
                [companyId, email, id]
            );

            if (existingEmail.length > 0) {
                throw new AppError(
                    'Un fournisseur avec cet email existe déjà dans votre entreprise.',
                    409
                );
            }
        }

        // Construire la requête de mise à jour
        const updateFields = [];
        const updateValues = [];

        if (company_name !== undefined) {
            updateFields.push('company_name = ?');
            updateValues.push(company_name);
        }

        // Pour contact_name, on autorise null explicitement
        if (contact_name !== undefined) {
            updateFields.push('contact_name = ?');
            updateValues.push(contact_name || null);
        }

        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email || null);
        }

        if (address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(address || null);
        }

        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city || null);
        }

        if (country !== undefined) {
            updateFields.push('country = ?');
            updateValues.push(country || null);
        }

        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes || null);
        }

        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            throw new AppError('Aucun champ à mettre à jour.', 400);
        }

        updateValues.push(id);

        await pool.query(
            `UPDATE suppliers SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Récupérer le fournisseur mis à jour
        const [updatedSuppliers] = await pool.query(
            'SELECT * FROM suppliers WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Fournisseur mis à jour avec succès.',
            data: {
                supplier: updatedSuppliers[0],
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── SUPPRIMER UN FOURNISSEUR ──────────────────────────
const deleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        // Vérifier que le fournisseur existe et appartient à l'entreprise
        const [suppliers] = await pool.query(
            'SELECT * FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [id, companyId]
        );

        if (suppliers.length === 0) {
            throw new AppError('Fournisseur introuvable.', 404);
        }

        // Vérifier s'il y a des commandes liées
        const [orders] = await pool.query(
            "SELECT COUNT(*) as total FROM supplier_orders WHERE supplier_id = ? AND status NOT IN ('canceled', 'received')",
            [id]
        );

        if (orders[0].total > 0) {
            throw new AppError(
                'Impossible de supprimer ce fournisseur car il a des commandes en cours. Terminez ou annulez-les d\'abord.',
                400
            );
        }

        // Vérifier s'il y a un solde dû
        const supplier = suppliers[0];
        if (parseFloat(supplier.current_balance) > 0) {
            throw new AppError(
                'Impossible de supprimer ce fournisseur car vous avez un solde dû de ' +
                parseFloat(supplier.current_balance).toLocaleString() +
                ' FCFA. Réglez-le d\'abord.',
                400
            );
        }

        // Soft delete
        await pool.query(
            'UPDATE suppliers SET deleted_at = NOW() WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        res.status(200).json({
            success: true,
            message: 'Fournisseur supprimé avec succès.',
        });
    } catch (error) {
        next(error);
    }
};

// ─── ACTIVER / DÉSACTIVER UN FOURNISSEUR ───────────────
const toggleSupplierStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [suppliers] = await pool.query(
            'SELECT * FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [id, companyId]
        );

        if (suppliers.length === 0) {
            throw new AppError('Fournisseur introuvable.', 404);
        }

        const supplier = suppliers[0];
        const newStatus = !supplier.is_active;

        await pool.query(
            'UPDATE suppliers SET is_active = ? WHERE id = ? AND company_id = ?',
            [newStatus, id, companyId]
        );

        res.status(200).json({
            success: true,
            message: `Fournisseur ${newStatus ? 'activé' : 'désactivé'} avec succès.`,
            data: {
                supplier: { ...supplier, is_active: newStatus },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── ACTIONS EN MASSE (BULK ACTIONS) ──────────────────
const bulkSupplierAction = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const companyId = req.company.id;
        const { ids, action, params = {} } = req.body;

        if (!ids || ids.length === 0) {
            throw new AppError('Aucun fournisseur sélectionné.', 400);
        }

        const [suppliers] = await connection.query(
            `SELECT id, company_name, is_active, city, current_balance 
             FROM suppliers 
             WHERE id IN (?) AND company_id = ? AND deleted_at IS NULL`,
            [ids, companyId]
        );

        const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
        const results = [];
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        await connection.beginTransaction();

        if (action === 'activate') {
            for (const id of ids) {
                const sup = supplierMap.get(id);
                if (!sup) {
                    results.push({ id, status: 'failed', reason: 'Fournisseur introuvable ou non autorisé.' });
                    failedCount++;
                } else if (sup.is_active === 1) {
                    results.push({ id, name: sup.company_name, status: 'skipped', reason: 'Le fournisseur est déjà actif.' });
                    skippedCount++;
                } else {
                    await connection.query('UPDATE suppliers SET is_active = 1 WHERE id = ?', [id]);
                    results.push({ id, name: sup.company_name, status: 'success', message: 'Fournisseur activé.' });
                    successCount++;
                }
            }
        } else if (action === 'deactivate') {
            for (const id of ids) {
                const sup = supplierMap.get(id);
                if (!sup) {
                    results.push({ id, status: 'failed', reason: 'Fournisseur introuvable ou non autorisé.' });
                    failedCount++;
                } else if (sup.is_active === 0) {
                    results.push({ id, name: sup.company_name, status: 'skipped', reason: 'Le fournisseur est déjà inactif.' });
                    skippedCount++;
                } else {
                    await connection.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
                    results.push({ id, name: sup.company_name, status: 'success', message: 'Fournisseur désactivé.' });
                    successCount++;
                }
            }
        } else if (action === 'change_city') {
            const targetCity = params.city ? params.city.trim() : null;
            for (const id of ids) {
                const sup = supplierMap.get(id);
                if (!sup) {
                    results.push({ id, status: 'failed', reason: 'Fournisseur introuvable ou non autorisé.' });
                    failedCount++;
                } else {
                    await connection.query('UPDATE suppliers SET city = ? WHERE id = ?', [targetCity, id]);
                    results.push({
                        id,
                        name: sup.company_name,
                        status: 'success',
                        message: targetCity ? `Ville changée vers "${targetCity}".` : 'Ville réinitialisée.',
                    });
                    successCount++;
                }
            }
        } else if (action === 'delete') {
            for (const id of ids) {
                const sup = supplierMap.get(id);
                if (!sup) {
                    results.push({ id, status: 'failed', reason: 'Fournisseur introuvable ou non autorisé.' });
                    failedCount++;
                    continue;
                }

                // Vérifier commandes en cours
                const [orders] = await connection.query(
                    "SELECT COUNT(*) as total FROM supplier_orders WHERE supplier_id = ? AND status NOT IN ('canceled', 'received')",
                    [id]
                );

                if (orders[0].total > 0) {
                    results.push({
                        id,
                        name: sup.company_name,
                        status: 'skipped',
                        reason: 'Commandes fournisseurs en cours. Clôturez ou annulez-les d\'abord.',
                    });
                    skippedCount++;
                    continue;
                }

                // Vérifier solde dû
                if (parseFloat(sup.current_balance || 0) > 0) {
                    results.push({
                        id,
                        name: sup.company_name,
                        status: 'skipped',
                        reason: `Solde impayé de ${parseFloat(sup.current_balance).toLocaleString()} FCFA. Réglez-le d\'abord.`,
                    });
                    skippedCount++;
                    continue;
                }

                // Soft delete
                await connection.query(
                    'UPDATE suppliers SET deleted_at = NOW() WHERE id = ? AND company_id = ?',
                    [id, companyId]
                );
                results.push({ id, name: sup.company_name, status: 'success', message: 'Fournisseur supprimé.' });
                successCount++;
            }
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `${successCount} fournisseur(s) traité(s) avec succès.`,
            data: {
                total_requested: ids.length,
                success_count: successCount,
                skipped_count: skippedCount,
                failed_count: failedCount,
                results,
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,
    bulkSupplierAction,
};