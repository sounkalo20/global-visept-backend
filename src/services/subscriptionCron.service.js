const pool = require('../config/db');

/**
 * Service pour mettre à jour les statuts d'abonnement quotidiennement.
 * Doit être appelé par exemple avec node-cron depuis app.js ou server.js
 */
class SubscriptionCronService {
  
  static async processDailySubscriptions() {
    console.log('[CRON] Démarrage de la vérification des abonnements...');
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Passer de 'active' à 'past_due' (Période de grâce)
      const [expiredActive] = await connection.query(`
        SELECT id, name, subscription_ends_at 
        FROM companies 
        WHERE subscription_status = 'active' 
          AND subscription_ends_at < NOW()
          AND deleted_at IS NULL
      `);

      for (let company of expiredActive) {
        await connection.query(`
          UPDATE companies 
          SET subscription_status = 'past_due',
              grace_period_ends_at = DATE_ADD(subscription_ends_at, INTERVAL 7 DAY),
              updated_at = NOW()
          WHERE id = ?
        `, [company.id]);

        await connection.query(`
          INSERT INTO admin_notifications (company_id, type, title, message)
          VALUES (?, 'subscription_expiring', 'Période de grâce commencée', 'Votre abonnement a expiré. Vous avez 7 jours pour le renouveler avant suspension.')
        `, [company.id]);
        
        console.log(`[CRON] Entreprise ${company.id} (${company.name}) passée en past_due.`);
      }

      // 2. Passer de 'past_due' à 'expired' (Suspension)
      const [expiredGrace] = await connection.query(`
        SELECT id, name 
        FROM companies 
        WHERE subscription_status = 'past_due' 
          AND grace_period_ends_at < NOW()
          AND deleted_at IS NULL
      `);

      for (let company of expiredGrace) {
        await connection.query(`
          UPDATE companies 
          SET subscription_status = 'expired',
              updated_at = NOW()
          WHERE id = ?
        `, [company.id]);

        await connection.query(`
          INSERT INTO admin_notifications (company_id, type, title, message)
          VALUES (?, 'subscription_expired', 'Abonnement suspendu', 'Votre abonnement a été suspendu suite à un non-paiement.')
        `, [company.id]);
        
        console.log(`[CRON] Entreprise ${company.id} (${company.name}) passée en expired.`);
      }

      await connection.commit();
      console.log('[CRON] Vérification des abonnements terminée.');
    } catch (error) {
      await connection.rollback();
      console.error('[CRON] Erreur lors de la vérification des abonnements:', error);
    } finally {
      connection.release();
    }
  }
}

module.exports = SubscriptionCronService;
