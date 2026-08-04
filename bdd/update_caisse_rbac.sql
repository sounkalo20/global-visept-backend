-- Création de la table de liaison entre caisses et caissiers
CREATE TABLE IF NOT EXISTS `cash_register_users` (
  `cash_register_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cash_register_id`, `user_id`),
  FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des nouvelles permissions dans le module Caisse
-- On utilise MAX(id) pour s'assurer que les id sont uniques et auto_incrémentés correctement
-- Cependant, pour éviter les soucis, on laisse l'auto_increment s'en charger si id est AI.
-- Supposons que id est AI dans permissions.

INSERT IGNORE INTO `permissions` (`code`, `module`, `name`, `description`) VALUES
('cash.registers.manage', 'Caisse', 'Gérer les caisses', 'Créer, modifier, supprimer et assigner des caisses'),
('cash.sessions.manage', 'Caisse', 'Gérer sa session', 'Ouvrir et fermer sa propre session de caisse'),
('cash.sessions.view', 'Caisse', 'Voir les sessions', 'Consulter l''historique et les détails de toutes les sessions');
