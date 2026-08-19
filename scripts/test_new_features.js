// scripts/test_new_features.js
const pool = require('../src/config/db');

async function testNewFeatures() {
  console.log('🧪 Lancement des tests de validation pour F15, F18, F19, F20, F21, F23...');
  const conn = await pool.getConnection();

  try {
    // 1. Vérification des tables
    console.log('\n--- 1. Vérification de la présence des tables ---');
    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    const requiredTables = [
      'supplier_orders',
      'supplier_credits',
      'supplier_credit_applications',
      'notifications',
      'permissions',
      'subscription_plans'
    ];

    for (const t of requiredTables) {
      if (tableNames.includes(t)) {
        console.log(`  ✅ Table '${t}' présente`);
      } else {
        throw new Error(`Table '${t}' MANQUANTE !`);
      }
    }

    // 2. Vérification des colonnes de remise sur supplier_orders
    console.log('\n--- 2. Vérification des colonnes de remises ---');
    const [soCols] = await conn.query('SHOW COLUMNS FROM `supplier_orders`');
    const soColNames = soCols.map(c => c.Field);
    ['discount_type', 'discount_value', 'discount_amount'].forEach(col => {
      if (soColNames.includes(col)) {
        console.log(`  ✅ Colonne '${col}' présente dans supplier_orders`);
      } else {
        throw new Error(`Colonne '${col}' MANQUANTE dans supplier_orders !`);
      }
    });

    // 3. Test de création d'une notification via le service
    console.log('\n--- 3. Test du service de notifications ---');
    const notificationService = require('../src/services/notification.service');
    
    // Obtenir une company active
    const [companies] = await conn.query('SELECT id, name FROM companies LIMIT 1');
    if (companies.length > 0) {
      const compId = companies[0].id;
      const notif = await notificationService.createNotification({
        company_id: compId,
        type: 'test_notification',
        title: 'Test Notification Système',
        message: 'Validation du système de notification en temps réel pour VISEPT.',
        severity: 'info',
      });
      console.log(`  ✅ Notification créée avec succès (ID: ${notif?.id}) pour ${companies[0].name}`);

      // Nettoyer la notif de test
      if (notif?.id) {
        await conn.query('DELETE FROM notifications WHERE id = ?', [notif.id]);
      }
    }

    // 4. Test requête Journal SQL (UNION)
    console.log('\n--- 4. Test de la requête Journal des opérations ---');
    if (companies.length > 0) {
      const compId = companies[0].id;
      const [journalTest] = await conn.query(`
        SELECT COUNT(*) as cnt FROM (
          SELECT sp.created_at AS operation_date, 'sale_payment' AS type
          FROM sale_payments sp
          JOIN sales s ON sp.sale_id = s.id
          WHERE s.company_id = ?
          UNION ALL
          SELECT CONCAT(e.expense_date, ' 12:00:00') AS operation_date, 'expense' AS type
          FROM expenses e
          WHERE e.company_id = ? AND e.deleted_at IS NULL
        ) as t
      `, [compId, compId]);
      console.log(`  ✅ Requête UNION Journal valide (Écritures trouvées: ${journalTest[0]?.cnt || 0})`);
    }

    // 5. Test calcul Prédictions de Stock
    console.log('\n--- 5. Test calcul Prédiction de Stock ---');
    if (companies.length > 0) {
      const compId = companies[0].id;
      const [predTest] = await conn.query(`
        SELECT 
          p.id, p.name, p.current_stock,
          COALESCE(ABS(SUM(im.quantity)), 0) AS total_sold_30d,
          COALESCE(COUNT(DISTINCT im.reference_id), 0) AS tx_count
        FROM products p
        LEFT JOIN inventory_movements im ON (
          im.product_id = p.id AND im.company_id = p.company_id AND im.movement_type = 'sale'
          AND im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
        WHERE p.company_id = ? AND p.deleted_at IS NULL
        GROUP BY p.id
        LIMIT 5
      `, [compId]);
      console.log(`  ✅ Requête prédiction valide (${predTest.length} produits analysés)`);
    }

    console.log('\n🎉 TOUS LES TESTS BACKEND ONT RÉUSSI AVEC SUCCÈS !');
  } catch (error) {
    console.error('❌ Échec du test:', error);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

testNewFeatures();
