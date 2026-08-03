const pool = require('../config/db');

class ProductCatalogService {
    /**
     * Génère un slug unique pour le catalogue
     */
    static generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    /**
     * Trouve ou crée un produit dans le catalogue global du propriétaire
     */
    static async findOrCreateCatalogProduct(ownerId, productData, connection = pool) {
        const { name, barcode, description, image_url, unit_id, category_id } = productData;
        const slug = this.generateSlug(name);
        
        // 1. Chercher par barcode si fourni
        if (barcode) {
            const [rows] = await connection.query(
                `SELECT * FROM product_catalog WHERE owner_id = ? AND barcode = ? LIMIT 1`,
                [ownerId, barcode]
            );
            if (rows.length > 0) return rows[0];
        }

        // 2. Chercher par slug
        const [rowsBySlug] = await connection.query(
            `SELECT * FROM product_catalog WHERE owner_id = ? AND slug = ? LIMIT 1`,
            [ownerId, slug]
        );
        if (rowsBySlug.length > 0) return rowsBySlug[0];

        // 3. Créer si non trouvé
        const actualUnitId = unit_id || 1;
        const [result] = await connection.query(
            `INSERT INTO product_catalog (owner_id, name, slug, barcode, description, image_url, unit_id, category_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [ownerId, name, slug, barcode || null, description || null, image_url || null, actualUnitId, category_id || null]
        );
        
        const [newRows] = await connection.query(`SELECT * FROM product_catalog WHERE id = ?`, [result.insertId]);
        return newRows[0];
    }

    /**
     * Crée une fiche produit dans une boutique à partir du catalogue
     */
    static async createShopProductFromCatalog(companyId, catalogProduct, connection = pool) {
        const uniqueSlug = `${catalogProduct.slug}-${Date.now()}`; // Pour éviter collision dans la boutique
        const [result] = await connection.query(
            `INSERT INTO products (
                company_id, catalog_product_id, name, slug, barcode, description, 
                image_url, unit_id, manage_stock, current_stock, is_active, is_available,
                retail_price, wholesale_price, cost_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, 0, 0, 0, 0)`,
            [
                companyId,
                catalogProduct.id,
                catalogProduct.name,
                uniqueSlug,
                catalogProduct.barcode,
                catalogProduct.description,
                catalogProduct.image_url,
                catalogProduct.unit_id
            ]
        );

        const [rows] = await connection.query(`SELECT * FROM products WHERE id = ?`, [result.insertId]);
        return rows[0];
    }

    /**
     * Trouve la fiche boutique correspondant à un catalog_product_id.
     * Si elle n'existe pas, la crée automatiquement.
     */
    static async getOrCreateShopProduct(companyId, catalogProductId, connection = pool) {
        // 1. Chercher la fiche boutique existante
        const [existing] = await connection.query(
            `SELECT * FROM products WHERE company_id = ? AND catalog_product_id = ? LIMIT 1`,
            [companyId, catalogProductId]
        );
        if (existing.length > 0) return { product: existing[0], isNew: false };

        // 2. Récupérer les infos du catalogue
        const [catalogRows] = await connection.query(
            `SELECT * FROM product_catalog WHERE id = ?`,
            [catalogProductId]
        );
        if (catalogRows.length === 0) {
            throw new Error(`Produit catalogue non trouvé (ID: ${catalogProductId})`);
        }
        
        // 3. Créer la fiche boutique
        const newProduct = await this.createShopProductFromCatalog(companyId, catalogRows[0], connection);
        return { product: newProduct, isNew: true };
    }
}

module.exports = ProductCatalogService;
