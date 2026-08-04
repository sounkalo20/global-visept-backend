const pool = require("../config/db");
const AppError = require("../utils/AppError");

// --- Caisses (Registers) ---

// Lister les caisses d'une entreprise
exports.getCashRegisters = async (req, res, next) => {
  try {
    const company_id = req.query.company_id;
    if (!company_id) return next(new AppError("company_id is required", 400));

    let query = `SELECT * FROM cash_registers WHERE company_id = ? ORDER BY name ASC`;
    let queryParams = [company_id];

    // Si l'utilisateur est un caissier (sans droits étendus), on ne renvoie que ses caisses assignées
    const isCashier = req.membership && req.membership.is_system_role && req.membership.role_name === 'Caissier';
    const isProprietaire = req.membership && req.membership.is_system_role && req.membership.role_name === 'Propriétaire';
    
    // Note: on pourrait aussi baser ça sur les permissions (req.membership.permissions.includes('cash.registers.manage'))
    // mais requiresPermission n'injecte pas toujours `permissions` si c'est géré au cas par cas.
    
    if (isCashier) {
      query = `
        SELECT cr.* 
        FROM cash_registers cr
        JOIN cash_register_users cru ON cr.id = cru.cash_register_id
        WHERE cr.company_id = ? AND cru.user_id = ?
        ORDER BY cr.name ASC
      `;
      queryParams = [company_id, req.user.id];
    }

    const [registers] = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: registers
    });
  } catch (error) {
    next(error);
  }
};

// Créer une caisse
exports.createCashRegister = async (req, res, next) => {
  try {
    const { company_id, name } = req.body;
    if (!company_id || !name) return next(new AppError("company_id and name are required", 400));

    const [result] = await pool.query(
      `INSERT INTO cash_registers (company_id, name, status) VALUES (?, ?, 'active')`,
      [company_id, name]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, company_id, name, status: 'active' }
    });
  } catch (error) {
    next(error);
  }
};

// Assigner un utilisateur à une caisse
exports.assignUserToRegister = async (req, res, next) => {
  try {
    const { cash_register_id, user_id } = req.body;
    if (!cash_register_id || !user_id) return next(new AppError("cash_register_id and user_id are required", 400));

    await pool.query(
      `INSERT IGNORE INTO cash_register_users (cash_register_id, user_id) VALUES (?, ?)`,
      [cash_register_id, user_id]
    );

    res.json({ success: true, message: "User assigned successfully" });
  } catch (error) {
    next(error);
  }
};

// Retirer un utilisateur d'une caisse
exports.unassignUserFromRegister = async (req, res, next) => {
  try {
    const { cash_register_id, user_id } = req.body;
    if (!cash_register_id || !user_id) return next(new AppError("cash_register_id and user_id are required", 400));

    await pool.query(
      `DELETE FROM cash_register_users WHERE cash_register_id = ? AND user_id = ?`,
      [cash_register_id, user_id]
    );

    res.json({ success: true, message: "User unassigned successfully" });
  } catch (error) {
    next(error);
  }
};

// Obtenir les utilisateurs assignés à une caisse
exports.getAssignedUsers = async (req, res, next) => {
  try {
    const { cash_register_id } = req.params;
    
    const [users] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email 
       FROM users u
       JOIN cash_register_users cru ON u.id = cru.user_id
       WHERE cru.cash_register_id = ?`,
      [cash_register_id]
    );

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};


// --- Sessions de Caisse ---

// Récupérer la session active de l'utilisateur
exports.getActiveSession = async (req, res, next) => {
  try {
    const company_id = req.query.company_id;
    const user_id = req.user.id;
    if (!company_id) return next(new AppError("company_id is required", 400));

    const [sessions] = await pool.query(
      `SELECT cs.*, cr.name as register_name 
       FROM cash_sessions cs
       JOIN cash_registers cr ON cs.cash_register_id = cr.id
       WHERE cs.company_id = ? AND cs.user_id = ? AND cs.status = 'open'
       ORDER BY cs.opened_at DESC LIMIT 1`,
      [company_id, user_id]
    );

    res.json({
      success: true,
      data: sessions.length > 0 ? sessions[0] : null
    });
  } catch (error) {
    next(error);
  }
};

// Historique des sessions (Rapport Z)
exports.getSessionHistory = async (req, res, next) => {
  try {
    const company_id = req.query.company_id;
    if (!company_id) return next(new AppError("company_id is required", 400));

    const [sessions] = await pool.query(
      `SELECT cs.*, cr.name as register_name, u.first_name, u.last_name 
       FROM cash_sessions cs
       JOIN cash_registers cr ON cs.cash_register_id = cr.id
       JOIN users u ON cs.user_id = u.id
       WHERE cs.company_id = ?
       ORDER BY cs.opened_at DESC LIMIT 100`,
      [company_id]
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// Ouvrir une session
exports.openSession = async (req, res, next) => {
  try {
    const { company_id, cash_register_id, opening_amount } = req.body;
    const user_id = req.user.id;

    if (!company_id || !cash_register_id || opening_amount === undefined) {
      return next(new AppError("Missing required fields", 400));
    }

    // Vérifier si l'utilisateur a déjà une session ouverte
    const [existing] = await pool.query(
      `SELECT id FROM cash_sessions WHERE user_id = ? AND company_id = ? AND status = 'open'`,
      [user_id, company_id]
    );

    if (existing.length > 0) {
      return next(new AppError("You already have an open cash session", 400));
    }

    // Vérifier si la caisse est déjà utilisée par un autre utilisateur
    const [registerInUse] = await pool.query(
      `SELECT id FROM cash_sessions WHERE cash_register_id = ? AND status = 'open'`,
      [cash_register_id]
    );
    if (registerInUse.length > 0) {
      return next(new AppError("This cash register is currently in use by another session", 400));
    }

    const [result] = await pool.query(
      `INSERT INTO cash_sessions (cash_register_id, user_id, company_id, opening_amount, expected_closing_amount, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [cash_register_id, user_id, company_id, opening_amount, opening_amount]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        cash_register_id,
        user_id,
        opening_amount,
        status: 'open'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Clôturer une session
exports.closeSession = async (req, res, next) => {
  try {
    const session_id = req.params.id;
    const { actual_closing_amount, notes } = req.body;
    const user_id = req.user.id;

    if (actual_closing_amount === undefined) {
      return next(new AppError("actual_closing_amount is required", 400));
    }

    // Récupérer la session
    const [sessions] = await pool.query(
      `SELECT * FROM cash_sessions WHERE id = ? AND status = 'open'`,
      [session_id]
    );

    if (sessions.length === 0) {
      return next(new AppError("Session not found or already closed", 404));
    }

    const session = sessions[0];
    
    // Si c'est un caissier, il ne peut fermer que sa propre session. Un admin pourrait forcer la fermeture.
    // On simplifie : on laisse fermer si on a le bon membership.
    
    // 1. Recalculer l'expected amount de façon sécurisée depuis les cash_movements en "cash"
    const [movements] = await pool.query(
      `SELECT SUM(CASE 
        WHEN type IN ('sale_in', 'manual_in') THEN amount 
        WHEN type IN ('sale_refund', 'manual_out') THEN -amount 
        ELSE 0 END) as net_cash
       FROM cash_movements 
       WHERE session_id = ? AND payment_method = 'cash'`,
      [session_id]
    );

    const netCash = movements[0].net_cash ? parseFloat(movements[0].net_cash) : 0;
    const expectedClosing = parseFloat(session.opening_amount) + netCash;
    const diff = parseFloat(actual_closing_amount) - expectedClosing;

    await pool.query(
      `UPDATE cash_sessions 
       SET status = 'closed', closed_at = NOW(), expected_closing_amount = ?, actual_closing_amount = ?, difference_amount = ?, notes = ?
       WHERE id = ?`,
      [expectedClosing, actual_closing_amount, diff, notes || '', session_id]
    );

    res.json({
      success: true,
      data: {
        expected_closing_amount: expectedClosing,
        actual_closing_amount: actual_closing_amount,
        difference_amount: diff
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Mouvements de Caisse ---
exports.getCashMovements = async (req, res, next) => {
  try {
    const session_id = req.params.id;

    const [movements] = await pool.query(
      `SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at DESC`,
      [session_id]
    );

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    next(error);
  }
};
