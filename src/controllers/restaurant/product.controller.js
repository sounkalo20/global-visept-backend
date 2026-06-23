// controllers/restaurant/product.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── CRÉER UN PLAT ─────────────────────────────────────
const createDish = async (req, res, next) => {
    try {
        const {
            name, category_id, description, ingredients_text,
            retail_price, cost_price, unit_id, is_available,
        } = req.body;
        const companyId = req.company.id;

        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now();

        const [existing] = await pool.query(
            'SELECT id FROM products WHERE company_id = ? AND name = ? AND deleted_at IS NULL',
            [companyId, name]
        );

        if (existing.length > 0) {
            throw new AppError('Un plat avec ce nom existe déjà.', 409);
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
        }

        const [result] = await pool.query(
            `INSERT INTO products (
        company_id, category_id, unit_id, name, slug, description,
        ingredients_text, retail_price, cost_price,
        product_type, manage_stock, is_available, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'dish', 0, ?, ?)`,
            [
                companyId,
                category_id || null,
                unit_id || 7,
                name,
                slug,
                description || null,
                ingredients_text || null,
                retail_price || 0,
                cost_price || 0,
                //isAvaible doit etre 1 ou 0 
                is_available ? 1 : 0,
                imageUrl,
            ]
        );

        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Plat créé avec succès.',
            data: { product: products[0] },
        });
    } catch (error) {
        next(error);
    }
};

// ─── LISTER LES PLATS ──────────────────────────────────
const getDishes = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1,
            limit = 50,
            search = '',
            category_id = '',
            is_available = '',
            sort_by = 'name',
            sort_order = 'ASC',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allowedSort = ['name', 'retail_price', 'created_at', 'cost_price'];
        const sortColumn = allowedSort.includes(sort_by) ? sort_by : 'name';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereConditions = ['p.company_id = ?', 'p.deleted_at IS NULL', "p.product_type = 'dish'"];
        let queryParams = [companyId];

        if (category_id) {
            whereConditions.push('p.category_id = ?');
            queryParams.push(category_id);
        }

        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.ingredients_text LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (is_available !== '') {
            whereConditions.push('p.is_available = ?');
            queryParams.push(is_available === '1' ? 1 : 0);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
      SELECT p.*, c.name as category_name,
             mu.name as unit_name, mu.symbol as unit_symbol
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN measurement_units mu ON p.unit_id = mu.id
      ${whereClause}
      ORDER BY p.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

        queryParams.push(parseInt(limit), offset);

        const [products] = await pool.query(query, queryParams);

        const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = countResult[0].total;

        // Stats
        const [stats] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable
       FROM products
       WHERE company_id = ? AND product_type = 'dish' AND deleted_at IS NULL`,
            [companyId]
        );

        res.status(200).json({
            success: true,
            data: {
                products,
                stats: stats[0],
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

// ─── DÉTAIL D'UN PLAT ──────────────────────────────────
const getDishById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [products] = await pool.query(
            `SELECT p.*, c.name as category_name,
              mu.name as unit_name, mu.symbol as unit_symbol
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN measurement_units mu ON p.unit_id = mu.id
       WHERE p.id = ? AND p.company_id = ? AND p.product_type = 'dish' AND p.deleted_at IS NULL`,
            [id, companyId]
        );

        if (products.length === 0) {
            throw new AppError('Plat introuvable.', 404);
        }

        res.status(200).json({
            success: true,
            data: { product: products[0] },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UN PLAT ──────────────────────────────────
const updateDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const {
            name, category_id, description, ingredients_text,
            retail_price, cost_price, unit_id, is_available, is_active,
        } = req.body;

        const [existing] = await pool.query(
            "SELECT * FROM products WHERE id = ? AND company_id = ? AND product_type = 'dish' AND deleted_at IS NULL",
            [id, companyId]
        );

        if (existing.length === 0) {
            throw new AppError('Plat introuvable.', 404);
        }

        if (name && name !== existing[0].name) {
            const [duplicate] = await pool.query(
                'SELECT id FROM products WHERE company_id = ? AND name = ? AND id != ? AND deleted_at IS NULL',
                [companyId, name, id]
            );
            if (duplicate.length > 0) {
                throw new AppError('Un plat avec ce nom existe déjà.', 409);
            }
        }

        const updates = [];
        const values = [];

        if (name !== undefined) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
            updates.push('name = ?, slug = ?');
            values.push(name, slug);
        }
        if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id || null); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
        if (ingredients_text !== undefined) { updates.push('ingredients_text = ?'); values.push(ingredients_text || null); }
        if (retail_price !== undefined) { updates.push('retail_price = ?'); values.push(retail_price); }
        if (cost_price !== undefined) { updates.push('cost_price = ?'); values.push(cost_price); }
        if (unit_id !== undefined) { updates.push('unit_id = ?'); values.push(unit_id); }
        if (is_available !== undefined) { updates.push('is_available = ?'); values.push(is_available); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
            updates.push('image_url = ?');
            values.push(imageUrl);
        }

        if (updates.length === 0) {
            throw new AppError('Aucune donnée à mettre à jour.', 400);
        }

        values.push(id);
        await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Plat mis à jour.',
            data: { product: updated[0] },
        });
    } catch (error) {
        next(error);
    }
};

// ─── SUPPRIMER UN PLAT ─────────────────────────────────
const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [existing] = await pool.query(
            "SELECT * FROM products WHERE id = ? AND company_id = ? AND product_type = 'dish' AND deleted_at IS NULL",
            [id, companyId]
        );

        if (existing.length === 0) {
            throw new AppError('Plat introuvable.', 404);
        }

        const [saleItems] = await pool.query(
            'SELECT COUNT(*) as total FROM sale_items WHERE product_id = ?',
            [id]
        );

        if (saleItems[0].total > 0) {
            await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
            return res.status(200).json({
                success: true,
                message: 'Plat archivé (déjà utilisé dans des ventes).',
            });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Plat supprimé définitivement.',
        });
    } catch (error) {
        next(error);
    }
};

// ─── TOGGLE DISPONIBILITÉ ─────────────────────────────
const toggleAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [products] = await pool.query(
            "SELECT * FROM products WHERE id = ? AND company_id = ? AND product_type = 'dish' AND deleted_at IS NULL",
            [id, companyId]
        );

        if (products.length === 0) {
            throw new AppError('Plat introuvable.', 404);
        }

        const newStatus = !products[0].is_available;

        await pool.query('UPDATE products SET is_available = ? WHERE id = ?', [newStatus, id]);

        res.status(200).json({
            success: true,
            message: `Plat ${newStatus ? 'disponible' : 'indisponible'}.`,
            data: { is_available: newStatus },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDish,
    getDishes,
    getDishById,
    updateDish,
    deleteDish,
    toggleAvailability,
};