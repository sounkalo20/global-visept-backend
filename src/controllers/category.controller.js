const pool = require("../config/db");
const AppError = require("../utils/AppError");

const getOwnerId = async (companyId, connection = pool) => {
  const [ownerRows] = await connection.query(
    `SELECT m.user_id 
     FROM memberships m
     LEFT JOIN roles r ON m.role_id = r.id
     WHERE m.company_id = ? 
       AND (r.name = 'Propriétaire' OR m.role = 'owner')
     ORDER BY (r.name = 'Propriétaire') DESC, (m.role = 'owner') DESC, m.id ASC
     LIMIT 1`,
    [companyId]
  );
  return ownerRows.length > 0 ? ownerRows[0].user_id : null;
};

// ─── CRÉER UNE CATÉGORIE ─────────────────────────────────
const createCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order, is_active } = req.body;
    const companyId = req.company.id;
    const owner_id = await getOwnerId(companyId);
    
    if (!owner_id) {
      throw new AppError("Propriétaire introuvable pour cette entreprise.", 403);
    }

    // Générer le slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    // Si parent_id est fourni, vérifier qu'il appartient à la même entreprise
    if (parent_id) {
      const [parentCategories] = await pool.query(
        "SELECT id FROM categories WHERE id = ? AND owner_id = ?",
        [parent_id, owner_id],
      );

      if (parentCategories.length === 0) {
        throw new AppError(
          "La catégorie parente spécifiée est introuvable.",
          404,
        );
      }
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE owner_id = ? AND name = ? AND deleted_at IS NULL",
      [owner_id, name],
    );

    if (existing.length > 0) {
      throw new AppError(
        "Une catégorie avec ce nom existe déjà dans votre entreprise.",
        409,
      );
    }

    // Insérer la catégorie
    const [result] = await pool.query(
      `INSERT INTO categories (owner_id, parent_id, name, slug, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id,
        parent_id || null,
        name,
        slug,
        description || null,
        sort_order || 0,
        is_active !== undefined ? is_active : true,
      ],
    );

    // Récupérer la catégorie créée
    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Catégorie créée avec succès.",
      data: {
        category: categories[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTER LES CATÉGORIES ───────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const owner_id = await getOwnerId(companyId);
    
    if (!owner_id) {
      throw new AppError("Propriétaire introuvable pour cette entreprise.", 403);
    }

    // Récupérer les catégories racines (sans parent)
    const [categories] = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.deleted_at IS NULL) as children_count
       FROM categories c
       WHERE c.owner_id = ? AND c.parent_id IS NULL AND c.deleted_at IS NULL
       ORDER BY c.sort_order ASC, c.name ASC`,
      [owner_id],
    );

    // Pour chaque catégorie racine, récupérer ses sous-catégories
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        if (category.children_count > 0) {
          const [children] = await pool.query(
            `SELECT * FROM categories
             WHERE owner_id = ? AND parent_id = ? AND deleted_at IS NULL
             ORDER BY sort_order ASC, name ASC`,
            [owner_id, category.id],
          );
          return { ...category, children };
        }
        return { ...category, children: [] };
      }),
    );

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithChildren,
        total: categories.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAILS D'UNE CATÉGORIE ─────────────────────────────
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const owner_id = await getOwnerId(companyId);
    
    if (!owner_id) {
      throw new AppError("Propriétaire introuvable.", 403);
    }

    // Récupérer la catégorie
    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
      [id, owner_id],
    );

    if (categories.length === 0) {
      throw new AppError("Catégorie introuvable.", 404);
    }

    const category = categories[0];

    // Récupérer les sous-catégories
    const [children] = await pool.query(
      "SELECT * FROM categories WHERE owner_id = ? AND parent_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, name ASC",
      [owner_id, category.id],
    );

    // Récupérer le parent si existe
    let parent = null;
    if (category.parent_id) {
      const [parents] = await pool.query(
        "SELECT id, name, slug FROM categories WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
        [category.parent_id, owner_id],
      );
      parent = parents[0] || null;
    }

    res.status(200).json({
      success: true,
      data: {
        category: {
          ...category,
          children,
          parent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UNE CATÉGORIE ──────────────────────────────
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const owner_id = await getOwnerId(companyId);
    
    if (!owner_id) {
      throw new AppError("Propriétaire introuvable.", 403);
    }
    const { name, description, parent_id, sort_order, is_active } = req.body;

    // Vérifier que la catégorie existe et appartient à l'entreprise
    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
      [id, owner_id],
    );

    if (categories.length === 0) {
      throw new AppError("Catégorie introuvable.", 404);
    }

    const category = categories[0];

    // Si le nom change, vérifier l'unicité
    if (name && name !== category.name) {
      const [existing] = await pool.query(
        "SELECT id FROM categories WHERE owner_id = ? AND name = ? AND id != ? AND deleted_at IS NULL",
        [owner_id, name, id],
      );

      if (existing.length > 0) {
        throw new AppError(
          "Une catégorie avec ce nom existe déjà dans votre entreprise.",
          409,
        );
      }
    }

    // Si parent_id change, vérifier qu'il appartient à la même entreprise
    if (
      parent_id !== undefined &&
      parent_id !== null &&
      parent_id !== category.parent_id
    ) {
      // Empêcher la circularité : une catégorie ne peut pas être son propre parent
      if (parent_id === parseInt(id)) {
        throw new AppError(
          "Une catégorie ne peut pas être sa propre catégorie parente.",
          400,
        );
      }

      const [parentCategories] = await pool.query(
        "SELECT id FROM categories WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
        [parent_id, owner_id],
      );

      if (parentCategories.length === 0) {
        throw new AppError(
          "La catégorie parente spécifiée est introuvable.",
          404,
        );
      }

      // Vérifier que le nouveau parent n'est pas un enfant de cette catégorie (circularité)
      const [descendants] = await pool.query(
        `WITH RECURSIVE category_tree AS (
           SELECT id FROM categories WHERE id = ?
           UNION ALL
           SELECT c.id FROM categories c
           INNER JOIN category_tree ct ON c.parent_id = ct.id
         )
         SELECT id FROM category_tree WHERE id = ?`,
        [id, parent_id],
      );

      if (descendants.length > 0) {
        throw new AppError(
          "Impossible de définir cette catégorie comme parente : cela créerait une boucle.",
          400,
        );
      }
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now();
      updateFields.push("name = ?", "slug = ?");
      updateValues.push(name, slug);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }

    if (parent_id !== undefined) {
      updateFields.push("parent_id = ?");
      updateValues.push(parent_id);
    }

    if (sort_order !== undefined) {
      updateFields.push("sort_order = ?");
      updateValues.push(sort_order);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      throw new AppError("Aucun champ à mettre à jour.", 400);
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    // Récupérer la catégorie mise à jour
    const [updatedCategories] = await pool.query(
      "SELECT * FROM categories WHERE id = ?",
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Catégorie mise à jour avec succès.",
      data: {
        category: updatedCategories[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SUPPRIMER UNE CATÉGORIE ─────────────────────────────
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const owner_id = await getOwnerId(companyId);
    
    if (!owner_id) {
      throw new AppError("Propriétaire introuvable.", 403);
    }

    // Vérifier que la catégorie existe et appartient à l'entreprise
    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
      [id, owner_id],
    );

    if (categories.length === 0) {
      throw new AppError("Catégorie introuvable.", 404);
    }

    // Vérifier s'il y a des sous-catégories
    const [children] = await pool.query(
      "SELECT id FROM categories WHERE parent_id = ? AND deleted_at IS NULL",
      [id],
    );

    if (children.length > 0) {
      throw new AppError(
        "Impossible de supprimer cette catégorie car elle contient des sous-catégories. Supprimez-les d'abord.",
        400,
      );
    }

    // Vérifier s'il y a des produits liés
    const [products] = await pool.query(
      "SELECT id FROM products WHERE category_id = ? AND deleted_at IS NULL",
      [id],
    );

    if (products.length > 0) {
      throw new AppError(
        "Impossible de supprimer cette catégorie car des produits y sont liés. Réassignez-les d'abord.",
        400,
      );
    }

    // Soft delete
    await pool.query(
      "UPDATE categories SET deleted_at = NOW() WHERE id = ? AND owner_id = ?",
      [id, owner_id],
    );

    res.status(200).json({
      success: true,
      message: "Catégorie supprimée avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
