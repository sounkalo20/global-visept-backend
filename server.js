require("dotenv").config();

const app = require("./src/app");
const cron = require('node-cron');
const SubscriptionCronService = require('./src/services/subscriptionCron.service');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Tâche planifiée tous les jours à minuit (00:00)
  cron.schedule('0 0 * * *', () => {
    console.log('[CRON] Lancement de la vérification quotidienne des abonnements');
    SubscriptionCronService.processDailySubscriptions();
  });
});