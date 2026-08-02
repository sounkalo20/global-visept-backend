const pool = require('../config/db');

const SYSTEM_PERMISSIONS = [
  // Dashboard
  { code: 'dashboard.view', module: 'Tableau de bord', name: 'Voir le tableau de bord', description: 'Accès aux statistiques et métriques globales' },
  
  // Produits
  { code: 'products.view', module: 'Produits', name: 'Voir les produits', description: 'Consulter le catalogue de produits' },
  { code: 'products.create', module: 'Produits', name: 'Créer un produit', description: 'Ajouter de nouveaux produits' },
  { code: 'products.edit', module: 'Produits', name: 'Modifier un produit', description: 'Modifier les informations des produits' },
  { code: 'products.delete', module: 'Produits', name: 'Supprimer un produit', description: 'Supprimer ou archiver un produit' },
  { code: 'products.export', module: 'Produits', name: 'Exporter les produits', description: 'Exporter la liste des produits' },
  { code: 'products.view_cost', module: 'Produits', name: "Voir le prix d'achat", description: 'Autoriser la visualisation du prix d\'achat et des marges' },

  // Ventes
  { code: 'sales.view', module: 'Ventes', name: 'Voir les ventes', description: 'Consulter l\'historique des ventes' },
  { code: 'sales.create', module: 'Ventes', name: 'Créer une vente', description: 'Enregistrer une nouvelle vente (Caisse)' },
  { code: 'sales.edit', module: 'Ventes', name: 'Modifier une vente', description: 'Modifier une vente existante' },
  { code: 'sales.delete', module: 'Ventes', name: 'Supprimer une vente', description: 'Supprimer une vente' },
  { code: 'sales.cancel', module: 'Ventes', name: 'Annuler une vente', description: 'Annuler une vente' },
  { code: 'sales.print', module: 'Ventes', name: 'Imprimer un ticket', description: 'Imprimer le ticket ou la facture' },
  { code: 'sales.export', module: 'Ventes', name: 'Exporter les ventes', description: 'Exporter l\'historique' },
  { code: 'sales.return', module: 'Ventes', name: 'Retour produit', description: 'Gérer les retours clients' },
  { code: 'sales.view_margin', module: 'Ventes', name: 'Voir les marges', description: 'Voir le bénéfice et la marge sur les ventes' },

  // Achats
  { code: 'purchases.view', module: 'Achats', name: 'Voir les achats', description: 'Consulter les bons de commande fournisseur' },
  { code: 'purchases.create', module: 'Achats', name: 'Créer un achat', description: 'Créer un bon de commande' },
  { code: 'purchases.edit', module: 'Achats', name: 'Modifier un achat', description: 'Modifier un bon de commande' },
  { code: 'purchases.delete', module: 'Achats', name: 'Supprimer un achat', description: 'Supprimer un bon de commande' },
  { code: 'purchases.receive', module: 'Achats', name: 'Réceptionner', description: 'Réceptionner les articles d\'un achat' },

  // Stock & Inventaire
  { code: 'inventory.view', module: 'Stocks', name: 'Voir le stock', description: 'Consulter les niveaux de stock' },
  { code: 'inventory.adjust', module: 'Stocks', name: 'Ajuster le stock', description: 'Faire des ajustements manuels' },
  { code: 'inventory.transfer', module: 'Stocks', name: 'Transférer', description: 'Transférer entre entrepôts' },
  { code: 'inventory.count', module: 'Stocks', name: 'Inventaire physique', description: 'Gérer les sessions d\'inventaire physique' },

  // Entrepôts
  { code: 'warehouses.view', module: 'Entrepôts', name: 'Voir les entrepôts', description: 'Voir la liste des entrepôts' },
  { code: 'warehouses.create', module: 'Entrepôts', name: 'Créer un entrepôt', description: 'Ajouter un entrepôt' },
  { code: 'warehouses.edit', module: 'Entrepôts', name: 'Modifier un entrepôt', description: 'Modifier un entrepôt' },
  { code: 'warehouses.delete', module: 'Entrepôts', name: 'Supprimer un entrepôt', description: 'Supprimer un entrepôt' },

  // Clients
  { code: 'clients.view', module: 'Clients', name: 'Voir les clients', description: 'Consulter le fichier client' },
  { code: 'clients.create', module: 'Clients', name: 'Créer un client', description: 'Ajouter un client' },
  { code: 'clients.edit', module: 'Clients', name: 'Modifier un client', description: 'Modifier un client' },
  { code: 'clients.delete', module: 'Clients', name: 'Supprimer un client', description: 'Supprimer un client' },

  // Fournisseurs
  { code: 'suppliers.view', module: 'Fournisseurs', name: 'Voir les fournisseurs', description: 'Consulter les fournisseurs' },
  { code: 'suppliers.create', module: 'Fournisseurs', name: 'Créer un fournisseur', description: 'Ajouter un fournisseur' },
  { code: 'suppliers.edit', module: 'Fournisseurs', name: 'Modifier un fournisseur', description: 'Modifier un fournisseur' },
  { code: 'suppliers.delete', module: 'Fournisseurs', name: 'Supprimer un fournisseur', description: 'Supprimer un fournisseur' },

  // Employés & Rôles
  { code: 'employees.view', module: 'Employés', name: 'Voir les employés', description: 'Voir la liste du personnel' },
  { code: 'employees.create', module: 'Employés', name: 'Créer un employé', description: 'Ajouter un nouvel employé' },
  { code: 'employees.edit', module: 'Employés', name: 'Modifier un employé', description: 'Gérer les employés' },
  { code: 'employees.delete', module: 'Employés', name: 'Supprimer un employé', description: 'Supprimer un employé' },
  { code: 'roles.manage', module: 'Employés', name: 'Gérer les rôles', description: 'Créer et modifier les rôles et permissions' },

  // Paramètres
  { code: 'settings.manage', module: 'Paramètres', name: 'Gérer les paramètres', description: 'Accès aux paramètres de l\'entreprise' }
];

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Début de la migration RBAC...');
    await conn.beginTransaction();

    // 1. Création des tables
    console.log('📦 Création des tables...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`permissions\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`code\` varchar(100) NOT NULL,
        \`module\` varchar(100) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`description\` text,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`permissions_code_unique\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`company_id\` bigint unsigned NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`description\` text,
        \`is_system\` tinyint(1) DEFAULT '0',
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`roles_company_id_index\` (\`company_id\`),
        CONSTRAINT \`roles_company_id_foreign\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`role_permissions\` (
        \`role_id\` bigint unsigned NOT NULL,
        \`permission_id\` bigint unsigned NOT NULL,
        PRIMARY KEY (\`role_id\`,\`permission_id\`),
        CONSTRAINT \`rp_permission_id_foreign\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`rp_role_id_foreign\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Add role_id to memberships if not exists
    const [cols] = await conn.query('SHOW COLUMNS FROM `memberships` LIKE "role_id"');
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE \`memberships\` ADD COLUMN \`role_id\` bigint unsigned NULL AFTER \`role\``);
      // Wait to add FK until migration is complete so we don't break existing rows yet
    }

    // 2. Seeding Permissions
    console.log('🔑 Seeding des permissions...');
    for (const p of SYSTEM_PERMISSIONS) {
      await conn.query(
        'INSERT INTO permissions (code, module, name, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module), description = VALUES(description)',
        [p.code, p.module, p.name, p.description]
      );
    }

    const [allPerms] = await conn.query('SELECT id, code FROM permissions');
    const permMap = allPerms.reduce((acc, p) => ({ ...acc, [p.code]: p.id }), {});

    // 3. Migration des rôles pour chaque entreprise
    console.log('🏢 Migration des entreprises et des rôles...');
    const [companies] = await conn.query('SELECT id FROM companies');
    
    for (const company of companies) {
      const companyId = company.id;
      
      // Check if system roles exist for this company
      const [existingRoles] = await conn.query('SELECT id, name FROM roles WHERE company_id = ? AND is_system = 1', [companyId]);
      
      let ownerRoleId, managerRoleId, cashierRoleId;

      if (existingRoles.length === 0) {
        // Create standard roles
        const [ownerRes] = await conn.query('INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, ?)', [companyId, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1]);
        ownerRoleId = ownerRes.insertId;

        const [managerRes] = await conn.query('INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, ?)', [companyId, 'Gérant', 'Gestion complète sauf paramètres', 1]);
        managerRoleId = managerRes.insertId;

        const [cashierRes] = await conn.query('INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, ?)', [companyId, 'Caissier', 'Encaissement et ventes uniquement', 1]);
        cashierRoleId = cashierRes.insertId;

        // Assign permissions to Owner (All)
        const ownerPerms = allPerms.map(p => [ownerRoleId, p.id]);
        if (ownerPerms.length > 0) {
          await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [ownerPerms]);
        }

        // Assign permissions to Manager
        const managerCodes = SYSTEM_PERMISSIONS.filter(p => !p.code.startsWith('settings.') && !p.code.startsWith('roles.')).map(p => p.code);
        const managerPerms = managerCodes.map(c => [managerRoleId, permMap[c]]);
        if (managerPerms.length > 0) {
          await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [managerPerms]);
        }

        // Assign permissions to Cashier
        const cashierCodes = ['dashboard.view', 'products.view', 'sales.view', 'sales.create', 'sales.print', 'sales.return'];
        const cashierPerms = cashierCodes.map(c => [cashierRoleId, permMap[c]]);
        if (cashierPerms.length > 0) {
          await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [cashierPerms]);
        }
      } else {
        ownerRoleId = existingRoles.find(r => r.name === 'Propriétaire')?.id;
        managerRoleId = existingRoles.find(r => r.name === 'Gérant')?.id;
        cashierRoleId = existingRoles.find(r => r.name === 'Caissier')?.id;
      }

      // 4. Update memberships
      await conn.query('UPDATE memberships SET role_id = ? WHERE company_id = ? AND role = "owner" AND role_id IS NULL', [ownerRoleId, companyId]);
      await conn.query('UPDATE memberships SET role_id = ? WHERE company_id = ? AND role = "super_admin" AND role_id IS NULL', [ownerRoleId, companyId]); // super_admin defaults to owner in company scope
      await conn.query('UPDATE memberships SET role_id = ? WHERE company_id = ? AND role = "manager" AND role_id IS NULL', [managerRoleId, companyId]);
      await conn.query('UPDATE memberships SET role_id = ? WHERE company_id = ? AND (role = "cashier" OR role = "employee") AND role_id IS NULL', [cashierRoleId, companyId]);
    }

    // 5. Add Foreign Key to memberships
    const [fkCheck] = await conn.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'memberships' AND COLUMN_NAME = 'role_id' AND CONSTRAINT_SCHEMA = DATABASE()
    `);
    
    if (fkCheck.length === 0) {
      console.log('🔗 Ajout de la contrainte de clé étrangère sur memberships.role_id');
      await conn.query('ALTER TABLE memberships ADD CONSTRAINT memberships_role_id_foreign FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT');
    }

    await conn.commit();
    console.log('✅ Migration RBAC réussie avec succès !');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Erreur lors de la migration:', err);
  } finally {
    conn.release();
    process.exit();
  }
}

run();
