-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 17, 2026 at 11:07 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `visept_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `admin_id` bigint UNSIGNED NOT NULL,
  `action_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'company, subscription, user',
  `target_id` bigint UNSIGNED DEFAULT NULL,
  `details` json DEFAULT NULL COMMENT 'détails de l''action',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_audit_logs`
--

INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action_type`, `target_type`, `target_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 4, 'create_plan', 'plan', 4, '{\"code\": \"ORG\", \"name\": \"test\", \"price_yearly\": 60000, \"price_monthly\": 5000}', '::1', '2026-06-21 23:18:11'),
(2, 4, 'activate_plan', 'plan', 4, '{\"code\": \"ORG\", \"name\": \"test\", \"new_status\": true, \"previous_status\": 0}', '::1', '2026-06-21 23:21:12'),
(3, 4, 'deactivate_plan', 'plan', 4, '{\"code\": \"ORG\", \"name\": \"test\", \"new_status\": false, \"previous_status\": 1}', '::1', '2026-06-21 23:21:20'),
(4, 4, 'update_plan', 'plan', 2, '{\"changes\": {\"code\": \"STANDARD\", \"name\": \"Standard\", \"features\": {\"reports\": true, \"suppliers\": true, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false}, \"is_active\": 1, \"max_clients\": 1000, \"max_products\": 500, \"price_yearly\": 100000, \"max_employees\": 10, \"price_monthly\": 10000}, \"previous\": {\"code\": \"STANDARD\", \"name\": \"Standard\"}}', '::1', '2026-06-21 23:22:38'),
(5, 4, 'update_plan', 'plan', 3, '{\"changes\": {\"code\": \"PREMIUM\", \"name\": \"Premium\", \"features\": {\"reports\": true, \"suppliers\": true, \"api_access\": true, \"promotions\": true, \"advanced_stock\": true}, \"is_active\": 1, \"max_clients\": null, \"max_products\": null, \"price_yearly\": 250000, \"max_employees\": null, \"price_monthly\": 25000}, \"previous\": {\"code\": \"PREMIUM\", \"name\": \"Premium\"}}', '::1', '2026-06-21 23:23:27'),
(6, 4, 'update_plan', 'plan', 4, '{\"changes\": {\"code\": \"ORG\", \"name\": \"test\", \"features\": {\"reports\": false, \"suppliers\": false, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false}, \"is_active\": 0, \"max_clients\": 5, \"max_products\": 5, \"price_yearly\": 60000, \"max_employees\": 3, \"price_monthly\": 5000}, \"previous\": {\"code\": \"ORG\", \"name\": \"test\"}}', '::1', '2026-06-21 23:25:27'),
(7, 4, 'activate_plan', 'plan', 4, '{\"code\": \"ORG\", \"name\": \"test\", \"new_status\": true, \"previous_status\": 0}', '::1', '2026-06-21 23:25:34'),
(8, 4, 'approve_payment', 'subscription', 1, '{\"amount\": \"5000.00\", \"plan_id\": 4, \"plan_name\": \"test\", \"company_id\": 4, \"company_name\": \"kaba_shops\", \"payment_method\": \"mobile_money\", \"subscription_ends_at\": \"2026-07-22T19:43:03.510Z\"}', '::1', '2026-06-22 19:43:03'),
(9, 4, 'grant_unlimited_plan', 'user', 5, '{\"impacted_companies\": 2}', '::1', '2026-07-22 11:05:55'),
(10, 4, 'create_owner', 'user', 9, '{\"email\": \"ibasoumano@gmail.com\"}', '::1', '2026-07-22 11:12:30'),
(11, 4, 'grant_unlimited_plan', 'user', 9, '{\"impacted_companies\": 0}', '::1', '2026-07-22 11:12:49');

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED DEFAULT NULL COMMENT 'NULL = notification globale',
  `user_id` bigint UNSIGNED DEFAULT NULL COMMENT 'destinataire spécifique',
  `type` enum('subscription_expiring','subscription_expired','payment_reminder','system_announcement','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `sent_email` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `company_id`, `user_id`, `type`, `title`, `message`, `is_read`, `sent_email`, `created_at`) VALUES
(1, 4, NULL, 'system_announcement', 'Paiement approuvé ✅', 'Votre paiement de 5 000 FCFA pour le plan test a été approuvé. Votre abonnement est actif jusqu\'au 22/07/2026.', 0, 0, '2026-06-22 19:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `duration_minutes` int NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','canceled','no_show') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `cancel_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Coiffeur assigné',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_services`
--

CREATE TABLE `appointment_services` (
  `id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `service_id` bigint UNSIGNED NOT NULL,
  `price` decimal(12,2) NOT NULL COMMENT 'Prix au moment du RDV'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_types`
--

CREATE TABLE `business_types` (
  `id` tinyint UNSIGNED NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_types`
--

INSERT INTO `business_types` (`id`, `code`, `name`, `description`, `icon`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SHOP', 'Boutique', 'Petits commerces de détail', 'store', 1, '2026-05-07 13:09:28', '2026-05-07 13:09:28'),
(2, 'SUPERMARKET', 'Supermarché', 'Gestion avancée multi-rayons', 'shopping-cart', 1, '2026-05-07 13:09:28', '2026-05-07 13:09:28'),
(3, 'RESTAURANT', 'Restaurant', 'Gestion des commandes et service', 'utensils', 1, '2026-05-07 13:09:28', '2026-05-07 13:09:28'),
(4, 'SALON', 'Salon de coiffure', 'Gestion des rendez-vous clients', 'scissors', 1, '2026-05-07 13:09:28', '2026-05-07 13:09:28');

-- --------------------------------------------------------

--
-- Table structure for table `cash_movements`
--

CREATE TABLE `cash_movements` (
  `id` bigint UNSIGNED NOT NULL,
  `session_id` bigint UNSIGNED NOT NULL,
  `type` enum('sale_in','sale_refund','manual_in','manual_out') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','card','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `amount` decimal(12,2) NOT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID de la vente ou du retour (sale_id)',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cash_movements`
--

INSERT INTO `cash_movements` (`id`, `session_id`, `type`, `payment_method`, `amount`, `reference_id`, `notes`, `created_at`) VALUES
(1, 1, 'sale_in', 'cash', 30000.00, 22, 'Vente VTE-202608-00001', '2026-08-03 14:44:08'),
(2, 1, 'sale_in', 'mobile_money', 2500.00, 23, 'Vente VTE-202608-00002', '2026-08-03 14:46:12'),
(3, 1, 'sale_in', 'cash', 20000.00, 23, 'Vente VTE-202608-00002', '2026-08-03 14:46:12'),
(4, 2, 'sale_in', 'cash', 22500.00, 24, 'Vente VTE-202608-00003', '2026-08-03 14:52:06'),
(5, 3, 'sale_in', 'cash', 37500.00, 25, 'Vente VTE-202608-00004', '2026-08-03 16:19:40'),
(6, 3, 'sale_in', 'cash', 15000.00, 26, 'Vente VTE-202608-00005', '2026-08-03 16:29:27'),
(7, 3, 'sale_in', 'cash', 15000.00, 27, 'Vente VTE-202608-00006', '2026-08-03 16:32:05'),
(8, 6, 'sale_in', 'cash', 22500.00, 28, 'Vente VTE-202608-00007', '2026-08-04 14:20:08'),
(9, 7, 'sale_in', 'cash', 400000.00, 29, 'Vente VTE-202608-00008', '2026-08-07 12:36:55'),
(10, 7, 'sale_in', 'mobile_money', 20000.00, 29, 'Vente VTE-202608-00008', '2026-08-07 12:36:55'),
(11, 7, 'sale_in', 'cash', 15000.00, 30, 'Vente VTE-202608-00009', '2026-08-07 12:43:16'),
(12, 7, 'sale_in', 'cash', 400000.00, 31, 'Vente VTE-202608-00010', '2026-08-07 12:43:56'),
(13, 8, 'sale_in', 'cash', 35800.00, 33, 'Vente VTE-202608-00012', '2026-08-08 03:05:55'),
(14, 8, 'sale_refund', 'cash', 1200.00, 4, 'Retour RET-202608-00001 (vente VTE-202608-00012)', '2026-08-08 03:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `cash_registers`
--

CREATE TABLE `cash_registers` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ex: Caisse Principale, Caisse 2',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cash_registers`
--

INSERT INTO `cash_registers` (`id`, `company_id`, `name`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 'caisse 1', 'active', '2026-08-03 14:40:11', '2026-08-03 14:40:11');

-- --------------------------------------------------------

--
-- Table structure for table `cash_register_users`
--

CREATE TABLE `cash_register_users` (
  `cash_register_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cash_register_users`
--

INSERT INTO `cash_register_users` (`cash_register_id`, `user_id`, `assigned_at`) VALUES
(1, 18, '2026-08-04 12:35:38'),
(1, 19, '2026-08-04 13:32:20');

-- --------------------------------------------------------

--
-- Table structure for table `cash_sessions`
--

CREATE TABLE `cash_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `cash_register_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL COMMENT 'Caissier',
  `company_id` bigint UNSIGNED NOT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `opening_amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Fond de caisse',
  `expected_closing_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'Calculé par le système',
  `actual_closing_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'Compté par le caissier',
  `difference_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'actual - expected',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cash_sessions`
--

INSERT INTO `cash_sessions` (`id`, `cash_register_id`, `user_id`, `company_id`, `status`, `opened_at`, `closed_at`, `opening_amount`, `expected_closing_amount`, `actual_closing_amount`, `difference_amount`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 4, 'closed', '2026-08-03 16:40:29', '2026-08-03 16:49:47', 25000.00, 75000.00, 75000.00, 0.00, '', '2026-08-03 14:40:29', '2026-08-03 14:49:47'),
(2, 1, 5, 4, 'closed', '2026-08-03 16:51:48', '2026-08-03 16:52:48', 20000.00, 42500.00, 35000.00, -7500.00, '', '2026-08-03 14:51:48', '2026-08-03 14:52:48'),
(3, 1, 5, 4, 'closed', '2026-08-03 18:18:38', '2026-08-04 13:00:11', 15000.00, 82500.00, 50000.00, -32500.00, '', '2026-08-03 16:18:38', '2026-08-04 11:00:11'),
(4, 1, 18, 4, 'closed', '2026-08-04 15:04:39', '2026-08-04 15:10:16', 100.00, 100.00, 100.00, 0.00, '', '2026-08-04 13:04:39', '2026-08-04 13:10:16'),
(5, 1, 18, 4, 'closed', '2026-08-04 15:10:43', '2026-08-04 15:44:00', 50000.00, 50000.00, 0.00, 0.00, NULL, '2026-08-04 13:10:43', '2026-08-04 13:44:00'),
(6, 1, 19, 4, 'closed', '2026-08-04 16:18:20', '2026-08-04 16:23:58', 22500.00, 45000.00, 43000.00, -2000.00, 'paiement de la nourriture ', '2026-08-04 14:18:20', '2026-08-04 14:23:58'),
(7, 1, 18, 4, 'closed', '2026-08-07 14:14:03', '2026-08-07 14:45:10', 10000.00, 825000.00, 820000.00, -5000.00, 'paiement d\'une depense pour la nourriture ', '2026-08-07 12:14:03', '2026-08-07 12:45:10'),
(8, 1, 5, 4, 'closed', '2026-08-08 05:05:16', '2026-08-08 05:09:28', 15000.00, 49600.00, 49600.00, 0.00, '', '2026-08-08 03:05:16', '2026-08-08 03:09:28');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `owner_id` bigint UNSIGNED DEFAULT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `owner_id`, `parent_id`, `name`, `slug`, `description`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 2, NULL, 'telephone ', 'telephone-1779206425400', 'differente categorie de telephone du systeme ', NULL, 0, 1, '2026-05-19 16:00:25', '2026-08-03 11:38:09', NULL),
(2, 2, 2, NULL, 'tablette', 'tablette-1779206487479', 'blablaa', NULL, 0, 1, '2026-05-19 16:01:03', '2026-08-03 11:38:09', '2026-05-19 18:06:27'),
(3, 3, 2, NULL, 'fauteuil', 'fauteuil-1779206841355', 'balabalaa', NULL, 0, 1, '2026-05-19 16:07:21', '2026-08-03 11:38:09', NULL),
(4, 4, 5, NULL, 'electronique', 'electronique-1782132291314', NULL, NULL, 0, 1, '2026-06-22 12:44:51', '2026-08-03 11:38:09', NULL),
(5, 5, 5, NULL, 'fritures', 'fritures-1782223337333', NULL, NULL, 0, 1, '2026-06-23 14:02:17', '2026-08-03 11:38:09', NULL),
(6, 4, 5, NULL, 'Vetements', 'vetements-1785999901001', 'V├¬tements hommes, femmes et enfants', NULL, 0, 1, '2026-08-07 23:00:38', '2026-08-07 23:00:38', NULL),
(7, 4, 5, NULL, 'Chaussures', 'chaussures-1785999901002', 'Chaussures et sandales', NULL, 0, 1, '2026-08-07 23:00:38', '2026-08-07 23:00:38', NULL),
(8, 4, 5, NULL, 'Alimentation', 'alimentation-1785999901003', 'Produits alimentaires et boissons', NULL, 0, 1, '2026-08-07 23:00:38', '2026-08-07 23:00:38', NULL),
(9, 4, 5, NULL, 'Cosmetiques', 'cosmetiques-1785999901004', 'Soins du corps et cosmetiques', NULL, 0, 1, '2026-08-07 23:00:38', '2026-08-07 23:00:38', NULL),
(10, 4, 5, NULL, 'Maison', 'maison-1785999901005', 'Articles pour la maison', NULL, 0, 1, '2026-08-07 23:00:38', '2026-08-07 23:00:38', NULL),
(17, NULL, 5, NULL, 'Téléphones', 't-l-phones-1786704221411', NULL, NULL, 0, 1, '2026-08-14 10:43:41', '2026-08-14 10:43:41', NULL),
(18, NULL, 5, NULL, 'Accessoires', 'accessoires-1786704222152', NULL, NULL, 0, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(19, NULL, 5, NULL, 'Informatique', 'informatique-1786704224031', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(20, NULL, 5, NULL, 'Électroménager', '-lectrom-nager-1786704224237', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(21, NULL, 5, NULL, 'Beauté', 'beaut--1786704224482', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(22, NULL, 5, NULL, 'Vêtements', 'v-tements-1786704224574', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(23, NULL, 5, NULL, 'Quincaillerie', 'quincaillerie-1786704224644', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(24, NULL, 5, NULL, 'Papeterie', 'papeterie-1786704224751', NULL, NULL, 0, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `preferences` json DEFAULT NULL COMMENT 'Préférences client (coiffure, etc.)',
  `total_purchases` decimal(14,2) DEFAULT '0.00',
  `total_purchase_count` int UNSIGNED DEFAULT '0',
  `last_purchase_at` datetime DEFAULT NULL,
  `current_debt` decimal(14,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `company_id`, `first_name`, `last_name`, `full_name`, `phone`, `email`, `address`, `city`, `notes`, `preferences`, `total_purchases`, `total_purchase_count`, `last_purchase_at`, `current_debt`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 'Gabriel', 'toure', 'Gabriel toure', '+223828632060', 'sidibesounk2003@gmail.com', 'Bamako', 'Bamako', 'aucune note suplementaire', NULL, 65000.00, 2, '2026-05-21 13:43:56', 50000.00, 1, '2026-05-20 16:48:29', '2026-05-21 11:43:56', NULL),
(2, 2, 'moussa', 'sidibe', 'moussa sidibe', '+223828632', 'client@gmail.com', 'Bamako', 'Bamako', 'aucune note suplementaire', NULL, 68000.00, 2, '2026-05-21 13:01:45', 34000.00, 1, '2026-05-20 16:51:38', '2026-05-21 11:39:43', NULL),
(3, 2, 'issa', 'bagayoko', 'issa bagayoko', '009877600', NULL, NULL, NULL, NULL, NULL, 8000.00, 1, '2026-05-21 13:51:29', 4000.00, 1, '2026-05-21 10:41:25', '2026-05-21 11:51:29', NULL),
(4, 4, 'Gabrielle', 'toure', 'Gabrielle toure', '+22382863206', 'gab2@gmail.con', 'Bamako', 'Bamako', NULL, NULL, 1080000.00, 3, '2026-08-07 15:16:10', 75000.00, 1, '2026-06-22 21:31:01', '2026-08-07 13:16:32', NULL),
(5, 5, 'isac', 'yiarra', 'isac yiarra', '66557899', NULL, NULL, NULL, NULL, NULL, 10000.00, 1, '2026-06-23 18:53:11', 1000.00, 1, '2026-06-23 16:52:44', '2026-06-23 17:00:35', NULL),
(6, 1, NULL, NULL, 'Test Client', '99999999', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-12 22:41:04', '2026-08-12 22:41:04', NULL),
(7, 4, NULL, NULL, 'Mamadou Traoré', '+223 70 11 22 33', 'mamadou.traore@example.com', 'Hamdallaye ACI 2000', NULL, NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(8, 4, NULL, NULL, 'Fatoumata Coulibaly', '76451289', NULL, 'Badalabougou Rue 12', NULL, NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(9, 4, NULL, NULL, 'Oumar Tounkara', '90657524', 'oumar.tounkara@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(10, 4, NULL, NULL, 'Drissa Sissoko', '+223 76 68 88 81', 'drissa.sissoko@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(11, 4, NULL, NULL, 'Djénébou Traoré', '+223 70 04 24 30', NULL, 'Hippodrome', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(12, 4, NULL, NULL, 'Rokia Sanogo', '+223 63 63 00 84', 'rokia.sanogo@example.com', 'Boulkassoumbougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(13, 4, NULL, NULL, 'Mariam Berthé', '78972965', 'mariam.berthe@example.com', 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(14, 4, NULL, NULL, 'Modibo Sidibé', '+223 70 87 00 27', 'modibo.sidibe@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(15, 4, NULL, NULL, 'Souleymane Kouyaté', '+223 63 43 11 39', 'souleymane.kouyate@example.com', 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(16, 4, NULL, NULL, 'Moussa Traoré', '+223 90 62 22 87', NULL, 'Hippodrome', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(17, 4, NULL, NULL, 'Bintou Ballo', '76505327', 'bintou.ballo@example.com', 'Bacodjicoroni ACI', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(18, 4, NULL, NULL, 'Boubacar Sidibé', '+223 70 18 27 56', 'boubacar.sidibe@example.com', 'Bankoni', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(19, 4, NULL, NULL, 'Souleymane Diakité', '+223 66 74 81 31', 'souleymane.diakite@example.com', 'Banankabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(20, 4, NULL, NULL, 'Seydou Diarra', '+223 79 23 80 19', 'seydou.diarra@example.com', 'Centre Ville', 'Bougouni', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(21, 4, NULL, NULL, 'Issa Ballo', '+223 79 61 77 10', NULL, 'Sogoniko', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(22, 4, NULL, NULL, 'Nènè Cissé', '63537662', 'nene.cisse@example.com', 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(23, 4, NULL, NULL, 'Bakary Bamba', '+223 63 27 26 95', 'bakary.bamba@example.com', 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(24, 4, NULL, NULL, 'Modibo Camara', '+223 76 46 17 57', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(25, 4, NULL, NULL, 'Ramata Coulibaly', '+223 90 45 89 39', NULL, 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(26, 4, NULL, NULL, 'Modibo Maïga', '+223 76 09 57 69', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(27, 4, NULL, NULL, 'Habibatou Koné', '78108760', NULL, 'Quartier du Fleuve', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(28, 4, NULL, NULL, 'Djénébou Samaké', '79740177', 'djenebou.samake@example.com', 'Magnambougou', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(29, 4, NULL, NULL, 'Coumba Maïga', '92585659', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(30, 4, NULL, NULL, 'Souleymane Diarra', '+223 66 89 14 63', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(31, 4, NULL, NULL, 'Modibo Keïta', '+223 91 21 96 43', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(32, 4, NULL, NULL, 'Adama Sow', '66274928', NULL, 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(33, 4, NULL, NULL, 'Alkassoum Guindo', '+223 76 35 21 14', NULL, 'Niamakoro', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(34, 4, NULL, NULL, 'Youssouf Diarra', '92574109', NULL, 'Centre Ville', 'Bougouni', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(35, 4, NULL, NULL, 'Ramata Camara', '92028217', NULL, 'Lafiabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(36, 4, NULL, NULL, 'Oumou Dembélé', '+223 70 80 14 57', 'oumou.dembele@example.com', 'Centre Ville', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(37, 4, NULL, NULL, 'Kani Sow', '+223 90 32 22 91', 'kani.sow@example.com', 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(38, 4, NULL, NULL, 'Karim Camara', '+223 79 89 28 11', NULL, 'Missira', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(39, 4, NULL, NULL, 'Abdoulaye Niaré', '+223 79 70 72 83', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(40, 4, NULL, NULL, 'Zoumana Guindo', '+223 66 31 49 11', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(41, 4, NULL, NULL, 'Fatoumata Camara', '+223 70 56 43 70', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(42, 4, NULL, NULL, 'Mariam Fofana', '+223 65 68 42 87', NULL, 'Sabalibougou', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(43, 4, NULL, NULL, 'Awa Guindo', '90748811', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(44, 4, NULL, NULL, 'Maimouna Konaté', '63854878', 'maimouna.konate@example.com', 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(45, 4, NULL, NULL, 'Amadou Bamba', '+223 91 00 77 48', 'amadou.bamba@example.com', 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:48', '2026-08-14 10:56:48', NULL),
(46, 4, NULL, NULL, 'Ramata Diallo', '76882108', NULL, 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(47, 4, NULL, NULL, 'Nènè Cissé', '90164355', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(48, 4, NULL, NULL, 'Mamadou Koné', '65899902', 'mamadou.kone@example.com', 'Sabalibougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(49, 4, NULL, NULL, 'Aya Kane', '66796313', NULL, 'Bacodjicoroni ACI', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(50, 4, NULL, NULL, 'Nènè Berthé', '+223 91 55 02 48', NULL, 'Sotuba', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(51, 4, NULL, NULL, 'Salimata Ballo', '+223 91 27 69 78', NULL, 'Sabalibougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(52, 4, NULL, NULL, 'Habibatou Camara', '+223 78 77 40 24', 'habibatou.camara@example.com', 'Lafiabougou', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(53, 4, NULL, NULL, 'Issa Diakité', '79125553', NULL, 'Kalabambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(54, 4, NULL, NULL, 'Fousseyni Kéita', '+223 76 25 72 87', NULL, 'Banankabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(55, 4, NULL, NULL, 'Diarrah Maïga', '+223 76 61 13 03', 'diarrah.maïga@example.com', 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(56, 4, NULL, NULL, 'Yacouba Konaté', '+223 66 22 20 36', NULL, 'Sogoniko', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(57, 4, NULL, NULL, 'Karim Diallo', '79595465', NULL, 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(58, 4, NULL, NULL, 'Rokia Konaté', '90469447', NULL, 'Lafiabougou', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(59, 4, NULL, NULL, 'Aya Niaré', '+223 79 72 76 24', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(60, 4, NULL, NULL, 'Coumba Kane', '+223 79 17 42 68', NULL, 'Quartier du Fleuve', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(61, 4, NULL, NULL, 'Mariam Kéita', '63601201', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(62, 4, NULL, NULL, 'Fousseyni Sissoko', '66845172', 'fousseyni.sissoko@example.com', 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(63, 4, NULL, NULL, 'Sitan Diallo', '92021478', 'sitan.diallo@example.com', 'Djicoroni Para', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(64, 4, NULL, NULL, 'Ibrahim Dembélé', '+223 79 01 12 33', 'ibrahim.dembele@example.com', 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(65, 4, NULL, NULL, 'Ramata Tounkara', '+223 90 82 09 70', NULL, 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(66, 4, NULL, NULL, 'Boubacar Tounkara', '91787607', NULL, 'Torokorobougou', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(67, 4, NULL, NULL, 'Sira Sanogo', '90833471', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(68, 4, NULL, NULL, 'Alassane Kouyaté', '+223 65 52 96 87', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(69, 4, NULL, NULL, 'Aya Diakité', '+223 79 92 61 32', NULL, 'Djicoroni Para', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(70, 4, NULL, NULL, 'Mahamadou Kane', '65317790', 'mahamadou.kane@example.com', 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(71, 4, NULL, NULL, 'Sira Sanogo', '+223 76 46 56 17', NULL, 'Hippodrome', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(72, 4, NULL, NULL, 'Sira Dembélé', '+223 63 93 16 30', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(73, 4, NULL, NULL, 'Sira Sangaré', '92879272', NULL, 'Lafiabougou', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(74, 4, NULL, NULL, 'Alassane Sanogo', '+223 70 80 07 01', 'alassane.sanogo@example.com', 'Quartier du Fleuve', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(75, 4, NULL, NULL, 'Alassane Bamba', '76961186', 'alassane.bamba@example.com', 'Centre Ville', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(76, 4, NULL, NULL, 'Yacouba Maïga', '90951709', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(77, 4, NULL, NULL, 'Rokia Touré', '63491947', 'rokia.toure@example.com', 'Bankoni', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(78, 4, NULL, NULL, 'Coumba Guindo', '+223 79 83 47 74', 'coumba.guindo@example.com', 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(79, 4, NULL, NULL, 'Seydou Kouyaté', '90389901', 'seydou.kouyate@example.com', 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(80, 4, NULL, NULL, 'Fanta Kane', '63182845', NULL, 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(81, 4, NULL, NULL, 'Salif Touré', '90673958', 'salif.toure@example.com', 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(82, 4, NULL, NULL, 'Alkassoum Guindo', '70468650', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(83, 4, NULL, NULL, 'Sekou Guindo', '+223 65 11 97 58', NULL, 'Yirimadio', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(84, 4, NULL, NULL, 'Boubacar Kouyaté', '70835408', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(85, 4, NULL, NULL, 'Issa Diallo', '76038183', 'issa.diallo@example.com', 'Boulkassoumbougou', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(86, 4, NULL, NULL, 'Youssouf Maïga', '79444342', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(87, 4, NULL, NULL, 'Lassana Koné', '+223 79 96 85 44', NULL, 'Missira', 'Bougouni', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(88, 4, NULL, NULL, 'Maimouna Traoré', '70145353', NULL, 'Djicoroni Para', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(89, 4, NULL, NULL, 'Boubacar Maïga', '+223 79 54 67 37', 'boubacar.maïga@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(90, 4, NULL, NULL, 'Sekou Dembélé', '+223 70 96 58 02', NULL, 'Badalabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(91, 4, NULL, NULL, 'Alkassoum Sow', '+223 92 91 60 76', NULL, 'Hippodrome', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(92, 4, NULL, NULL, 'Boubacar Koné', '91706133', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(93, 4, NULL, NULL, 'Mariam Diarra', '+223 79 06 27 17', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(94, 4, NULL, NULL, 'Ibrahim Samaké', '+223 70 60 47 57', NULL, 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(95, 4, NULL, NULL, 'Karim Maïga', '+223 63 66 16 81', NULL, 'Bankoni', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(96, 4, NULL, NULL, 'Aissata Kouyaté', '+223 70 26 19 16', 'aissata.kouyate@example.com', 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(97, 4, NULL, NULL, 'Sitan Touré', '+223 92 69 64 38', 'sitan.toure@example.com', 'Lafiabougou', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(98, 4, NULL, NULL, 'Sidiki Touré', '+223 70 69 52 67', NULL, 'Yirimadio', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(99, 4, NULL, NULL, 'Oumar Sissoko', '76460987', 'oumar.sissoko@example.com', 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(100, 4, NULL, NULL, 'Kadiatou Ballo', '70489190', NULL, 'Yirimadio', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(101, 4, NULL, NULL, 'Zoumana Kéita', '+223 92 19 37 80', NULL, 'Baco Djicoroni', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(102, 4, NULL, NULL, 'Salimata Samaké', '+223 63 24 25 48', NULL, 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(103, 4, NULL, NULL, 'Coumba Ballo', '90481113', 'coumba.ballo@example.com', 'Sogoniko', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(104, 4, NULL, NULL, 'Djeneba Konaté', '+223 79 04 59 75', NULL, 'Sogoniko', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(105, 4, NULL, NULL, 'Moussa Fofana', '76435465', 'moussa.fofana@example.com', 'Lafiabougou', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(106, 4, NULL, NULL, 'Cheick Koné', '92019351', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(107, 4, NULL, NULL, 'Awa Traoré', '78244339', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(108, 4, NULL, NULL, 'Modibo Guindo', '+223 92 91 20 32', NULL, 'Yirimadio', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(109, 4, NULL, NULL, 'Aissata Kouyaté', '+223 91 91 90 25', NULL, 'Centre Ville', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(110, 4, NULL, NULL, 'Alassane Diarra', '78421146', 'alassane.diarra@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(111, 4, NULL, NULL, 'Seydou Bamba', '+223 91 33 21 95', NULL, 'Faladié', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(112, 4, NULL, NULL, 'Hawa Samaké', '66977346', NULL, 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(113, 4, NULL, NULL, 'Bourama Konaté', '+223 63 96 85 94', NULL, 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(114, 4, NULL, NULL, 'Yacouba Fofana', '70186749', 'yacouba.fofana@example.com', 'Missira', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(115, 4, NULL, NULL, 'Nènè Cissé', '70820492', NULL, 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(116, 4, NULL, NULL, 'Alkassoum Fofana', '63625988', NULL, 'Quartier du Fleuve', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(117, 4, NULL, NULL, 'Youssouf Maïga', '79034106', 'youssouf.maïga@example.com', 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(118, 4, NULL, NULL, 'Diarrah Kéita', '92083115', NULL, 'Centre Ville', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(119, 4, NULL, NULL, 'Moussa Sanogo', '+223 91 39 84 50', NULL, 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(120, 4, NULL, NULL, 'Salimata Fofana', '+223 66 83 95 53', NULL, 'Magnambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(121, 4, NULL, NULL, 'Kadiatou Niaré', '70373193', 'kadiatou.niare@example.com', 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(122, 4, NULL, NULL, 'Drissa Guindo', '65458874', 'drissa.guindo@example.com', 'Yirimadio', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(123, 4, NULL, NULL, 'Hawa Maïga', '65999960', NULL, 'Lafiabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(124, 4, NULL, NULL, 'Aminata Sow', '78600222', NULL, 'Kalabambougou', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(125, 4, NULL, NULL, 'Ibrahim Ballo', '+223 63 92 40 35', NULL, 'Kalabambougou', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(126, 4, NULL, NULL, 'Diarrah Touré', '76212839', 'diarrah.toure@example.com', 'Kalabambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(127, 4, NULL, NULL, 'Alassane Sanogo', '63478467', NULL, 'Bacodjicoroni ACI', 'Ségou', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:49', '2026-08-14 10:56:49', NULL),
(128, 4, NULL, NULL, 'Djeneba Samaké', '+223 63 16 81 85', 'djeneba.samake@example.com', 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 0, '2026-08-14 10:56:50', '2026-08-14 15:18:51', NULL),
(129, 4, NULL, NULL, 'Aminata Traoré', '91325472', 'aminata.traore@example.com', 'Yirimadio', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 0, '2026-08-14 10:56:50', '2026-08-14 15:18:51', NULL),
(130, 4, NULL, NULL, 'Oumar Traoré', '+223 65 04 79 59', NULL, 'Bacodjicoroni ACI', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 0, '2026-08-14 10:56:50', '2026-08-14 15:18:51', NULL),
(131, 4, NULL, NULL, 'Boubacar Diakité', '78846104', NULL, 'Centre Ville', 'Bougouni', NULL, NULL, 0.00, 0, NULL, 0.00, 0, '2026-08-14 10:56:50', '2026-08-14 15:18:51', NULL),
(132, 4, NULL, NULL, 'Coumba Bamba', '+223 92 99 98 21', 'coumba.bamba@example.com', 'Quartier du Fleuve', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 0, '2026-08-14 10:56:50', '2026-08-14 15:18:51', NULL),
(133, 4, NULL, NULL, 'Karim Sangaré', '+223 63 62 69 28', NULL, 'Bankoni', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(134, 4, NULL, NULL, 'Sitan Coulibaly', '65411977', 'sitan.coulibaly@example.com', 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(135, 4, NULL, NULL, 'Habibatou Traoré', '+223 76 22 72 81', NULL, 'Djicoroni Para', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(136, 4, NULL, NULL, 'Salif Maïga', '92631183', NULL, 'Kalaban Coura', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(137, 4, NULL, NULL, 'Fousseyni Guindo', '70405259', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(138, 4, NULL, NULL, 'Karim Dembélé', '+223 65 95 58 66', NULL, 'Badalabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(139, 4, NULL, NULL, 'Youssouf Keïta', '+223 79 71 38 60', NULL, 'Magnambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(140, 4, NULL, NULL, 'Diarrah Kane', '+223 63 32 15 70', NULL, 'Quartier du Fleuve', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(141, 4, NULL, NULL, 'Cheick Koné', '+223 70 20 51 74', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(142, 4, NULL, NULL, 'Ramata Koné', '+223 90 50 27 48', NULL, 'Badalabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(143, 4, NULL, NULL, 'Boubacar Kéita', '+223 90 26 51 27', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(144, 4, NULL, NULL, 'Fanta Sow', '79090688', 'fanta.sow@example.com', 'Niamakoro', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(145, 4, NULL, NULL, 'Awa Sidibé', '+223 63 13 46 07', 'awa.sidibe@example.com', 'Banankabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(146, 4, NULL, NULL, 'Sidiki Koné', '+223 70 41 49 57', 'sidiki.kone@example.com', 'Missira', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(147, 4, NULL, NULL, 'Awa Samaké', '+223 63 50 77 30', NULL, 'Lafiabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(148, 4, NULL, NULL, 'Aminata Sow', '79546169', NULL, 'Centre Ville', 'Kati', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(149, 4, NULL, NULL, 'Kani Sidibé', '+223 66 35 68 91', NULL, 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(150, 4, NULL, NULL, 'Modibo Camara', '92271705', NULL, 'Centre Ville', 'Kayes', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(151, 4, NULL, NULL, 'Coumba Sissoko', '+223 66 71 88 45', NULL, 'Banankabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(152, 4, NULL, NULL, 'Mariam Kéita', '76506307', NULL, 'Faladié', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(153, 4, NULL, NULL, 'Oumou Konaté', '66609821', NULL, 'Kalabambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(154, 4, NULL, NULL, 'Cheick Koné', '65617432', NULL, 'Baco Djicoroni', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(155, 4, NULL, NULL, 'Assitan Diallo', '76513406', NULL, 'Bacodjicoroni ACI', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(156, 4, NULL, NULL, 'Nènè Diakité', '+223 70 44 41 47', NULL, 'Centre Ville', 'Bougouni', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(157, 4, NULL, NULL, 'Assitan Doumbia', '78037390', NULL, 'Magnambougou', 'Koutiala', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(158, 4, NULL, NULL, 'Amadou Diakité', '76595748', NULL, 'Missira', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(159, 4, NULL, NULL, 'Youssouf Sangaré', '90466002', 'youssouf.sangare@example.com', 'Lafiabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(160, 4, NULL, NULL, 'Alassane Cissé', '+223 91 50 00 30', NULL, 'Centre Ville', 'Gao', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(161, 4, NULL, NULL, 'Sitan Kéita', '63441302', 'sitan.keita@example.com', 'Kalabambougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(162, 4, NULL, NULL, 'Boubacar Sow', '+223 65 42 79 88', NULL, 'Bacodjicoroni ACI', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(163, 4, NULL, NULL, 'Alkassoum Kane', '66823146', 'alkassoum.kane@example.com', 'Centre Ville', 'San', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(164, 4, NULL, NULL, 'Mariam Guindo', '+223 63 14 57 65', NULL, 'Torokorobougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(165, 4, NULL, NULL, 'Bintou Tounkara', '70443250', NULL, 'Kalabambougou', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(166, 4, NULL, NULL, 'Salif Samaké', '65429726', NULL, 'Centre Ville', 'Mopti', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(167, 4, NULL, NULL, 'Djénébou Kane', '65162548', NULL, 'Yirimadio', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(168, 4, NULL, NULL, 'Mamadou Diarra', '+223 63 88 34 53', 'mamadou.diarra@example.com', 'Centre Ville', 'Sikasso', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(169, 4, NULL, NULL, 'Boutique Aminata Mode SARL', '+223 44 55 66 77', 'contact@aminatamode.ml', 'Marché Rose', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(170, 4, NULL, NULL, 'Restaurant Le Sahel', '+223 44 22 33 44', NULL, 'Route de Koulikoro', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL),
(171, 4, NULL, NULL, 'École Privée Les Flamboyants', '+223 44 88 99 00', 'administration@flamboyants.ml', 'Badalabougou', 'Bamako', NULL, NULL, 0.00, 0, NULL, 0.00, 1, '2026-08-14 10:56:50', '2026-08-14 10:56:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `client_debts`
--

CREATE TABLE `client_debts` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `sale_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Lié à une vente spécifique',
  `total_amount` decimal(12,2) NOT NULL COMMENT 'Montant total de la dette',
  `remaining_amount` decimal(12,2) NOT NULL COMMENT 'Reste à payer',
  `status` enum('pending','partial','paid','overdue','canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `due_date` date DEFAULT NULL COMMENT 'Date d''échéance',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_debts`
--

INSERT INTO `client_debts` (`id`, `company_id`, `client_id`, `sale_id`, `total_amount`, `remaining_amount`, `status`, `due_date`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 7, 20000.00, 5000.00, 'partial', '2026-06-07', NULL, 2, '2026-05-21 10:57:01', '2026-05-21 11:41:27'),
(2, 2, 2, 8, 34000.00, 34000.00, 'pending', '2026-06-06', NULL, 2, '2026-05-21 10:59:17', '2026-05-21 10:59:17'),
(3, 2, 2, 9, 34000.00, 0.00, 'canceled', NULL, NULL, 2, '2026-05-21 11:01:45', '2026-05-21 11:39:43'),
(4, 2, 1, 10, 45000.00, 45000.00, 'pending', '2026-06-21', NULL, 2, '2026-05-21 11:43:55', '2026-05-21 11:43:55'),
(5, 2, 3, 11, 8000.00, 4000.00, 'partial', '2026-05-30', NULL, 2, '2026-05-21 11:51:29', '2026-05-21 11:51:29'),
(6, 4, 4, 14, 200000.00, 75000.00, 'partial', '2026-06-27', NULL, 5, '2026-06-22 21:31:44', '2026-08-07 12:53:57'),
(7, 4, 4, 15, 480000.00, 0.00, 'paid', '2026-07-22', NULL, 5, '2026-06-22 21:38:28', '2026-06-23 11:17:51'),
(8, 5, 5, 17, 10000.00, 1000.00, 'partial', '2026-08-01', NULL, 5, '2026-06-23 16:53:11', '2026-06-23 17:00:35'),
(9, 4, 4, 32, 400000.00, 0.00, 'canceled', '2026-09-06', NULL, 5, '2026-08-07 13:16:09', '2026-08-07 13:16:32'),
(10, 1, 6, NULL, 10000.00, 10000.00, 'pending', NULL, NULL, NULL, '2026-08-12 22:42:26', '2026-08-12 22:42:26');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID pour API publique',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_type_id` tinyint UNSIGNED NOT NULL,
  `subscription_plan_id` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `subscription_status` enum('active','past_due','canceled','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `subscription_ends_at` datetime DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL COMMENT 'Paramètres spécifiques entreprise',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete',
  `trial_ends_at` datetime DEFAULT NULL COMMENT 'Fin période essai',
  `subscription_started_at` datetime DEFAULT NULL,
  `grace_period_ends_at` datetime DEFAULT NULL COMMENT 'Période de grâce après expiration',
  `payment_reminder_sent_at` datetime DEFAULT NULL,
  `payment_reminder_count` int DEFAULT '0',
  `last_subscription_check_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `uuid`, `name`, `slug`, `description`, `logo_url`, `business_type_id`, `subscription_plan_id`, `subscription_status`, `subscription_ends_at`, `country`, `city`, `address`, `phone`, `settings`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `trial_ends_at`, `subscription_started_at`, `grace_period_ends_at`, `payment_reminder_sent_at`, `payment_reminder_count`, `last_subscription_check_at`) VALUES
(1, '6e4ab3ae-1e9d-488e-9857-622daf404991', 'sounkalo_shop', 'sounkaloshop', 'vente d\'article electronique ', NULL, 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '828632060', '{}', 1, '2026-05-18 14:47:47', '2026-05-18 14:47:47', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(2, 'a04f9d8c-380e-4212-9537-7481989b04ef', 'isac_electro', 'isac-electro-1779202532604', 'electronique de chez isac ', 'http://localhost:5000/uploads/companies/company-1779202532562-781311330.jpg', 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+2238286320600', NULL, 1, '2026-05-19 14:55:32', '2026-05-19 14:55:32', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(3, '73755149-c9b0-400f-988e-1ff4f0279d23', 'mobilier_chez_isac', 'mobilier-chez-isac-1779202948386', 'vente de mobilier de bureau', 'http://localhost:5000/uploads/companies/company-1779202948369-40338303.png', 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+2238286320600', NULL, 1, '2026-05-19 15:02:28', '2026-05-19 15:02:28', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(4, 'd3fc9b91-b2e5-47f0-b909-bca66ec2b1fc', 'kaba_shops', 'kaba-shops-1782149770861', 'vente d\'articles ', NULL, 1, 5, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '000000067', NULL, 1, '2026-06-22 00:42:50', '2026-07-22 11:05:55', NULL, NULL, '2026-06-22 21:43:03', NULL, NULL, 0, NULL),
(5, '33353811-3383-49ab-be2b-90a31a617fab', 'kaba_restau', 'kaba-restau-1782216374418', 'aucune', NULL, 3, 5, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+2238289999', NULL, 1, '2026-06-23 12:06:14', '2026-07-22 11:05:55', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(6, 'f015513e-40b9-41d8-b760-c00c708686ad', 'Djessy ', 'djessy-1782307996307', NULL, NULL, 3, 1, 'active', NULL, 'Mali', 'Bamako ', '123', '72122412', NULL, 1, '2026-06-24 13:33:16', '2026-06-24 13:33:16', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(7, '23852cc8-4a5c-4993-bc08-f0fd7e1fe203', 'ib_dollars', 'ib-dollars-1783956353971', 'entreprise de vente de materiel ', NULL, 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+22382863000', NULL, 1, '2026-07-13 15:25:54', '2026-07-13 15:25:54', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(8, '5618099e-ab63-4c21-b1d8-d88e443aeb68', 'iba_shop', 'iba-shop-1784718832710', 'ma boutique cool', NULL, 1, 5, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+223828632064', NULL, 1, '2026-07-22 11:13:52', '2026-07-22 11:13:52', NULL, NULL, NULL, NULL, NULL, 0, NULL),
(9, '11953091-9f02-40fa-898b-5dcc13a671f3', 'traore-shop', 'traore-shop-1785504961253', 'vente d\'articles pour home', NULL, 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '23221111', NULL, 1, '2026-07-31 13:36:01', '2026-07-31 13:36:01', NULL, NULL, NULL, NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_subscription_history`
--

CREATE TABLE `company_subscription_history` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `plan_id` tinyint UNSIGNED NOT NULL,
  `action` enum('new_subscription','renewed','upgraded','downgraded','expired','canceled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `price_paid` decimal(12,2) DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'XOF',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `debt_payments`
--

CREATE TABLE `debt_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `client_debt_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'N° transaction mobile money, etc.',
  `payment_date` date NOT NULL,
  `received_by` bigint UNSIGNED DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `debt_payments`
--

INSERT INTO `debt_payments` (`id`, `company_id`, `client_debt_id`, `amount`, `payment_method`, `payment_reference`, `payment_date`, `received_by`, `note`, `created_at`) VALUES
(2, 2, 1, 15000.00, 'mobile_money', NULL, '2026-05-21', 2, NULL, '2026-05-21 11:41:27'),
(3, 2, 5, 4000.00, 'cash', NULL, '2026-05-21', 2, 'Paiement initial', '2026-05-21 11:51:29'),
(4, 4, 6, 50000.00, 'cash', NULL, '2026-06-22', 5, 'Paiement initial', '2026-06-22 21:31:44'),
(5, 4, 7, 250000.00, 'cash', NULL, '2026-06-22', 5, 'Paiement initial', '2026-06-22 21:38:28'),
(6, 4, 7, 100000.00, 'cash', NULL, '2026-06-22', 5, NULL, '2026-06-22 21:40:15'),
(7, 4, 7, 130000.00, 'cash', NULL, '2026-06-23', 5, NULL, '2026-06-23 11:17:51'),
(8, 5, 8, 3000.00, 'cash', NULL, '2026-06-23', 5, 'Paiement initial', '2026-06-23 16:53:11'),
(9, 5, 8, 2000.00, 'cash', NULL, '2026-06-23', 5, NULL, '2026-06-23 16:53:55'),
(10, 5, 8, 2000.00, 'cash', NULL, '2026-06-23', 5, NULL, '2026-06-23 16:54:10'),
(11, 5, 8, 2000.00, 'cash', NULL, '2026-06-23', 5, NULL, '2026-06-23 16:54:39'),
(13, 4, 6, 75000.00, 'mobile_money', NULL, '2026-08-07', 5, NULL, '2026-08-07 12:53:57');

-- --------------------------------------------------------

--
-- Table structure for table `employee_schedules`
--

CREATE TABLE `employee_schedules` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `day_of_week` tinyint UNSIGNED NOT NULL COMMENT '0=Dimanche, 6=Samedi',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_start` time DEFAULT NULL,
  `break_end` time DEFAULT NULL,
  `is_day_off` tinyint(1) DEFAULT '0',
  `valid_from` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` enum('rent','salary','utility','transport','maintenance','inventory','tax','marketing','equipment','internet','mobile_money_fee','bank_fee','restaurant_supply','salon_supply','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'XOF',
  `payment_method` enum('cash','mobile_money','bank_transfer','check','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence transaction mobile money / banque',
  `expense_date` date NOT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `company_id`, `title`, `description`, `category`, `amount`, `currency`, `payment_method`, `payment_reference`, `expense_date`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 'nourriture', '', 'rent', 15000.00, 'XOF', 'cash', '', '2026-05-20', 2, '2026-05-21 21:31:53', '2026-05-21 21:37:56', NULL),
(2, 4, 'factures', '', 'maintenance', 200000.00, 'XOF', 'cash', '', '2026-06-21', 5, '2026-06-22 19:30:21', '2026-08-14 13:02:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_counts`
--

CREATE TABLE `inventory_counts` (
  `id` bigint UNSIGNED NOT NULL,
  `reference` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` enum('all_products','by_category','by_supplier','manual') COLLATE utf8mb4_unicode_ci DEFAULT 'all_products',
  `scope_ids` json DEFAULT NULL,
  `status` enum('draft','in_progress','completed','validated','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `counted_by` bigint UNSIGNED DEFAULT NULL,
  `validated_by` bigint UNSIGNED DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_products` int DEFAULT '0',
  `total_discrepancies` int DEFAULT '0',
  `total_discrepancy_value` decimal(14,2) DEFAULT '0.00',
  `canceled_at` datetime DEFAULT NULL,
  `canceled_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_counts`
--

INSERT INTO `inventory_counts` (`id`, `reference`, `company_id`, `name`, `scope_type`, `scope_ids`, `status`, `counted_by`, `validated_by`, `started_at`, `completed_at`, `notes`, `total_products`, `total_discrepancies`, `total_discrepancy_value`, `canceled_at`, `canceled_by`, `created_at`, `updated_at`) VALUES
(1, 'INV-202607-001', 4, 'inventaire mensuelle juillet 2026', 'all_products', NULL, 'validated', 5, 5, '2026-07-31 18:33:11', '2026-07-31 18:38:19', NULL, 4, 3, -290000.00, NULL, NULL, '2026-07-31 16:30:29', '2026-07-31 16:38:56'),
(2, 'INV-202607-002', 4, 'inventaire fin aout 2026', 'all_products', NULL, 'canceled', 5, NULL, '2026-07-31 18:53:32', NULL, NULL, 0, 0, 0.00, '2026-07-31 19:07:12', 5, '2026-07-31 16:51:57', '2026-07-31 17:07:12'),
(3, 'INV-202607-003', 4, 'invententaire fin septembre 2026', 'all_products', NULL, 'in_progress', 5, NULL, '2026-07-31 18:59:33', NULL, NULL, 0, 0, 0.00, NULL, NULL, '2026-07-31 16:53:12', '2026-07-31 16:59:33');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_count_items`
--

CREATE TABLE `inventory_count_items` (
  `id` bigint UNSIGNED NOT NULL,
  `inventory_count_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `theoretical_qty` decimal(12,3) NOT NULL,
  `counted_qty` decimal(12,3) DEFAULT NULL,
  `difference` decimal(12,3) DEFAULT NULL COMMENT 'counted - theoretical',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `discrepancy_value` decimal(14,2) DEFAULT NULL,
  `justification` enum('breakage','theft','loss','found','data_entry_error','supplier_error','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justification_note` text COLLATE utf8mb4_unicode_ci,
  `counted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_count_items`
--

INSERT INTO `inventory_count_items` (`id`, `inventory_count_id`, `product_id`, `variant_id`, `theoretical_qty`, `counted_qty`, `difference`, `note`, `unit_cost`, `discrepancy_value`, `justification`, `justification_note`, `counted_at`, `created_at`) VALUES
(1, 1, 3, NULL, 7.000, 6.000, -1.000, NULL, 200000.00, -200000.00, NULL, NULL, '2026-07-31 18:31:33', '2026-07-31 16:30:29'),
(2, 1, 6, NULL, 20.000, 21.000, 1.000, NULL, 250000.00, 250000.00, NULL, NULL, '2026-07-31 18:31:37', '2026-07-31 16:30:29'),
(3, 1, 4, NULL, 97.000, 95.000, -2.000, NULL, 170000.00, -340000.00, NULL, NULL, '2026-07-31 18:31:40', '2026-07-31 16:30:29'),
(4, 1, 7, NULL, 110.000, 110.000, 0.000, NULL, 5000.00, 0.00, NULL, NULL, '2026-07-31 18:31:47', '2026-07-31 16:30:29'),
(5, 2, 3, NULL, 6.000, 6.000, 0.000, NULL, 200000.00, 0.00, NULL, NULL, '2026-07-31 18:53:52', '2026-07-31 16:51:57'),
(6, 2, 6, NULL, 21.000, 22.000, 1.000, NULL, 250000.00, 250000.00, 'found', NULL, '2026-07-31 18:53:54', '2026-07-31 16:51:57'),
(7, 2, 4, NULL, 95.000, NULL, NULL, NULL, 170000.00, NULL, NULL, NULL, NULL, '2026-07-31 16:51:57'),
(8, 2, 7, NULL, 110.000, NULL, NULL, NULL, 5000.00, NULL, NULL, NULL, NULL, '2026-07-31 16:51:57'),
(9, 3, 3, NULL, 6.000, 3.000, -3.000, NULL, 200000.00, -600000.00, NULL, NULL, '2026-07-31 18:59:45', '2026-07-31 16:53:12'),
(10, 3, 6, NULL, 21.000, 23.000, 2.000, NULL, 250000.00, 500000.00, NULL, NULL, '2026-07-31 18:59:51', '2026-07-31 16:53:12'),
(11, 3, 4, NULL, 95.000, NULL, NULL, NULL, 170000.00, NULL, NULL, NULL, NULL, '2026-07-31 16:53:12'),
(12, 3, 7, NULL, 110.000, NULL, NULL, NULL, 5000.00, NULL, NULL, NULL, NULL, '2026-07-31 16:53:12');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `movement_type` enum('purchase','sale','return_customer','return_supplier','adjustment','loss','expiry','transfer_in','transfer_out','production','consumption','return_defective') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL COMMENT 'Positif=entrée, Négatif=sortie',
  `stock_before` decimal(12,3) NOT NULL,
  `stock_after` decimal(12,3) NOT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'sale, supplier_order, inventory_count',
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL COMMENT 'Coût unitaire au moment du mouvement',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `performed_by` bigint UNSIGNED DEFAULT NULL COMMENT 'Utilisateur ayant fait l''opération',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `company_id`, `product_id`, `variant_id`, `movement_type`, `quantity`, `stock_before`, `stock_after`, `reference_type`, `reference_id`, `unit_cost`, `note`, `performed_by`, `created_at`) VALUES
(1, 2, 2, NULL, 'sale', -2.000, 50.000, 48.000, 'sale', 1, 7500.00, NULL, 2, '2026-05-20 11:16:33'),
(2, 2, 2, NULL, 'return_customer', 2.000, 48.000, 50.000, 'sale', 1, NULL, NULL, 2, '2026-05-20 11:17:07'),
(3, 2, 2, NULL, 'sale', -3.000, 50.000, 47.000, 'sale', 2, 7500.00, NULL, 2, '2026-05-20 11:20:37'),
(4, 2, 2, NULL, 'sale', -3.000, 47.000, 44.000, 'sale', 3, 7500.00, NULL, 2, '2026-05-20 11:22:21'),
(5, 2, 2, NULL, 'return_customer', 3.000, 44.000, 47.000, 'sale', 3, NULL, NULL, 2, '2026-05-20 12:43:36'),
(6, 2, 2, NULL, 'sale', -4.000, 47.000, 43.000, 'sale', 3, 7500.00, NULL, 2, '2026-05-20 12:43:36'),
(7, 2, 2, NULL, 'return_customer', 4.000, 43.000, 47.000, 'sale', 3, NULL, NULL, 2, '2026-05-20 13:28:08'),
(8, 2, 2, NULL, 'return_customer', 3.000, 43.000, 46.000, 'sale', 3, NULL, NULL, 2, '2026-05-20 13:28:08'),
(9, 2, 2, NULL, 'sale', -3.000, 46.000, 43.000, 'sale', 3, 7500.00, NULL, 2, '2026-05-20 13:28:08'),
(10, 2, 2, NULL, 'sale', -3.000, 43.000, 40.000, 'sale', 4, 7500.00, NULL, 2, '2026-05-20 13:47:39'),
(11, 2, 2, NULL, 'return_customer', 3.000, 40.000, 43.000, 'sale', 4, NULL, NULL, 2, '2026-05-20 13:48:43'),
(12, 2, 2, NULL, 'sale', -3.000, 43.000, 40.000, 'sale', 5, 7500.00, NULL, 2, '2026-05-20 15:15:58'),
(13, 2, 2, NULL, 'sale', -2.000, 40.000, 38.000, 'sale', 6, 7500.00, NULL, 2, '2026-05-20 21:02:19'),
(14, 2, 2, NULL, 'sale', -2.000, 38.000, 36.000, 'sale', 7, 7500.00, NULL, 2, '2026-05-21 10:57:01'),
(15, 2, 2, NULL, 'sale', -4.000, 36.000, 32.000, 'sale', 8, 7500.00, NULL, 2, '2026-05-21 10:59:17'),
(16, 2, 2, NULL, 'sale', -4.000, 32.000, 28.000, 'sale', 9, 7500.00, NULL, 2, '2026-05-21 11:01:45'),
(17, 2, 2, NULL, 'sale', -3.000, 28.000, 25.000, 'sale', 10, 7500.00, NULL, 2, '2026-05-21 11:43:55'),
(18, 2, 2, NULL, 'sale', -1.000, 25.000, 24.000, 'sale', 11, 7500.00, NULL, 2, '2026-05-21 11:51:29'),
(19, 4, 3, NULL, 'purchase', 5.000, 5.000, 10.000, 'supplier_order', 1, 140000.00, NULL, 5, '2026-06-22 13:08:21'),
(20, 4, 4, NULL, 'sale', -1.000, 100.000, 99.000, 'sale', 12, 170000.00, NULL, 5, '2026-06-22 20:21:52'),
(21, 4, 4, NULL, 'sale', -1.000, 99.000, 98.000, 'sale', 13, 170000.00, NULL, 5, '2026-06-22 21:15:22'),
(22, 4, 3, NULL, 'sale', -1.000, 10.000, 9.000, 'sale', 14, 140000.00, NULL, 5, '2026-06-22 21:31:44'),
(23, 4, 4, NULL, 'sale', -1.000, 98.000, 97.000, 'sale', 15, 170000.00, NULL, 5, '2026-06-22 21:38:28'),
(24, 4, 7, NULL, 'purchase', 50.000, 10.000, 60.000, 'supplier_order', 3, 5000.00, NULL, 5, '2026-07-21 14:51:28'),
(25, 4, 7, NULL, 'transfer_in', 20.000, 60.000, 80.000, 'warehouse_transfer', NULL, NULL, 'Réception depuis entrepôt entrepot principal', 5, '2026-07-21 14:54:06'),
(26, 4, 7, NULL, 'purchase', 5.000, 80.000, 85.000, NULL, NULL, 5000.00, 'Ajustement manuel', 5, '2026-07-21 15:14:18'),
(27, 4, 7, NULL, 'purchase', 20.000, 85.000, 105.000, NULL, NULL, 5000.00, 'Ajustement manuel', 5, '2026-07-21 15:14:31'),
(28, 4, 7, NULL, 'purchase', 10.000, 105.000, 115.000, NULL, NULL, 5000.00, 'Ajustement manuel', 5, '2026-07-21 15:14:43'),
(29, 4, 7, NULL, 'sale', -10.000, 115.000, 105.000, 'sale', 18, 5000.00, NULL, 5, '2026-07-21 16:44:49'),
(30, 4, 7, NULL, 'return_customer', 5.000, 105.000, 110.000, 'sale', 18, 5000.00, NULL, 5, '2026-07-21 16:53:31'),
(31, 4, 7, NULL, 'return_customer', 1.000, 110.000, 111.000, 'sale', 18, 5000.00, NULL, 5, '2026-07-22 16:32:20'),
(32, 4, 3, NULL, 'sale', -2.000, 9.000, 7.000, 'sale', 19, 200000.00, NULL, 5, '2026-07-22 16:38:31'),
(33, 4, 3, NULL, 'return_customer', 1.000, 7.000, 8.000, 'sale', 19, 200000.00, NULL, 5, '2026-07-22 16:38:50'),
(34, 4, 7, NULL, 'sale', -1.000, 111.000, 110.000, 'sale', 20, 5000.00, NULL, 10, '2026-07-23 10:38:01'),
(35, 4, 3, NULL, 'sale', -1.000, 8.000, 7.000, 'sale', 21, 200000.00, NULL, 10, '2026-07-23 10:58:15'),
(36, 4, 3, NULL, 'adjustment', -1.000, 7.000, 6.000, 'inventory_count', 1, 200000.00, '[Inventaire 1] Ajustement inventaire', 5, '2026-07-31 16:38:55'),
(37, 4, 4, NULL, 'adjustment', -2.000, 97.000, 95.000, 'inventory_count', 1, 170000.00, '[Inventaire 1] Ajustement inventaire', 5, '2026-07-31 16:38:56'),
(38, 4, 6, NULL, 'adjustment', 1.000, 20.000, 21.000, 'inventory_count', 1, 250000.00, '[Inventaire 1] Ajustement inventaire', 5, '2026-07-31 16:38:56'),
(39, 4, 7, NULL, 'sale', -4.000, 110.000, 106.000, 'sale', 22, 5000.00, NULL, 5, '2026-08-03 14:44:09'),
(40, 4, 7, NULL, 'sale', -3.000, 106.000, 103.000, 'sale', 23, 5000.00, NULL, 5, '2026-08-03 14:46:12'),
(41, 4, 7, NULL, 'sale', -3.000, 103.000, 100.000, 'sale', 24, 5000.00, NULL, 5, '2026-08-03 14:52:06'),
(42, 4, 7, NULL, 'sale', -5.000, 100.000, 95.000, 'sale', 25, 5000.00, NULL, 5, '2026-08-03 16:19:40'),
(43, 4, 7, NULL, 'sale', -2.000, 95.000, 93.000, 'sale', 26, 5000.00, NULL, 5, '2026-08-03 16:29:27'),
(44, 4, 7, NULL, 'sale', -2.000, 93.000, 91.000, 'sale', 27, 5000.00, NULL, 5, '2026-08-03 16:32:05'),
(45, 4, 7, NULL, 'sale', -3.000, 91.000, 88.000, 'sale', 28, 5000.00, NULL, 19, '2026-08-04 14:20:10'),
(46, 4, 4, NULL, 'sale', -2.000, 95.000, 93.000, 'sale', 29, 170000.00, NULL, 18, '2026-08-07 12:36:55'),
(47, 4, 7, NULL, 'sale', -3.000, 88.000, 85.000, 'sale', 29, 5000.00, NULL, 18, '2026-08-07 12:36:55'),
(48, 4, 7, NULL, 'sale', -2.000, 85.000, 83.000, 'sale', 30, 5000.00, NULL, 18, '2026-08-07 12:43:16'),
(49, 4, 3, NULL, 'sale', -1.000, 6.000, 5.000, 'sale', 31, 200000.00, NULL, 18, '2026-08-07 12:43:56'),
(50, 4, 4, NULL, 'sale', -1.000, 93.000, 92.000, 'sale', 31, 170000.00, NULL, 18, '2026-08-07 12:43:57'),
(51, 4, 4, NULL, 'sale', -2.000, 92.000, 90.000, 'sale', 32, 170000.00, NULL, 5, '2026-08-07 13:16:09'),
(52, 4, 48, NULL, 'sale', -4.000, 60.000, 56.000, 'sale', 33, 600.00, NULL, 5, '2026-08-08 03:05:55'),
(53, 4, 29, NULL, 'sale', -1.000, 20.000, 19.000, 'sale', 33, 18000.00, NULL, 5, '2026-08-08 03:05:55'),
(54, 4, 51, NULL, 'sale', -1.000, 45.000, 44.000, 'sale', 33, 2500.00, NULL, 5, '2026-08-08 03:05:55'),
(55, 4, 48, NULL, 'return_customer', 1.000, 56.000, 57.000, 'sale', 33, 600.00, 'not_satisfied', 5, '2026-08-08 03:07:03'),
(56, 1, 53, NULL, 'sale', -1.000, 100.000, 99.000, 'sale', 34, 500.00, NULL, 1, '2026-08-12 22:42:08'),
(57, 1, 53, NULL, 'sale', -1.000, 99.000, 98.000, 'sale', 35, 500.00, NULL, 1, '2026-08-12 22:42:27'),
(58, 1, 53, NULL, 'sale', -1.000, 98.000, 97.000, 'sale', 36, 500.00, NULL, 1, '2026-08-12 22:42:45'),
(59, 1, 53, NULL, 'sale', -1.000, 97.000, 96.000, 'sale', 37, 500.00, NULL, 1, '2026-08-12 22:43:44'),
(65, 4, 61, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 95000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:41'),
(66, 4, 62, NULL, 'adjustment', 50.000, 0.000, 50.000, 'import', NULL, 4000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(67, 4, 63, NULL, 'adjustment', 7.000, 0.000, 7.000, 'import', NULL, 62000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(68, 4, 64, NULL, 'adjustment', 11.000, 0.000, 11.000, 'import', NULL, 86000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(69, 4, 65, NULL, 'adjustment', 7.000, 0.000, 7.000, 'import', NULL, 112000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(70, 4, 66, NULL, 'adjustment', 17.000, 0.000, 17.000, 'import', NULL, 360000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(71, 4, 67, NULL, 'adjustment', 6.000, 0.000, 6.000, 'import', NULL, 78000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(72, 4, 68, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 66000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(73, 4, 69, NULL, 'adjustment', 10.000, 0.000, 10.000, 'import', NULL, 120000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(74, 4, 70, NULL, 'adjustment', 11.000, 0.000, 11.000, 'import', NULL, 108000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(75, 4, 71, NULL, 'adjustment', 12.000, 0.000, 12.000, 'import', NULL, 72000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(76, 4, 72, NULL, 'adjustment', 17.000, 0.000, 17.000, 'import', NULL, 96000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(77, 4, 73, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 49000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(78, 4, 74, NULL, 'adjustment', 7.000, 0.000, 7.000, 'import', NULL, 148000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(79, 4, 75, NULL, 'adjustment', 7.000, 0.000, 7.000, 'import', NULL, 34000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(80, 4, 76, NULL, 'adjustment', 12.000, 0.000, 12.000, 'import', NULL, 44000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(81, 4, 77, NULL, 'adjustment', 7.000, 0.000, 7.000, 'import', NULL, 60000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(82, 4, 78, NULL, 'adjustment', 6.000, 0.000, 6.000, 'import', NULL, 105000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(83, 4, 79, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 138000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:42'),
(84, 4, 80, NULL, 'adjustment', 5.000, 0.000, 5.000, 'import', NULL, 165000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(85, 4, 81, NULL, 'adjustment', 6.000, 0.000, 6.000, 'import', NULL, 210000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(86, 4, 82, NULL, 'adjustment', 16.000, 0.000, 16.000, 'import', NULL, 275000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(87, 4, 83, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 71000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(88, 4, 84, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 178000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(89, 4, 85, NULL, 'adjustment', 6.000, 0.000, 6.000, 'import', NULL, 74000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(90, 4, 86, NULL, 'adjustment', 11.000, 0.000, 11.000, 'import', NULL, 10500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(91, 4, 87, NULL, 'adjustment', 16.000, 0.000, 16.000, 'import', NULL, 42000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(92, 4, 88, NULL, 'adjustment', 17.000, 0.000, 17.000, 'import', NULL, 8500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(93, 4, 89, NULL, 'adjustment', 17.000, 0.000, 17.000, 'import', NULL, 7800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(94, 4, 90, NULL, 'adjustment', 66.000, 0.000, 66.000, 'import', NULL, 17000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(95, 4, 91, NULL, 'adjustment', 42.000, 0.000, 42.000, 'import', NULL, 900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(96, 4, 92, NULL, 'adjustment', 78.000, 0.000, 78.000, 'import', NULL, 5000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(97, 4, 93, NULL, 'adjustment', 73.000, 0.000, 73.000, 'import', NULL, 15000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(98, 4, 94, NULL, 'adjustment', 32.000, 0.000, 32.000, 'import', NULL, 1000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(99, 4, 95, NULL, 'adjustment', 48.000, 0.000, 48.000, 'import', NULL, 2500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(100, 4, 96, NULL, 'adjustment', 66.000, 0.000, 66.000, 'import', NULL, 2200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(101, 4, 97, NULL, 'adjustment', 32.000, 0.000, 32.000, 'import', NULL, 600.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(102, 4, 98, NULL, 'adjustment', 26.000, 0.000, 26.000, 'import', NULL, 900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(103, 4, 99, NULL, 'adjustment', 34.000, 0.000, 34.000, 'import', NULL, 1200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(104, 4, 100, NULL, 'adjustment', 23.000, 0.000, 23.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(105, 4, 101, NULL, 'adjustment', 63.000, 0.000, 63.000, 'import', NULL, 1500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(106, 4, 102, NULL, 'adjustment', 47.000, 0.000, 47.000, 'import', NULL, 800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(107, 4, 103, NULL, 'adjustment', 49.000, 0.000, 49.000, 'import', NULL, 5500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(108, 4, 104, NULL, 'adjustment', 52.000, 0.000, 52.000, 'import', NULL, 1500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(109, 4, 105, NULL, 'adjustment', 35.000, 0.000, 35.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(110, 4, 106, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 8000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(111, 4, 107, NULL, 'adjustment', 37.000, 0.000, 37.000, 'import', NULL, 12500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(112, 4, 108, NULL, 'adjustment', 53.000, 0.000, 53.000, 'import', NULL, 20000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(113, 4, 109, NULL, 'adjustment', 62.000, 0.000, 62.000, 'import', NULL, 2200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(114, 4, 110, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 1400.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(115, 4, 111, NULL, 'adjustment', 17.000, 0.000, 17.000, 'import', NULL, 3800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(116, 4, 112, NULL, 'adjustment', 54.000, 0.000, 54.000, 'import', NULL, 3000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(117, 4, 113, NULL, 'adjustment', 45.000, 0.000, 45.000, 'import', NULL, 3200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(118, 4, 114, NULL, 'adjustment', 77.000, 0.000, 77.000, 'import', NULL, 5800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(119, 4, 115, NULL, 'adjustment', 31.000, 0.000, 31.000, 'import', NULL, 10500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(120, 4, 116, NULL, 'adjustment', 36.000, 0.000, 36.000, 'import', NULL, 900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(121, 4, 117, NULL, 'adjustment', 69.000, 0.000, 69.000, 'import', NULL, 1200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:43'),
(122, 4, 118, NULL, 'adjustment', 40.000, 0.000, 40.000, 'import', NULL, 10000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(123, 4, 119, NULL, 'adjustment', 62.000, 0.000, 62.000, 'import', NULL, 32000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(124, 4, 120, NULL, 'adjustment', 72.000, 0.000, 72.000, 'import', NULL, 15000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(125, 4, 121, NULL, 'adjustment', 43.000, 0.000, 43.000, 'import', NULL, 8000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(126, 4, 122, NULL, 'adjustment', 4.000, 0.000, 4.000, 'import', NULL, 330000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(127, 4, 123, NULL, 'adjustment', 3.000, 0.000, 3.000, 'import', NULL, 425000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(128, 4, 124, NULL, 'adjustment', 3.000, 0.000, 3.000, 'import', NULL, 312000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(129, 4, 125, NULL, 'adjustment', 3.000, 0.000, 3.000, 'import', NULL, 360000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(130, 4, 126, NULL, 'adjustment', 2.000, 0.000, 2.000, 'import', NULL, 175000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(131, 4, 127, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 6000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(132, 4, 128, NULL, 'adjustment', 30.000, 0.000, 30.000, 'import', NULL, 1800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(133, 4, 129, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 5000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(134, 4, 130, NULL, 'adjustment', 10.000, 0.000, 10.000, 'import', NULL, 10000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(135, 4, 131, NULL, 'adjustment', 40.000, 0.000, 40.000, 'import', NULL, 3000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(136, 4, 132, NULL, 'adjustment', 35.000, 0.000, 35.000, 'import', NULL, 4800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(137, 4, 133, NULL, 'adjustment', 25.000, 0.000, 25.000, 'import', NULL, 8200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(138, 4, 134, NULL, 'adjustment', 12.000, 0.000, 12.000, 'import', NULL, 42000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(139, 4, 135, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 68000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(140, 4, 136, NULL, 'adjustment', 10.000, 0.000, 10.000, 'import', NULL, 12000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(141, 4, 137, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 26000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(142, 4, 138, NULL, 'adjustment', 25.000, 0.000, 25.000, 'import', NULL, 3500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(143, 4, 139, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(144, 4, 140, NULL, 'adjustment', 5.000, 0.000, 5.000, 'import', NULL, 78000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(145, 4, 141, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 13000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(146, 4, 142, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 16500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(147, 4, 143, NULL, 'adjustment', 15.000, 0.000, 15.000, 'import', NULL, 8500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(148, 4, 144, NULL, 'adjustment', 10.000, 0.000, 10.000, 'import', NULL, 8500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(149, 4, 145, NULL, 'adjustment', 12.000, 0.000, 12.000, 'import', NULL, 6500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(150, 4, 146, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 13000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(151, 4, 147, NULL, 'adjustment', 10.000, 0.000, 10.000, 'import', NULL, 10000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(152, 4, 148, NULL, 'adjustment', 3.000, 0.000, 3.000, 'import', NULL, 118000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(153, 4, 149, NULL, 'adjustment', 2.000, 0.000, 2.000, 'import', NULL, 220000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(154, 4, 150, NULL, 'adjustment', 3.000, 0.000, 3.000, 'import', NULL, 240000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(155, 4, 151, NULL, 'adjustment', 5.000, 0.000, 5.000, 'import', NULL, 88000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(156, 4, 152, NULL, 'adjustment', 4.000, 0.000, 4.000, 'import', NULL, 148000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(157, 4, 153, NULL, 'adjustment', 6.000, 0.000, 6.000, 'import', NULL, 10500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(158, 4, 154, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 5500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(159, 4, 155, NULL, 'adjustment', 2.000, 0.000, 2.000, 'import', NULL, 270000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(160, 4, 156, NULL, 'adjustment', 200.000, 0.000, 200.000, 'import', NULL, 350.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(161, 4, 157, NULL, 'adjustment', 250.000, 0.000, 250.000, 'import', NULL, 320.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(162, 4, 158, NULL, 'adjustment', 80.000, 0.000, 80.000, 'import', NULL, 950.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(163, 4, 159, NULL, 'adjustment', 150.000, 0.000, 150.000, 'import', NULL, 450.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(164, 4, 160, NULL, 'adjustment', 120.000, 0.000, 120.000, 'import', NULL, 400.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(165, 4, 161, NULL, 'adjustment', 60.000, 0.000, 60.000, 'import', NULL, 1900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(166, 4, 162, NULL, 'adjustment', 100.000, 0.000, 100.000, 'import', NULL, 600.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(167, 4, 163, NULL, 'adjustment', 70.000, 0.000, 70.000, 'import', NULL, 1100.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(168, 4, 164, NULL, 'adjustment', 45.000, 0.000, 45.000, 'import', NULL, 1650.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(169, 4, 165, NULL, 'adjustment', 180.000, 0.000, 180.000, 'import', NULL, 280.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(170, 4, 166, NULL, 'adjustment', 200.000, 0.000, 200.000, 'import', NULL, 350.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(171, 4, 167, NULL, 'adjustment', 18.000, 0.000, 18.000, 'import', NULL, 2200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(172, 4, 168, NULL, 'adjustment', 18.000, 0.000, 18.000, 'import', NULL, 1300.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(173, 4, 169, NULL, 'adjustment', 45.000, 0.000, 45.000, 'import', NULL, 6000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(174, 4, 170, NULL, 'adjustment', 47.000, 0.000, 47.000, 'import', NULL, 6000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(175, 4, 171, NULL, 'adjustment', 19.000, 0.000, 19.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(176, 4, 172, NULL, 'adjustment', 40.000, 0.000, 40.000, 'import', NULL, 2400.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(177, 4, 173, NULL, 'adjustment', 30.000, 0.000, 30.000, 'import', NULL, 900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(178, 4, 174, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 1600.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(179, 4, 175, NULL, 'adjustment', 57.000, 0.000, 57.000, 'import', NULL, 10500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(180, 4, 176, NULL, 'adjustment', 28.000, 0.000, 28.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(181, 4, 177, NULL, 'adjustment', 18.000, 0.000, 18.000, 'import', NULL, 3000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(182, 4, 178, NULL, 'adjustment', 30.000, 0.000, 30.000, 'import', NULL, 17000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(183, 4, 179, NULL, 'adjustment', 44.000, 0.000, 44.000, 'import', NULL, 5000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(184, 4, 180, NULL, 'adjustment', 26.000, 0.000, 26.000, 'import', NULL, 5000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(185, 4, 181, NULL, 'adjustment', 14.000, 0.000, 14.000, 'import', NULL, 12500.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(186, 4, 182, NULL, 'adjustment', 28.000, 0.000, 28.000, 'import', NULL, 2000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(187, 4, 183, NULL, 'adjustment', 44.000, 0.000, 44.000, 'import', NULL, 3800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(188, 4, 184, NULL, 'adjustment', 48.000, 0.000, 48.000, 'import', NULL, 700.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(189, 4, 185, NULL, 'adjustment', 34.000, 0.000, 34.000, 'import', NULL, 1100.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(190, 4, 186, NULL, 'adjustment', 31.000, 0.000, 31.000, 'import', NULL, 2200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(191, 4, 187, NULL, 'adjustment', 50.000, 0.000, 50.000, 'import', NULL, 2800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(192, 4, 188, NULL, 'adjustment', 33.000, 0.000, 33.000, 'import', NULL, 3800.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(193, 4, 189, NULL, 'adjustment', 28.000, 0.000, 28.000, 'import', NULL, 550.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(194, 4, 190, NULL, 'adjustment', 46.000, 0.000, 46.000, 'import', NULL, 3400.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(195, 4, 191, NULL, 'adjustment', 20.000, 0.000, 20.000, 'import', NULL, 900.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(196, 4, 192, NULL, 'adjustment', 8.000, 0.000, 8.000, 'import', NULL, 11000.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(197, 4, 193, NULL, 'adjustment', 30.000, 0.000, 30.000, 'import', NULL, 300.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(198, 4, 194, NULL, 'adjustment', 111.000, 0.000, 111.000, 'import', NULL, 550.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(199, 4, 195, NULL, 'adjustment', 124.000, 0.000, 124.000, 'import', NULL, 50.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(200, 4, 196, NULL, 'adjustment', 100.000, 0.000, 100.000, 'import', NULL, 50.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(201, 4, 197, NULL, 'adjustment', 101.000, 0.000, 101.000, 'import', NULL, 50.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(202, 4, 198, NULL, 'adjustment', 39.000, 0.000, 39.000, 'import', NULL, 5200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(203, 4, 199, NULL, 'adjustment', 34.000, 0.000, 34.000, 'import', NULL, 4200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(204, 4, 200, NULL, 'adjustment', 100.000, 0.000, 100.000, 'import', NULL, 3200.00, 'Stock initial lors de l\'importation', 5, '2026-08-14 10:43:44'),
(205, 4, 118, NULL, 'sale', -1.000, 40.000, 39.000, 'sale', 38, 10000.00, NULL, 5, '2026-08-14 12:17:45'),
(206, 4, 119, NULL, 'sale', -1.000, 62.000, 61.000, 'sale', 38, 32000.00, NULL, 5, '2026-08-14 12:17:46'),
(207, 4, 120, NULL, 'sale', -1.000, 72.000, 71.000, 'sale', 38, 15000.00, NULL, 5, '2026-08-14 12:17:46');

-- --------------------------------------------------------

--
-- Table structure for table `measurement_units`
--

CREATE TABLE `measurement_units` (
  `id` smallint UNSIGNED NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('piece','weight','volume','length','service') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'piece'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `measurement_units`
--

INSERT INTO `measurement_units` (`id`, `code`, `name`, `symbol`, `type`) VALUES
(1, 'PIECE', 'Pièce', 'pcs', 'piece'),
(2, 'KG', 'Kilogramme', 'kg', 'weight'),
(3, 'G', 'Gramme', 'g', 'weight'),
(4, 'L', 'Litre', 'L', 'volume'),
(5, 'ML', 'Millilitre', 'ml', 'volume'),
(6, 'M', 'Mètre', 'm', 'length'),
(7, 'SERVICE', 'Service', 'serv', 'service');

-- --------------------------------------------------------

--
-- Table structure for table `memberships`
--

CREATE TABLE `memberships` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `role` enum('owner','manager','cashier','employee','super_admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` bigint UNSIGNED DEFAULT NULL,
  `custom_permissions` json DEFAULT NULL COMMENT '{"can_view_reports":true,"can_manage_products":false}',
  `invitation_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invited_at` datetime DEFAULT NULL,
  `joined_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `memberships`
--

INSERT INTO `memberships` (`id`, `user_id`, `company_id`, `role`, `role_id`, `custom_permissions`, `invitation_token`, `invited_at`, `joined_at`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'owner', 1, NULL, NULL, NULL, '2026-05-18 16:47:47', 1, '2026-05-18 14:47:47', '2026-08-01 16:32:09'),
(2, 2, 2, 'owner', 4, NULL, NULL, NULL, '2026-05-19 16:55:32', 1, '2026-05-19 14:55:32', '2026-08-01 16:32:09'),
(3, 2, 3, 'owner', 7, NULL, NULL, NULL, '2026-05-19 17:02:28', 1, '2026-05-19 15:02:28', '2026-08-01 16:32:09'),
(4, 4, NULL, 'super_admin', NULL, NULL, NULL, NULL, NULL, 1, '2026-06-21 21:01:10', '2026-06-21 21:01:10'),
(5, 5, 4, 'owner', 10, NULL, NULL, NULL, '2026-06-22 02:42:50', 1, '2026-06-22 00:42:50', '2026-08-01 16:32:09'),
(6, 5, 5, 'owner', 22, NULL, NULL, NULL, '2026-06-23 14:06:14', 1, '2026-06-23 12:06:14', '2026-08-01 16:32:10'),
(7, 6, 6, 'owner', 25, NULL, NULL, NULL, '2026-06-24 13:33:16', 1, '2026-06-24 13:33:16', '2026-08-01 16:32:10'),
(8, 7, 7, 'owner', 13, NULL, NULL, NULL, '2026-07-13 15:25:54', 1, '2026-07-13 15:25:54', '2026-08-01 16:32:10'),
(9, 8, 4, 'manager', 11, NULL, NULL, NULL, '2026-07-21 19:36:27', 1, '2026-07-21 19:36:27', '2026-08-01 16:32:09'),
(10, 9, 8, 'owner', 16, NULL, NULL, NULL, '2026-07-22 11:13:52', 1, '2026-07-22 11:13:52', '2026-08-01 16:32:10'),
(12, 15, 8, 'manager', 17, NULL, NULL, NULL, '2026-07-28 11:44:37', 1, '2026-07-28 11:44:37', '2026-08-01 16:32:10'),
(13, 16, 9, 'owner', 19, NULL, NULL, NULL, '2026-07-31 15:36:01', 1, '2026-07-31 13:36:01', '2026-08-01 16:32:10'),
(14, 17, 4, 'owner', 28, NULL, NULL, NULL, '2026-08-01 21:28:43', 1, '2026-08-01 19:28:43', '2026-08-01 19:28:43'),
(15, 18, 4, 'owner', 12, NULL, NULL, NULL, '2026-08-04 14:29:01', 1, '2026-08-04 12:29:01', '2026-08-04 12:29:01'),
(16, 19, 4, 'owner', 12, NULL, NULL, NULL, '2026-08-04 15:17:18', 1, '2026-08-04 13:17:18', '2026-08-04 13:17:18');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `module`, `name`, `description`) VALUES
(1, 'dashboard.view', 'Tableau de bord', 'Voir le tableau de bord', 'Accès aux statistiques et métriques globales'),
(2, 'products.view', 'Produits', 'Voir les produits', 'Consulter le catalogue de produits'),
(3, 'products.create', 'Produits', 'Créer un produit', 'Ajouter de nouveaux produits'),
(4, 'products.edit', 'Produits', 'Modifier un produit', 'Modifier les informations des produits'),
(5, 'products.delete', 'Produits', 'Supprimer un produit', 'Supprimer ou archiver un produit'),
(6, 'products.export', 'Produits', 'Exporter les produits', 'Exporter la liste des produits'),
(7, 'products.view_cost', 'Produits', 'Voir le prix d\'achat', 'Autoriser la visualisation du prix d\'achat et des marges'),
(8, 'sales.view', 'Ventes', 'Voir les ventes', 'Consulter l\'historique des ventes'),
(9, 'sales.create', 'Ventes', 'Créer une vente', 'Enregistrer une nouvelle vente (Caisse)'),
(10, 'sales.edit', 'Ventes', 'Modifier une vente', 'Modifier une vente existante'),
(11, 'sales.delete', 'Ventes', 'Supprimer une vente', 'Supprimer une vente'),
(12, 'sales.cancel', 'Ventes', 'Annuler une vente', 'Annuler une vente'),
(13, 'sales.print', 'Ventes', 'Imprimer un ticket', 'Imprimer le ticket ou la facture'),
(14, 'sales.export', 'Ventes', 'Exporter les ventes', 'Exporter l\'historique'),
(15, 'sales.return', 'Ventes', 'Retour produit', 'Gérer les retours clients'),
(16, 'sales.view_margin', 'Ventes', 'Voir les marges', 'Voir le bénéfice et la marge sur les ventes'),
(17, 'purchases.view', 'Achats', 'Voir les achats', 'Consulter les bons de commande fournisseur'),
(18, 'purchases.create', 'Achats', 'Créer un achat', 'Créer un bon de commande'),
(19, 'purchases.edit', 'Achats', 'Modifier un achat', 'Modifier un bon de commande'),
(20, 'purchases.delete', 'Achats', 'Supprimer un achat', 'Supprimer un bon de commande'),
(21, 'purchases.receive', 'Achats', 'Réceptionner', 'Réceptionner les articles d\'un achat'),
(22, 'inventory.view', 'Stocks', 'Voir le stock', 'Consulter les niveaux de stock'),
(23, 'inventory.adjust', 'Stocks', 'Ajuster le stock', 'Faire des ajustements manuels'),
(24, 'inventory.transfer', 'Stocks', 'Transférer', 'Transférer entre entrepôts'),
(25, 'inventory.count', 'Stocks', 'Inventaire physique', 'Gérer les sessions d\'inventaire physique'),
(26, 'warehouses.view', 'Entrepôts', 'Voir les entrepôts', 'Voir la liste des entrepôts'),
(27, 'warehouses.create', 'Entrepôts', 'Créer un entrepôt', 'Ajouter un entrepôt'),
(28, 'warehouses.edit', 'Entrepôts', 'Modifier un entrepôt', 'Modifier un entrepôt'),
(29, 'warehouses.delete', 'Entrepôts', 'Supprimer un entrepôt', 'Supprimer un entrepôt'),
(30, 'clients.view', 'Clients', 'Voir les clients', 'Consulter le fichier client'),
(31, 'clients.create', 'Clients', 'Créer un client', 'Ajouter un client'),
(32, 'clients.edit', 'Clients', 'Modifier un client', 'Modifier un client'),
(33, 'clients.delete', 'Clients', 'Supprimer un client', 'Supprimer un client'),
(34, 'suppliers.view', 'Fournisseurs', 'Voir les fournisseurs', 'Consulter les fournisseurs'),
(35, 'suppliers.create', 'Fournisseurs', 'Créer un fournisseur', 'Ajouter un fournisseur'),
(36, 'suppliers.edit', 'Fournisseurs', 'Modifier un fournisseur', 'Modifier un fournisseur'),
(37, 'suppliers.delete', 'Fournisseurs', 'Supprimer un fournisseur', 'Supprimer un fournisseur'),
(38, 'employees.view', 'Employés', 'Voir les employés', 'Voir la liste du personnel'),
(39, 'employees.create', 'Employés', 'Créer un employé', 'Ajouter un nouvel employé'),
(40, 'employees.edit', 'Employés', 'Modifier un employé', 'Gérer les employés'),
(41, 'employees.delete', 'Employés', 'Supprimer un employé', 'Supprimer un employé'),
(42, 'roles.manage', 'Employés', 'Gérer les rôles', 'Créer et modifier les rôles et permissions'),
(43, 'settings.manage', 'Paramètres', 'Gérer les paramètres', 'Accès aux paramètres de l\'entreprise'),
(44, 'cash.registers.manage', 'Caisse', 'Gérer les caisses', 'Créer, modifier, supprimer et assigner des caisses'),
(45, 'cash.sessions.manage', 'Caisse', 'Gérer sa session', 'Ouvrir et fermer sa propre session de caisse'),
(46, 'cash.sessions.view', 'Caisse', 'Voir les sessions', 'Consulter l\'historique et les détails de toutes les sessions');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `catalog_product_id` bigint UNSIGNED DEFAULT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `unit_id` smallint UNSIGNED NOT NULL DEFAULT '1',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ingredients_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Liste des ingrédients en texte libre pour les plats/restaurants',
  `barcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Stock Keeping Unit - référence interne',
  `cost_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix d''achat/revient',
  `retail_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix de vente au détail',
  `wholesale_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix de vente en gros',
  `wholesale_min_qty` int UNSIGNED DEFAULT '1' COMMENT 'Quantité minimum pour prix de gros',
  `allow_custom_price` tinyint(1) DEFAULT '0' COMMENT 'Permet saisie prix libre',
  `product_type` enum('product','service','dish','ingredient','raw_material') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'product',
  `manage_stock` tinyint(1) DEFAULT '1',
  `current_stock` decimal(12,3) DEFAULT '0.000',
  `low_stock_threshold` decimal(12,3) DEFAULT '10.000',
  `is_active` tinyint(1) DEFAULT '1',
  `is_available` tinyint(1) DEFAULT '1' COMMENT 'Disponible à la vente',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `catalog_product_id`, `category_id`, `unit_id`, `name`, `slug`, `description`, `ingredients_text`, `barcode`, `sku`, `cost_price`, `retail_price`, `wholesale_price`, `wholesale_min_qty`, `allow_custom_price`, `product_type`, `manage_stock`, `current_stock`, `low_stock_threshold`, `is_active`, `is_available`, `image_url`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, NULL, 1, 1, 'produit test 1', 'produit-test-1-1779223077159', 'aucune', NULL, '2000247821435', 'AMP-PDFB0B', 10000.00, 11000.00, 10500.00, 5, 0, 'product', 1, 20.000, 10.000, 1, 1, 'http://localhost:5000/uploads/products/product-1779223077128-544221727.png', '2026-05-19 20:37:57', '2026-05-19 20:59:37', '2026-05-19 22:59:37'),
(2, 2, NULL, 1, 1, 'produit test 2', 'produit-test-2-1779224262083', 'day 2 day ', NULL, '2000502621138', 'AMP-PDFB0C', 7500.00, 8500.00, 8000.00, 5, 0, 'product', 1, 24.000, 10.000, 1, 1, NULL, '2026-05-19 20:57:42', '2026-05-21 11:51:29', NULL),
(3, 4, 3, 4, 1, 'iphone 13 pro', 'iphone-13-pro-1782133776087', 'telephone de marque apple', NULL, '', '', 200000.00, 200000.00, 195000.00, 1, 0, 'product', 1, 5.000, 4.000, 1, 1, NULL, '2026-06-22 12:46:09', '2026-08-07 12:43:56', NULL),
(4, 4, NULL, 4, 1, 'ordinateur', 'ordinateur-1782133887203', 'ordi', NULL, NULL, NULL, 170000.00, 200000.00, 195000.00, 1, 0, 'product', 1, 90.000, 1.000, 1, 1, NULL, '2026-06-22 13:11:27', '2026-08-07 13:16:09', NULL),
(5, 5, NULL, 5, 7, 'plat1-test', 'plat1-test-1782226978271', NULL, 'riz , viande , frittes', NULL, NULL, 0.00, 2000.00, 0.00, 1, 0, 'dish', 0, 0.000, 10.000, 1, 1, NULL, '2026-06-23 15:01:40', '2026-06-23 15:02:58', NULL),
(6, 4, 2, 4, 1, 'iphone 14 pro', 'iphone-14-pro-1782250821426', 'aucune', NULL, NULL, NULL, 250000.00, 2500000.00, 245000.00, 1, 0, 'product', 1, 21.000, 10.000, 1, 1, 'http://global-visept-backend.onrender.com/uploads/products/product-1782250788984-669583536.png', '2026-06-23 21:39:49', '2026-07-31 16:38:56', NULL),
(7, 4, 1, 4, 1, 'test3', 'test3-1784645195182', 'mon produit cool', NULL, NULL, NULL, 5000.00, 7500.00, 7000.00, 10, 0, 'product', 1, 83.000, 5.000, 1, 1, NULL, '2026-07-21 14:46:11', '2026-08-07 12:43:16', NULL),
(8, 8, 4, NULL, 1, 'tes', 'tes-1785239513531', 'werty', NULL, NULL, 'we456', 600.00, 800.00, 700.00, 1, 0, 'product', 1, 1000.000, 10.000, 1, 1, NULL, '2026-07-28 11:51:53', '2026-07-28 11:51:53', NULL),
(9, 8, NULL, NULL, 1, 'rizs', 'rizs-1785283878160', 'aucune', NULL, NULL, NULL, 18000.00, 21000.00, 20000.00, 1, 0, 'product', 1, 250.000, 10.000, 1, 1, NULL, '2026-07-29 00:10:45', '2026-07-29 00:19:38', '2026-07-29 00:19:38'),
(10, 8, 6, NULL, 1, 'rizs', 'rizs-1785284450150', NULL, NULL, NULL, NULL, 18000.00, 20000.00, 19000.00, 1, 0, 'product', 1, 100.000, 10.000, 1, 1, NULL, '2026-07-29 00:20:33', '2026-07-29 00:20:50', NULL),
(11, 4, NULL, NULL, 1, 'iphone 11 pro', 'iphone-11-pro-1785612588156', 'blablaa', NULL, NULL, NULL, 0.00, 0.00, 0.00, 1, 0, 'product', 1, 0.000, 10.000, 1, 1, NULL, '2026-08-01 19:29:48', '2026-08-01 19:29:56', '2026-08-01 21:29:56'),
(12, 4, 8, NULL, 1, 'test2', 'test2-1785762467531', 'aucune', NULL, NULL, NULL, 0.00, 0.00, 0.00, 1, 0, 'product', 1, 0.000, 10.000, 1, 1, NULL, '2026-08-03 13:07:47', '2026-08-03 13:07:47', NULL),
(13, 4, 9, 4, 1, 'Samsung Galaxy A54', 'samsung-galaxy-a54-1785999902001', 'Smartphone Samsung 128Go', NULL, '6901234500001', 'KAB-ELEC-001', 125000.00, 150000.00, 145000.00, 3, 0, 'product', 1, 15.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:39', NULL),
(14, 4, 10, 4, 1, '├ëcouteurs Bluetooth', 'ecouteurs-bluetooth-1785999902002', '├ëcouteurs sans fil st├®r├®o', NULL, '6901234500002', 'KAB-ELEC-002', 5000.00, 8500.00, 7500.00, 5, 0, 'product', 1, 40.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:40', NULL),
(15, 4, 11, 4, 1, 'Chargeur rapide USB-C', 'chargeur-rapide-usbc-1785999902003', 'Chargeur 65W universel', NULL, '6901234500003', 'KAB-ELEC-003', 3500.00, 6000.00, 5500.00, 5, 0, 'product', 1, 55.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:40', NULL),
(16, 4, 12, 4, 1, 'Batterie externe 20000mAh', 'batterie-externe-1785999902004', 'Power bank haute capacit├®', NULL, '6901234500004', 'KAB-ELEC-004', 9500.00, 15000.00, 13000.00, 3, 0, 'product', 1, 25.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:40', NULL),
(17, 4, 13, 4, 1, 'Cl├® USB 32Go', 'cle-usb-32go-1785999902005', 'Cl├® USB 3.0 rapide', NULL, '6901234500005', 'KAB-ELEC-005', 1500.00, 3000.00, 2500.00, 10, 0, 'product', 1, 80.000, 15.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:40', NULL),
(18, 4, 14, 4, 1, 'Tablette Huawei MatePad', 'tablette-huawei-matepad-1785999902006', 'Tablette 10 pouces WiFi', NULL, '6901234500006', 'KAB-ELEC-006', 115000.00, 145000.00, 140000.00, 2, 0, 'product', 1, 10.000, 3.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:40', NULL),
(19, 4, 15, 4, 1, 'C├óble HDMI 2m', 'cable-hdmi-2m-1785999902007', 'C├óble HDMI 4K gold plaqu├®', NULL, '6901234500007', 'KAB-ELEC-007', 1800.00, 3500.00, 3000.00, 5, 0, 'product', 1, 60.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(20, 4, 16, 4, 1, 'Souris sans fil', 'souris-sans-fil-1785999902008', 'Souris optique 1600 DPI', NULL, '6901234500008', 'KAB-ELEC-008', 4000.00, 7000.00, 6000.00, 5, 0, 'product', 1, 35.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(21, 4, 17, 6, 1, 'Bazin Riche Homme', 'bazin-riche-homme-1785999903001', 'Grand boubou brod├® qualit├® sup', NULL, '6902234600001', 'KAB-VET-001', 12000.00, 18000.00, 16000.00, 3, 0, 'product', 1, 30.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(22, 4, 18, 6, 1, 'Robe Wax Femme', 'robe-wax-femme-1785999903002', 'Robe africaine wax imprim├®', NULL, '6902234600002', 'KAB-VET-002', 8000.00, 13000.00, 11500.00, 5, 0, 'product', 1, 45.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(23, 4, 19, 6, 1, 'T-shirt Coton Homme', 't-shirt-coton-homme-1785999903003', 'T-shirt 100% coton col rond', NULL, '6902234600003', 'KAB-VET-003', 3500.00, 6500.00, 5500.00, 10, 0, 'product', 1, 90.000, 15.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(24, 4, 20, 6, 1, 'Jean Slim Homme', 'jean-slim-homme-1785999903004', 'Jean stretch slim fit', NULL, '6902234600004', 'KAB-VET-004', 7500.00, 12500.00, 11000.00, 5, 0, 'product', 1, 55.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(25, 4, 21, 6, 1, 'Pagn├® 6 yards', 'pagne-6yards-1785999903005', 'Pagn├® tiss├® qualit├® premium', NULL, '6902234600005', 'KAB-VET-005', 4500.00, 7500.00, 6500.00, 5, 0, 'product', 1, 40.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(26, 4, 22, 6, 1, 'Ensemble Enfant 2-8 ans', 'ensemble-enfant-1785999903006', 'Ensemble complet gar├ºon/fille', NULL, '6902234600006', 'KAB-VET-006', 4000.00, 7000.00, 6000.00, 5, 0, 'product', 1, 35.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(27, 4, 23, 6, 1, 'Chemise Formelle Homme', 'chemise-formelle-homme-1785999903007', 'Chemise bureau manches longues', NULL, '6902234600007', 'KAB-VET-007', 5500.00, 9500.00, 8500.00, 5, 0, 'product', 1, 50.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(28, 4, 24, 6, 1, 'D├®bardeur Femme', 'debardeur-femme-1785999903008', 'D├®bardeur coton color├®', NULL, '6902234600008', 'KAB-VET-008', 2000.00, 4000.00, 3500.00, 10, 0, 'product', 1, 70.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(29, 4, 25, 7, 1, 'Basket Homme Nike', 'basket-homme-nike-1785999904001', 'Basket sport pointure 40-46', NULL, '6903234700001', 'KAB-CHAUS-001', 18000.00, 27000.00, 25000.00, 2, 0, 'product', 1, 19.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-08 03:05:55', NULL),
(30, 4, 26, 7, 1, 'Sandale Cuir Femme', 'sandale-cuir-femme-1785999904002', 'Sandale artisanale cuir', NULL, '6903234700002', 'KAB-CHAUS-002', 5500.00, 9500.00, 8500.00, 3, 0, 'product', 1, 30.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(31, 4, 27, 7, 1, 'Chaussure Formelle Homme', 'chaussure-formelle-homme-1785999904003', 'Derby cuir verni noir', NULL, '6903234700003', 'KAB-CHAUS-003', 12000.00, 20000.00, 18000.00, 2, 0, 'product', 1, 18.000, 4.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(32, 4, 28, 7, 1, 'Tong Plastique Mixte', 'tong-plastique-mixte-1785999904004', 'Tong durable l├®g├¿re', NULL, '6903234700004', 'KAB-CHAUS-004', 500.00, 1500.00, 1200.00, 20, 0, 'product', 1, 120.000, 20.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(33, 4, 29, 7, 1, 'Chaussure Enfant 26-35', 'chaussure-enfant-1785999904005', 'Chaussure ├®cole r├®sistante', NULL, '6903234700005', 'KAB-CHAUS-005', 4000.00, 7000.00, 6500.00, 3, 0, 'product', 1, 40.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(34, 4, 30, 8, 1, 'Huile V├®g├®tale 5L', 'huile-vegetale-5l-1785999905001', 'Huile de cuisson raffin├®e', NULL, '6904234800001', 'KAB-ALIM-001', 4500.00, 6500.00, 6000.00, 12, 0, 'product', 1, 60.000, 12.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(35, 4, 31, 8, 1, 'Riz Parfum├® 25kg', 'riz-parfume-25kg-1785999905002', 'Riz bris├® parfum├® sac 25kg', NULL, '6904234800002', 'KAB-ALIM-002', 12000.00, 17000.00, 15000.00, 5, 0, 'product', 1, 35.000, 5.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(36, 4, 32, 8, 1, 'Lait concentr├® sucr├®', 'lait-concentre-sucre-1785999905003', 'Boite 400g marque locale', NULL, '6904234800003', 'KAB-ALIM-003', 500.00, 800.00, 750.00, 24, 0, 'product', 1, 144.000, 24.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(37, 4, 33, 8, 1, 'Caf├® soluble 250g', 'cafe-soluble-250g-1785999905004', 'Caf├® instantan├® arabica', NULL, '6904234800004', 'KAB-ALIM-004', 2500.00, 4000.00, 3500.00, 12, 0, 'product', 1, 60.000, 12.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(38, 4, 34, 8, 1, 'Sucre en poudre 1kg', 'sucre-poudre-1kg-1785999905005', 'Sucre blanc raffin├®', NULL, '6904234800005', 'KAB-ALIM-005', 600.00, 900.00, 850.00, 20, 0, 'product', 1, 80.000, 20.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(39, 4, 35, 8, 1, 'Sardines en boite 125g', 'sardines-boite-125g-1785999905006', 'Sardines ├á la tomate', NULL, '6904234800006', 'KAB-ALIM-006', 450.00, 700.00, 650.00, 24, 0, 'product', 1, 120.000, 24.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(40, 4, 36, 8, 1, 'Eau min├®rale 1.5L', 'eau-minerale-1l5-1785999905007', 'Eau plate bouteille PET', NULL, '6904234800007', 'KAB-ALIM-007', 200.00, 400.00, 350.00, 24, 0, 'product', 1, 200.000, 48.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(41, 4, 37, 8, 1, 'P├ótes alimentaires 500g', 'pates-alimentaires-500g-1785999905008', 'Spaghetti qualit├® sup├®rieure', NULL, '6904234800008', 'KAB-ALIM-008', 450.00, 700.00, 650.00, 12, 0, 'product', 1, 96.000, 24.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(42, 4, 38, 9, 1, 'Cr├¿me hydratante corps', 'creme-hydratante-corps-1785999906001', 'Cr├¿me 500ml huile de karit├®', NULL, '6905234900001', 'KAB-COS-001', 2500.00, 4500.00, 4000.00, 6, 0, 'product', 1, 50.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(43, 4, 39, 9, 1, 'Savon de toilette 200g', 'savon-toilette-200g-1785999906002', 'Savon surgras naturel', NULL, '6905234900002', 'KAB-COS-002', 400.00, 700.00, 650.00, 12, 0, 'product', 1, 144.000, 24.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(44, 4, 40, 9, 1, 'Shampoing cheveux cr├®pus', 'shampoing-cheveux-crepus-1785999906003', 'Shampoing nutrition intense', NULL, '6905234900003', 'KAB-COS-003', 2000.00, 3500.00, 3000.00, 6, 0, 'product', 1, 40.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(45, 4, 41, 9, 1, 'D├®odorant roll-on', 'deodorant-roll-on-1785999906004', 'D├®odorant 48h sans alcool', NULL, '6905234900004', 'KAB-COS-004', 800.00, 1500.00, 1300.00, 12, 0, 'product', 1, 80.000, 15.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(46, 4, 42, 9, 1, 'Huile de coco 250ml', 'huile-de-coco-250ml-1785999906005', 'Huile vierge multi-usage', NULL, '6905234900005', 'KAB-COS-005', 2000.00, 3500.00, 3000.00, 6, 0, 'product', 1, 35.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(47, 4, 43, 10, 1, 'Seau plastique 15L', 'seau-plastique-15l-1785999907001', 'Seau solide avec couvercle', NULL, '6906235000001', 'KAB-MAI-001', 1200.00, 2000.00, 1800.00, 10, 0, 'product', 1, 75.000, 15.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(48, 4, 44, 10, 1, 'Balai en paille', 'balai-paille-1785999907002', 'Balai artisanal r├®sistant', NULL, '6906235000002', 'KAB-MAI-002', 600.00, 1200.00, 1000.00, 10, 0, 'product', 1, 57.000, 12.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-08 03:07:03', NULL),
(49, 4, 45, 10, 1, 'Moustiquaire impr├®gn├®e', 'moustiquaire-impregnee-1785999907003', 'Protection antipaludique', NULL, '6906235000003', 'KAB-MAI-003', 3000.00, 5500.00, 5000.00, 5, 0, 'product', 1, 40.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(50, 4, 46, 10, 1, 'Bougie parfum├®e 4h', 'bougie-parfumee-4h-1785999907004', 'Lot de 10 bougies parfum├®es', NULL, '6906235000004', 'KAB-MAI-004', 500.00, 900.00, 800.00, 20, 0, 'product', 1, 100.000, 20.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(51, 4, 47, 10, 1, 'Bassine aluminium 30cm', 'bassine-aluminium-30cm-1785999907005', 'Bassine multi-usage solide', NULL, '6906235000005', 'KAB-MAI-005', 2500.00, 4000.00, 3500.00, 5, 0, 'product', 1, 44.000, 10.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-08 03:05:55', NULL),
(52, 4, 48, 10, 1, 'Lampe torche LED', 'lampe-torche-led-1785999907006', 'Torche ├®tanche rechargeable', NULL, '6906235000006', 'KAB-MAI-006', 2000.00, 3500.00, 3000.00, 5, 0, 'product', 1, 30.000, 8.000, 1, 1, NULL, '2026-08-07 23:00:38', '2026-08-07 23:00:41', NULL),
(53, 1, NULL, NULL, 1, 'Test Product', 'test-product-1786574463959', NULL, NULL, NULL, 'TEST-001', 500.00, 1000.00, 0.00, 1, 0, 'product', 1, 96.000, 10.000, 1, 1, NULL, '2026-08-12 22:41:03', '2026-08-12 22:43:44', NULL),
(54, 1, NULL, NULL, 1, 'Test Dish', 'test-dish-1786574565286', NULL, NULL, NULL, 'DISH-001', 1000.00, 2000.00, 0.00, 1, 0, 'dish', 1, 0.000, 10.000, 1, 1, NULL, '2026-08-12 22:42:45', '2026-08-12 22:42:45', NULL),
(61, 4, 55, 17, 1, 'Smartphone Samsung Galaxy A14', 'smartphone-samsung-galaxy-a14-1786704221435-364', 'Samsung A14 64Go 4Go RAM Noir', NULL, '8806091234567', 'SAM-A14-64G', 95000.00, 110000.00, 105000.00, 3, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:41', '2026-08-14 10:43:41', NULL),
(62, 4, 56, 18, 1, 'Chargeur Rapide 25W Type-C', 'chargeur-rapide-25w-type-c-1786704222223-475', 'Adaptateur secteur USB-C charge rapide', NULL, '6934177701234', 'CHG-25W-TYPC', 4000.00, 7500.00, 6000.00, 5, 0, 'product', 1, 50.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(63, 4, 57, 17, 1, 'Smartphone Samsung Galaxy A05', 'smartphone-samsung-galaxy-a05-1786704222298-951', NULL, NULL, '0020100010013', 'SAM-A05-64', 62000.00, 78000.00, 71760.00, 3, 0, 'product', 1, 7.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(64, 4, 58, 17, 1, 'Smartphone Samsung Galaxy A15', 'smartphone-samsung-galaxy-a15-1786704222366-928', NULL, NULL, '0020200010029', 'SAM-A15-128', 86000.00, 105000.00, 96600.00, 3, 0, 'product', 1, 11.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(65, 4, 59, 17, 1, 'Smartphone Samsung Galaxy A25', 'smartphone-samsung-galaxy-a25-1786704222381-384', NULL, NULL, '0020300010035', 'SAM-A25-128', 112000.00, 135000.00, 124200.00, 3, 0, 'product', 1, 7.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(66, 4, 60, 17, 1, 'Smartphone Samsung Galaxy S23', 'smartphone-samsung-galaxy-s23-1786704222396-931', NULL, NULL, '0020400010041', 'SAM-S23-256', 360000.00, 420000.00, 386400.00, 3, 0, 'product', 1, 17.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(67, 4, 61, 17, 1, 'Smartphone Tecno Spark 20', 'smartphone-tecno-spark-20-1786704222409-156', NULL, NULL, '0020500010057', 'TEC-SPK20-128', 78000.00, 95000.00, 87400.00, 3, 0, 'product', 1, 6.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(68, 4, 62, 17, 1, 'Smartphone Tecno Spark 10', 'smartphone-tecno-spark-10-1786704222440-107', NULL, NULL, '0020600010063', 'TEC-SPK10-128', 66000.00, 82000.00, 75440.00, 3, 0, 'product', 1, 20.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(69, 4, 63, 17, 1, 'Smartphone Tecno Camon 20', 'smartphone-tecno-camon-20-1786704222452-312', NULL, NULL, '0020700010079', 'TEC-CAM20-256', 120000.00, 145000.00, 133400.00, 3, 0, 'product', 1, 10.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(70, 4, 64, 17, 1, 'Smartphone Tecno Pova 6', 'smartphone-tecno-pova-6-1786704222572-569', NULL, NULL, '0020800010085', 'TEC-POVA6-256', 108000.00, 130000.00, 119600.00, 3, 0, 'product', 1, 11.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(71, 4, 65, 17, 1, 'Smartphone Infinix Hot 40', 'smartphone-infinix-hot-40-1786704222593-29', NULL, NULL, '0020900010091', 'INF-HOT40-128', 72000.00, 89000.00, 81880.00, 3, 0, 'product', 1, 12.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(72, 4, 66, 17, 1, 'Smartphone Infinix Note 30', 'smartphone-infinix-note-30-1786704222612-550', NULL, NULL, '0021000010103', 'INF-NOTE30-128', 96000.00, 118000.00, 108560.00, 3, 0, 'product', 1, 17.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(73, 4, 67, 17, 1, 'Smartphone Infinix Smart 8', 'smartphone-infinix-smart-8-1786704222678-785', NULL, NULL, '0021100010119', 'INF-SMART8-64', 49000.00, 62000.00, 57040.00, 3, 0, 'product', 1, 8.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(74, 4, 68, 17, 1, 'Smartphone Infinix Zero 30', 'smartphone-infinix-zero-30-1786704222807-614', NULL, NULL, '0021200010125', 'INF-ZERO30-256', 148000.00, 175000.00, 161000.00, 3, 0, 'product', 1, 7.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(75, 4, 69, 17, 1, 'Smartphone Itel A70', 'smartphone-itel-a70-1786704222871-162', NULL, NULL, '0021300010131', 'ITL-A70-64', 34000.00, 45000.00, 41400.00, 3, 0, 'product', 1, 7.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(76, 4, 70, 17, 1, 'Smartphone Itel P55', 'smartphone-itel-p55-1786704222883-1', NULL, NULL, '0021400010147', 'ITL-P55-64', 44000.00, 58000.00, 53360.00, 3, 0, 'product', 1, 12.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(77, 4, 71, 17, 1, 'Smartphone Redmi 13C', 'smartphone-redmi-13c-1786704222894-176', NULL, NULL, '0021500010153', 'XIA-13C-128', 60000.00, 75000.00, 69000.00, 3, 0, 'product', 1, 7.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(78, 4, 72, 17, 1, 'Smartphone Redmi Note 13', 'smartphone-redmi-note-13-1786704222902-610', NULL, NULL, '0021600010169', 'XIA-N13-128', 105000.00, 128000.00, 117760.00, 3, 0, 'product', 1, 6.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(79, 4, 73, 17, 1, 'Smartphone Xiaomi Poco X6', 'smartphone-xiaomi-poco-x6-1786704222939-839', NULL, NULL, '0021700010175', 'XIA-POCOX6-256', 138000.00, 165000.00, 151800.00, 3, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(80, 4, 74, 17, 1, 'Smartphone iPhone 11 Reconditionné 64Go', 'smartphone-iphone-11-reconditionn-64go-1786704222955-559', NULL, NULL, '0021800010181', 'APP-IP11-64R', 165000.00, 195000.00, 179400.00, 3, 0, 'product', 1, 5.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(81, 4, 75, 17, 1, 'Smartphone iPhone 12 Reconditionné 64Go', 'smartphone-iphone-12-reconditionn-64go-1786704223231-787', NULL, NULL, '0021900010197', 'APP-IP12-64R', 210000.00, 250000.00, 230000.00, 3, 0, 'product', 1, 6.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(82, 4, 76, 17, 1, 'Smartphone iPhone 13 Reconditionné 128Go', 'smartphone-iphone-13-reconditionn-128go-1786704223241-403', NULL, NULL, '0022000010209', 'APP-IP13-128R', 275000.00, 320000.00, 294400.00, 3, 0, 'product', 1, 16.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(83, 4, 77, 17, 1, 'Smartphone Oppo A18', 'smartphone-oppo-a18-1786704223297-304', NULL, NULL, '0022100010215', 'OPP-A18-64', 71000.00, 88000.00, 80960.00, 3, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(84, 4, 78, 17, 1, 'Smartphone Oppo Reno 11', 'smartphone-oppo-reno-11-1786704223307-621', NULL, NULL, '0022200010221', 'OPP-RENO11-256', 178000.00, 210000.00, 193200.00, 3, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(85, 4, 79, 17, 1, 'Smartphone Vivo Y18', 'smartphone-vivo-y18-1786704223317-222', NULL, NULL, '0022300010237', 'VIV-Y18-128', 74000.00, 92000.00, 84640.00, 3, 0, 'product', 1, 6.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(86, 4, 80, 17, 1, 'Smartphone Nokia 105 Classic', 'smartphone-nokia-105-classic-1786704223322-825', NULL, NULL, '0022400010243', 'NOK-105-CLA', 10500.00, 15000.00, 13800.00, 3, 0, 'product', 1, 11.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(87, 4, 81, 17, 1, 'Smartphone Nokia C22', 'smartphone-nokia-c22-1786704223327-702', NULL, NULL, '0022500010259', 'NOK-C22-64', 42000.00, 55000.00, 50600.00, 3, 0, 'product', 1, 16.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(88, 4, 82, 17, 1, 'Téléphone Basique Itel 2160', 't-l-phone-basique-itel-2160-1786704223332-572', NULL, NULL, '0022600010265', 'ITL-2160', 8500.00, 12000.00, 11040.00, 5, 0, 'product', 1, 17.000, 5.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(89, 4, 83, 17, 1, 'Téléphone Basique Tecno T301', 't-l-phone-basique-tecno-t301-1786704223337-101', NULL, NULL, '0022700010271', 'TEC-T301', 7800.00, 11000.00, 10120.00, 5, 0, 'product', 1, 17.000, 5.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(90, 4, 84, 18, 1, 'Écouteurs Bluetooth JBL Tune 510BT', '-couteurs-bluetooth-jbl-tune-510bt-1786704223509-645', NULL, NULL, '0022800010287', 'JBL-T510BT', 17000.00, 25000.00, 23000.00, 5, 0, 'product', 1, 66.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(91, 4, 85, 18, 1, 'Écouteurs Filaires Basiques', '-couteurs-filaires-basiques-1786704223527-618', NULL, NULL, '0022900010293', 'ECO-FIL-BASIC', 900.00, 2000.00, 1840.00, 5, 0, 'product', 1, 42.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(92, 4, 86, 18, 1, 'Écouteurs Bluetooth Sans Fil TWS', '-couteurs-bluetooth-sans-fil-tws-1786704223548-948', NULL, NULL, '0023000010305', 'TWS-BT-01', 5000.00, 8500.00, 7820.00, 5, 0, 'product', 1, 78.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(93, 4, 87, 18, 1, 'Casque Bluetooth Over-Ear', 'casque-bluetooth-over-ear-1786704223562-32', NULL, NULL, '0023100010311', 'CASQ-BT-OE', 15000.00, 22000.00, 20240.00, 5, 0, 'product', 1, 73.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(94, 4, 88, 18, 1, 'Coque Silicone Universelle', 'coque-silicone-universelle-1786704223578-944', NULL, NULL, '0023200010327', 'COQ-SIL-UNIV', 1000.00, 2500.00, 2300.00, 5, 0, 'product', 1, 32.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(95, 4, 89, 18, 1, 'Coque Antichoc iPhone 12', 'coque-antichoc-iphone-12-1786704223601-674', NULL, NULL, '0023300010333', 'COQ-AC-IP12', 2500.00, 5000.00, 4600.00, 5, 0, 'product', 1, 48.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(96, 4, 90, 18, 1, 'Coque Antichoc Samsung A15', 'coque-antichoc-samsung-a15-1786704223673-306', NULL, NULL, '0023400010349', 'COQ-AC-A15', 2200.00, 4500.00, 4140.00, 5, 0, 'product', 1, 66.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(97, 4, 91, 18, 1, 'Verre Trempé Universel', 'verre-tremp-universel-1786704223684-634', NULL, NULL, '0023500010355', 'VTR-UNIV', 600.00, 1500.00, 1380.00, 5, 0, 'product', 1, 32.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(98, 4, 92, 18, 1, 'Verre Trempé iPhone', 'verre-tremp-iphone-1786704223746-699', NULL, NULL, '0023600010361', 'VTR-IPHONE', 900.00, 2000.00, 1840.00, 5, 0, 'product', 1, 26.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(99, 4, 93, 18, 1, 'Câble USB-C 1m', 'c-ble-usb-c-1m-1786704223798-827', NULL, NULL, '0023700010377', 'CBL-USBC-1M', 1200.00, 3000.00, 2760.00, 5, 0, 'product', 1, 34.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(100, 4, 94, 18, 1, 'Câble USB-C 2m Renforcé', 'c-ble-usb-c-2m-renforc--1786704223807-718', NULL, NULL, '0023800010383', 'CBL-USBC-2M', 2000.00, 4500.00, 4140.00, 5, 0, 'product', 1, 23.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(101, 4, 95, 18, 1, 'Câble Lightning 1m', 'c-ble-lightning-1m-1786704223816-181', NULL, NULL, '0023900010399', 'CBL-LGT-1M', 1500.00, 3500.00, 3220.00, 5, 0, 'product', 1, 63.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(102, 4, 96, 18, 1, 'Câble Micro-USB 1m', 'c-ble-micro-usb-1m-1786704223823-249', NULL, NULL, '0024000010401', 'CBL-MICRO-1M', 800.00, 2000.00, 1840.00, 5, 0, 'product', 1, 47.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(103, 4, 97, 18, 1, 'Chargeur Rapide 20W iPhone', 'chargeur-rapide-20w-iphone-1786704223834-347', NULL, NULL, '0024100010417', 'CHG-20W-IPH', 5500.00, 9000.00, 8280.00, 5, 0, 'product', 1, 49.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(104, 4, 98, 18, 1, 'Chargeur Secteur Basique 5W', 'chargeur-secteur-basique-5w-1786704223843-404', NULL, NULL, '0024200010423', 'CHG-5W-BASIC', 1500.00, 3000.00, 2760.00, 5, 0, 'product', 1, 52.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(105, 4, 99, 18, 1, 'Chargeur Voiture Double USB', 'chargeur-voiture-double-usb-1786704223851-924', NULL, NULL, '0024300010439', 'CHG-VOIT-2USB', 2000.00, 4000.00, 3680.00, 5, 0, 'product', 1, 35.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(106, 4, 100, 18, 1, 'Powerbank 10000mAh', 'powerbank-10000mah-1786704223857-472', NULL, NULL, '0024400010445', 'PWB-10000', 8000.00, 12000.00, 11040.00, 5, 0, 'product', 1, 15.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(107, 4, 101, 18, 1, 'Powerbank 20000mAh', 'powerbank-20000mah-1786704223869-876', NULL, NULL, '0024500010451', 'PWB-20000', 12500.00, 18000.00, 16560.00, 5, 0, 'product', 1, 37.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(108, 4, 102, 18, 1, 'Powerbank Solaire 30000mAh', 'powerbank-solaire-30000mah-1786704223885-822', NULL, NULL, '0024600010467', 'PWB-SOLAR-30000', 20000.00, 28000.00, 25760.00, 5, 0, 'product', 1, 53.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(109, 4, 103, 18, 1, 'Support Téléphone Voiture', 'support-t-l-phone-voiture-1786704223896-204', NULL, NULL, '0024700010473', 'SUP-TEL-VOIT', 2200.00, 4500.00, 4140.00, 5, 0, 'product', 1, 62.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(110, 4, 104, 18, 1, 'Support Téléphone Bureau', 'support-t-l-phone-bureau-1786704223907-620', NULL, NULL, '0024800010489', 'SUP-TEL-BUR', 1400.00, 3000.00, 2760.00, 5, 0, 'product', 1, 15.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(111, 4, 105, 18, 1, 'Trépied Smartphone 1m', 'tr-pied-smartphone-1m-1786704223919-459', NULL, NULL, '0024900010495', 'TRI-SMART-1M', 3800.00, 6500.00, 5980.00, 5, 0, 'product', 1, 17.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(112, 4, 106, 18, 1, 'Perche Selfie Bluetooth', 'perche-selfie-bluetooth-1786704223931-278', NULL, NULL, '0025000010507', 'PER-SELFIE-BT', 3000.00, 5500.00, 5060.00, 5, 0, 'product', 1, 54.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(113, 4, 107, 18, 1, 'Carte Mémoire 32Go', 'carte-m-moire-32go-1786704223947-584', NULL, NULL, '0025100010513', 'SD-32GB', 3200.00, 5000.00, 4600.00, 5, 0, 'product', 1, 45.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(114, 4, 108, 18, 1, 'Carte Mémoire 64Go', 'carte-m-moire-64go-1786704223956-825', NULL, NULL, '0025200010529', 'SD-64GB', 5800.00, 8500.00, 7820.00, 5, 0, 'product', 1, 77.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(115, 4, 109, 18, 1, 'Carte Mémoire 128Go', 'carte-m-moire-128go-1786704223966-449', NULL, NULL, '0025300010535', 'SD-128GB', 10500.00, 15000.00, 13800.00, 5, 0, 'product', 1, 31.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(116, 4, 110, 18, 1, 'Adaptateur OTG USB-C', 'adaptateur-otg-usb-c-1786704223980-540', NULL, NULL, '0025400010541', 'OTG-USBC', 900.00, 2000.00, 1840.00, 5, 0, 'product', 1, 36.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(117, 4, 111, 18, 1, 'Lampe LED USB Portable', 'lampe-led-usb-portable-1786704223991-405', NULL, NULL, '0025500010557', 'LMP-LED-USB', 1200.00, 2500.00, 2300.00, 5, 0, 'product', 1, 69.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(118, 4, 112, 21, 1, 'Enceinte Bluetooth Portable', 'enceinte-bluetooth-portable-1786704224001-450', NULL, NULL, '0025600010563', 'ENC-BT-PORT', 10000.00, 15000.00, 13800.00, 5, 0, 'product', 1, 39.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(119, 4, 113, 21, 1, 'Enceinte Bluetooth Grande Puissance', 'enceinte-bluetooth-grande-puissance-1786704224008-488', NULL, NULL, '0025700010579', 'ENC-BT-XL', 32000.00, 45000.00, 41400.00, 5, 0, 'product', 1, 61.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(120, 4, 114, 21, 1, 'Montre Connectée Sport', 'montre-connect-e-sport-1786704224017-610', NULL, NULL, '0025800010585', 'MTR-CONN-SPORT', 15000.00, 22000.00, 20240.00, 5, 0, 'product', 1, 71.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(121, 4, 115, 21, 1, 'Bracelet Connecté Fitness', 'bracelet-connect-fitness-1786704224025-635', NULL, NULL, '0025900010591', 'BRC-CONN-FIT', 8000.00, 12000.00, 11040.00, 5, 0, 'product', 1, 43.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(122, 4, 116, 21, 1, 'Ordinateur Portable HP 15 i3', 'ordinateur-portable-hp-15-i3-1786704224036-972', NULL, NULL, '0026000010603', 'HP-15-I3-8GB', 330000.00, 385000.00, 354200.00, 2, 0, 'product', 1, 4.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(123, 4, 117, 19, 1, 'Ordinateur Portable HP 15 i5', 'ordinateur-portable-hp-15-i5-1786704224050-431', NULL, NULL, '0026100010619', 'HP-15-I5-8GB', 425000.00, 495000.00, 455400.00, 2, 0, 'product', 1, 3.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(124, 4, 118, 19, 1, 'Ordinateur Portable Lenovo IdeaPad', 'ordinateur-portable-lenovo-ideapad-1786704224064-695', NULL, NULL, '0026200010625', 'LEN-IDEA-I3', 312000.00, 365000.00, 335800.00, 2, 0, 'product', 1, 3.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(125, 4, 119, 19, 1, 'Ordinateur Portable Dell Inspiron', 'ordinateur-portable-dell-inspiron-1786704224070-453', NULL, NULL, '0026300010631', 'DEL-INSP-I3', 360000.00, 420000.00, 386400.00, 2, 0, 'product', 1, 3.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(126, 4, 120, 19, 1, 'Mini PC Bureautique', 'mini-pc-bureautique-1786704224081-651', NULL, NULL, '0026400010647', 'PC-MINI-BUR', 175000.00, 210000.00, 193200.00, 2, 0, 'product', 1, 2.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(127, 4, 121, 19, 1, 'Souris Sans Fil Logitech M185', 'souris-sans-fil-logitech-m185-1786704224090-902', NULL, NULL, '0026500010653', 'LOG-M185', 6000.00, 9000.00, 8280.00, 2, 0, 'product', 1, 20.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(128, 4, 122, 19, 1, 'Souris Filaire Basique', 'souris-filaire-basique-1786704224103-802', NULL, NULL, '0026600010669', 'SOU-FIL-BASIC', 1800.00, 3500.00, 3220.00, 2, 0, 'product', 1, 30.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(129, 4, 123, 19, 1, 'Clavier Filaire AZERTY', 'clavier-filaire-azerty-1786704224114-365', NULL, NULL, '0026700010675', 'CLA-FIL-AZ', 5000.00, 8000.00, 7360.00, 2, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(130, 4, 124, 19, 1, 'Clavier Sans Fil AZERTY', 'clavier-sans-fil-azerty-1786704224123-89', NULL, NULL, '0026800010681', 'CLA-SF-AZ', 10000.00, 15000.00, 13800.00, 2, 0, 'product', 1, 10.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(131, 4, 125, 19, 1, 'Clé USB SanDisk 32Go', 'cl-usb-sandisk-32go-1786704224131-2', NULL, NULL, '0026900010697', 'SDK-USB32', 3000.00, 5000.00, 4600.00, 2, 0, 'product', 1, 40.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(132, 4, 126, 19, 1, 'Clé USB SanDisk 64Go', 'cl-usb-sandisk-64go-1786704224140-869', NULL, NULL, '0027000010709', 'SDK-USB64', 4800.00, 7500.00, 6900.00, 2, 0, 'product', 1, 35.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(133, 4, 127, 19, 1, 'Clé USB SanDisk 128Go', 'cl-usb-sandisk-128go-1786704224151-649', NULL, NULL, '0027100010715', 'SDK-USB128', 8200.00, 12000.00, 11040.00, 2, 0, 'product', 1, 25.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(134, 4, 128, 19, 1, 'Disque Dur Externe 1To', 'disque-dur-externe-1to-1786704224159-661', NULL, NULL, '0027200010721', 'HDD-EXT-1TO', 42000.00, 55000.00, 50600.00, 2, 0, 'product', 1, 12.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(135, 4, 129, 19, 1, 'Disque Dur Externe 2To', 'disque-dur-externe-2to-1786704224170-163', NULL, NULL, '0027300010737', 'HDD-EXT-2TO', 68000.00, 85000.00, 78200.00, 2, 0, 'product', 1, 8.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(136, 4, 130, 19, 1, 'Webcam HD USB', 'webcam-hd-usb-1786704224178-24', NULL, NULL, '0027400010743', 'WEB-HD-USB', 12000.00, 18000.00, 16560.00, 2, 0, 'product', 1, 10.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(137, 4, 131, 19, 1, 'Onduleur 650VA', 'onduleur-650va-1786704224187-206', NULL, NULL, '0027500010759', 'OND-650VA', 26000.00, 35000.00, 32200.00, 2, 0, 'product', 1, 8.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(138, 4, 132, 19, 1, 'Rallonge Multiprise 5 Prises', 'rallonge-multiprise-5-prises-1786704224203-708', NULL, NULL, '0027600010765', 'RAL-MULT-5P', 3500.00, 6000.00, 5520.00, 2, 0, 'product', 1, 25.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(139, 4, 133, 19, 1, 'Câble HDMI 1.5m', 'c-ble-hdmi-1-5m-1786704224216-830', NULL, NULL, '0027700010771', 'CBL-HDMI-15M', 2000.00, 4000.00, 3680.00, 2, 0, 'product', 1, 20.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(140, 4, 134, 19, 1, 'Imprimante Jet d\'Encre HP', 'imprimante-jet-d-encre-hp-1786704224224-429', NULL, NULL, '0027800010787', 'HP-IMP-JET', 78000.00, 95000.00, 87400.00, 2, 0, 'product', 1, 5.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(141, 4, 135, 19, 1, 'Cartouche Encre HP Noir', 'cartouche-encre-hp-noir-1786704224233-356', NULL, NULL, '0027900010793', 'HP-CART-NOIR', 13000.00, 18000.00, 16560.00, 2, 0, 'product', 1, 15.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(142, 4, 136, 20, 1, 'Ventilateur sur Pied 16 pouces', 'ventilateur-sur-pied-16-pouces-1786704224244-525', NULL, NULL, '0028000010805', 'VEN-16P', 16500.00, 22000.00, 20240.00, 2, 0, 'product', 1, 8.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(143, 4, 137, 20, 1, 'Ventilateur de Table', 'ventilateur-de-table-1786704224253-965', NULL, NULL, '0028100010811', 'VEN-TABLE', 8500.00, 12000.00, 11040.00, 2, 0, 'product', 1, 15.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(144, 4, 138, 20, 1, 'Bouilloire Électrique 1.7L', 'bouilloire-lectrique-1-7l-1786704224263-424', NULL, NULL, '0028200010827', 'BOU-17L', 8500.00, 12000.00, 11040.00, 2, 0, 'product', 1, 10.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(145, 4, 139, 20, 1, 'Fer à Repasser Électrique', 'fer-repasser-lectrique-1786704224271-967', NULL, NULL, '0028300010833', 'FER-REPASS', 6500.00, 9500.00, 8740.00, 2, 0, 'product', 1, 12.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(146, 4, 140, 20, 1, 'Mixeur Blender 1.5L', 'mixeur-blender-1-5l-1786704224282-802', NULL, NULL, '0028400010849', 'MIX-BLEND-15L', 13000.00, 18000.00, 16560.00, 2, 0, 'product', 1, 8.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(147, 4, 141, 20, 1, 'Réchaud Électrique 1 Feu', 'r-chaud-lectrique-1-feu-1786704224300-103', NULL, NULL, '0028500010855', 'REC-ELEC-1F', 10000.00, 14000.00, 12880.00, 2, 0, 'product', 1, 10.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(148, 4, 142, 20, 1, 'Réfrigérateur Table Top 90L', 'r-frig-rateur-table-top-90l-1786704224317-458', NULL, NULL, '0028600010861', 'REF-TT-90L', 118000.00, 145000.00, 133400.00, 2, 0, 'product', 1, 3.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(149, 4, 143, 20, 1, 'Congélateur Coffre 200L', 'cong-lateur-coffre-200l-1786704224328-876', NULL, NULL, '0028700010877', 'CON-COF-200L', 220000.00, 265000.00, 243800.00, 2, 0, 'product', 1, 2.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(150, 4, 144, 20, 1, 'Climatiseur Split 1CV', 'climatiseur-split-1cv-1786704224336-203', NULL, NULL, '0028800010883', 'CLI-SPLIT-1CV', 240000.00, 285000.00, 262200.00, 2, 0, 'product', 1, 3.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(151, 4, 145, 20, 1, 'Téléviseur LED 32 pouces', 't-l-viseur-led-32-pouces-1786704224346-770', NULL, NULL, '0028900010899', 'TV-LED-32', 88000.00, 105000.00, 96600.00, 2, 0, 'product', 1, 5.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(152, 4, 146, 20, 1, 'Téléviseur LED 43 pouces', 't-l-viseur-led-43-pouces-1786704224352-202', NULL, NULL, '0029000010901', 'TV-LED-43', 148000.00, 175000.00, 161000.00, 2, 0, 'product', 1, 4.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(153, 4, 147, 20, 1, 'Fer à Lisser Cheveux', 'fer-lisser-cheveux-1786704224364-309', NULL, NULL, '0029100010917', 'FER-LISS-CHV', 10500.00, 15000.00, 13800.00, 2, 0, 'product', 1, 6.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(154, 4, 148, 20, 1, 'Lampe Rechargeable LED', 'lampe-rechargeable-led-1786704224373-150', NULL, NULL, '0029200010923', 'LMP-RECH-LED', 5500.00, 8500.00, 7820.00, 2, 0, 'product', 1, 20.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(155, 4, 149, 20, 1, 'Groupe Électrogène 2KVA', 'groupe-lectrog-ne-2kva-1786704224383-663', NULL, NULL, '0029300010939', 'GRP-ELEC-2KVA', 270000.00, 320000.00, 294400.00, 2, 0, 'product', 1, 2.000, 2.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(156, 4, 150, 8, 2, 'Riz Parfumé Local', 'riz-parfum-local-1786704224389-723', NULL, NULL, '0029400010945', 'RIZ-LOC-1KG', 350.00, 500.00, 450.00, 25, 0, 'product', 1, 200.000, 30.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(157, 4, 151, 8, 2, 'Riz Brisé Importé', 'riz-bris-import--1786704224398-900', NULL, NULL, '0029500010951', 'RIZ-BRI-1KG', 320.00, 450.00, 400.00, 25, 0, 'product', 1, 250.000, 30.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(158, 4, 152, 8, 4, 'Huile Végétale', 'huile-v-g-tale-1786704224405-565', NULL, NULL, '0029600010967', 'HUI-VEG-1L', 950.00, 1200.00, 1100.00, 10, 0, 'product', 1, 80.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(159, 4, 153, 8, 2, 'Sucre en Poudre', 'sucre-en-poudre-1786704224416-267', NULL, NULL, '0029700010973', 'SUC-POUD-1KG', 450.00, 600.00, 550.00, 20, 0, 'product', 1, 150.000, 20.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(160, 4, 154, 8, 2, 'Farine de Blé', 'farine-de-bl--1786704224423-274', NULL, NULL, '0029800010989', 'FAR-BLE-1KG', 400.00, 550.00, 500.00, 20, 0, 'product', 1, 120.000, 20.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(161, 4, 155, 8, 1, 'Lait en Poudre 400g', 'lait-en-poudre-400g-1786704224432-963', NULL, NULL, '0029900010995', 'LAI-POUD-400G', 1900.00, 2500.00, 2300.00, 6, 0, 'product', 1, 60.000, 10.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(162, 4, 156, 8, 1, 'Concentré de Tomate 400g', 'concentr-de-tomate-400g-1786704224440-360', NULL, NULL, '0030000011003', 'TOM-CONC-400G', 600.00, 800.00, 720.00, 10, 0, 'product', 1, 100.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(163, 4, 157, 8, 1, 'Thé Vert Chinois', 'th-vert-chinois-1786704224451-212', NULL, NULL, '0030100011019', 'THE-VERT-CN', 1100.00, 1500.00, 1350.00, 6, 0, 'product', 1, 70.000, 12.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(164, 4, 158, 8, 1, 'Café Soluble 100g', 'caf-soluble-100g-1786704224457-720', NULL, NULL, '0030200011025', 'CAF-SOL-100G', 1650.00, 2200.00, 2000.00, 5, 0, 'product', 1, 45.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(165, 4, 159, 8, 1, 'Savon de Lessive', 'savon-de-lessive-1786704224467-203', NULL, NULL, '0030300011031', 'SAV-LESS', 280.00, 400.00, 360.00, 12, 0, 'product', 1, 180.000, 25.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(166, 4, 160, 8, 1, 'Eau Minérale 1.5L', 'eau-min-rale-1-5l-1786704224476-444', NULL, NULL, '0030400011047', 'EAU-MIN-15L', 350.00, 500.00, 450.00, 12, 0, 'product', 1, 200.000, 30.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(167, 4, 161, 21, 1, 'Crème Hydratante Corps 200ml', 'cr-me-hydratante-corps-200ml-1786704224486-811', NULL, NULL, '0030500011053', 'CRM-HYD-200', 2200.00, 3500.00, 3220.00, 6, 0, 'product', 1, 18.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(168, 4, 162, 21, 1, 'Savon Éclaircissant', 'savon-claircissant-1786704224497-848', NULL, NULL, '0030600011069', 'SAV-ECLAIR', 1300.00, 2000.00, 1840.00, 6, 0, 'product', 1, 18.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(169, 4, 163, 21, 1, 'Parfum Femme 50ml', 'parfum-femme-50ml-1786704224505-44', NULL, NULL, '0030700011075', 'PARF-FEM-50', 6000.00, 8500.00, 7820.00, 6, 0, 'product', 1, 45.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(170, 4, 164, 21, 1, 'Parfum Homme 50ml', 'parfum-homme-50ml-1786704224516-336', NULL, NULL, '0030800011081', 'PARF-HOM-50', 6000.00, 8500.00, 7820.00, 6, 0, 'product', 1, 47.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(171, 4, 165, 21, 1, 'Gel Douche 500ml', 'gel-douche-500ml-1786704224525-73', NULL, NULL, '0030900011097', 'GEL-DOUCHE-500', 2000.00, 3000.00, 2760.00, 6, 0, 'product', 1, 19.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(172, 4, 166, 21, 1, 'Shampoing 400ml', 'shampoing-400ml-1786704224535-603', NULL, NULL, '0031000011109', 'SHAMP-400', 2400.00, 3500.00, 3220.00, 6, 0, 'product', 1, 40.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(173, 4, 167, 21, 1, 'Vernis à Ongles', 'vernis-ongles-1786704224545-740', NULL, NULL, '0031100011115', 'VERN-ONGLES', 900.00, 1500.00, 1380.00, 6, 0, 'product', 1, 30.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(174, 4, 168, 21, 1, 'Rouge à Lèvres', 'rouge-l-vres-1786704224553-41', NULL, NULL, '0031200011121', 'ROUGE-LEVRES', 1600.00, 2500.00, 2300.00, 6, 0, 'product', 1, 20.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(175, 4, 169, 21, 1, 'Kit Maquillage Complet', 'kit-maquillage-complet-1786704224561-54', NULL, NULL, '0031300011137', 'KIT-MAQ-COMP', 10500.00, 15000.00, 13800.00, 6, 0, 'product', 1, 57.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(176, 4, 170, 21, 1, 'Huile de Coco Bio 200ml', 'huile-de-coco-bio-200ml-1786704224569-881', NULL, NULL, '0031400011143', 'HUI-COCO-200', 2000.00, 3000.00, 2760.00, 6, 0, 'product', 1, 28.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(177, 4, 171, 22, 1, 'T-Shirt Coton Femme', 't-shirt-coton-femme-1786704224581-378', NULL, NULL, '0031600011165', 'TSH-FEM-COT', 3000.00, 5000.00, 4600.00, 5, 0, 'product', 1, 18.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(178, 4, 172, 22, 1, 'Boubou Traditionnel Homme', 'boubou-traditionnel-homme-1786704224589-671', NULL, NULL, '0031700011171', 'BOU-TRAD-HOM', 17000.00, 25000.00, 23000.00, 5, 0, 'product', 1, 30.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(179, 4, 173, 22, 1, 'Sandales Homme', 'sandales-homme-1786704224600-579', NULL, NULL, '0031900011193', 'SAND-HOM', 5000.00, 8000.00, 7360.00, 5, 0, 'product', 1, 44.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(180, 4, 174, 22, 1, 'Sandales Femme', 'sandales-femme-1786704224609-54', NULL, NULL, '0032000011205', 'SAND-FEM', 5000.00, 8000.00, 7360.00, 5, 0, 'product', 1, 26.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(181, 4, 175, 22, 1, 'Baskets Sport Unisexe', 'baskets-sport-unisexe-1786704224620-287', NULL, NULL, '0032100011211', 'BASK-SPORT-UNI', 12500.00, 18000.00, 16560.00, 5, 0, 'product', 1, 14.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(182, 4, 176, 22, 1, 'Casquette', 'casquette-1786704224631-555', NULL, NULL, '0032200011227', 'CASQ-STD', 2000.00, 3500.00, 3220.00, 5, 0, 'product', 1, 28.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(183, 4, 177, 22, 1, 'Ceinture Cuir Homme', 'ceinture-cuir-homme-1786704224639-580', NULL, NULL, '0032300011233', 'CEINT-CUIR-HOM', 3800.00, 6000.00, 5520.00, 5, 0, 'product', 1, 44.000, 6.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(184, 4, 178, 23, 1, 'Ampoule LED 9W', 'ampoule-led-9w-1786704224650-836', NULL, NULL, '0032400011249', 'AMP-LED-9W', 700.00, 1200.00, 1104.00, 6, 0, 'product', 1, 48.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(185, 4, 179, 23, 1, 'Ampoule LED 15W', 'ampoule-led-15w-1786704224657-319', NULL, NULL, '0032500011255', 'AMP-LED-15W', 1100.00, 1800.00, 1656.00, 6, 0, 'product', 1, 34.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(186, 4, 180, 23, 1, 'Cadenas Robuste', 'cadenas-robuste-1786704224668-493', NULL, NULL, '0032600011261', 'CAD-ROBUST', 2200.00, 3500.00, 3220.00, 6, 0, 'product', 1, 31.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(187, 4, 181, 23, 1, 'Marteau Standard', 'marteau-standard-1786704224679-962', NULL, NULL, '0032700011277', 'MAR-STD', 2800.00, 4500.00, 4140.00, 6, 0, 'product', 1, 50.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(188, 4, 182, 23, 1, 'Tournevis Set 6 Pièces', 'tournevis-set-6-pi-ces-1786704224689-943', NULL, NULL, '0032800011283', 'TRV-SET-6', 3800.00, 6000.00, 5520.00, 6, 0, 'product', 1, 33.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(189, 4, 183, 23, 1, 'Ruban Adhésif Large', 'ruban-adh-sif-large-1786704224702-360', NULL, NULL, '0032900011299', 'RUB-ADH-LARGE', 550.00, 1000.00, 920.00, 6, 0, 'product', 1, 28.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(190, 4, 184, 23, 1, 'Rallonge Électrique 5m', 'rallonge-lectrique-5m-1786704224714-842', NULL, NULL, '0033000011301', 'RAL-ELEC-5M', 3400.00, 5500.00, 5060.00, 6, 0, 'product', 1, 46.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(191, 4, 185, 23, 1, 'Interrupteur Simple', 'interrupteur-simple-1786704224729-227', NULL, NULL, '0033100011317', 'INTER-SIMPLE', 900.00, 1500.00, 1380.00, 6, 0, 'product', 1, 20.000, 8.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(192, 4, 186, 23, 1, 'Fil Électrique 1.5mm (rouleau)', 'fil-lectrique-1-5mm-rouleau--1786704224739-967', NULL, NULL, '0033200011323', 'FIL-ELEC-15', 11000.00, 15000.00, 13800.00, 2, 0, 'product', 1, 8.000, 3.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(193, 4, 187, 24, 1, 'Cahier 100 Pages', 'cahier-100-pages-1786704224763-72', NULL, NULL, '0033300011339', 'CAH-100P', 300.00, 500.00, 460.00, 10, 0, 'product', 1, 30.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(194, 4, 188, 24, 1, 'Cahier 200 Pages', 'cahier-200-pages-1786704224778-683', NULL, NULL, '0033400011345', 'CAH-200P', 550.00, 900.00, 828.00, 10, 0, 'product', 1, 111.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(195, 4, 189, 24, 1, 'Stylo Bille Bleu', 'stylo-bille-bleu-1786704224793-344', NULL, NULL, '0033500011351', 'STY-BLEU', 50.00, 100.00, 92.00, 10, 0, 'product', 1, 124.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL);
INSERT INTO `products` (`id`, `company_id`, `catalog_product_id`, `category_id`, `unit_id`, `name`, `slug`, `description`, `ingredients_text`, `barcode`, `sku`, `cost_price`, `retail_price`, `wholesale_price`, `wholesale_min_qty`, `allow_custom_price`, `product_type`, `manage_stock`, `current_stock`, `low_stock_threshold`, `is_active`, `is_available`, `image_url`, `created_at`, `updated_at`, `deleted_at`) VALUES
(196, 4, 190, 24, 1, 'Stylo Bille Noir', 'stylo-bille-noir-1786704224802-414', NULL, NULL, '0033600011367', 'STY-NOIR', 50.00, 100.00, 92.00, 10, 0, 'product', 1, 100.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(197, 4, 191, 24, 1, 'Crayon à Papier', 'crayon-papier-1786704224814-56', NULL, NULL, '0033700011373', 'CRAY-PAP', 50.00, 100.00, 92.00, 10, 0, 'product', 1, 101.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(198, 4, 192, 24, 1, 'Cartable Scolaire', 'cartable-scolaire-1786704224827-824', NULL, NULL, '0033800011389', 'CART-SCOL', 5200.00, 8000.00, 7360.00, 10, 0, 'product', 1, 39.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(199, 4, 193, 24, 1, 'Calculatrice Scientifique', 'calculatrice-scientifique-1786704224840-85', NULL, NULL, '0033900011395', 'CALC-SCI', 4200.00, 6500.00, 5980.00, 10, 0, 'product', 1, 34.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(200, 4, 194, 24, 1, 'Rame Papier A4 500 Feuilles', 'rame-papier-a4-500-feuilles-1786704224852-180', NULL, NULL, '0034000011407', 'RAME-A4-500', 3200.00, 4500.00, 4140.00, 10, 0, 'product', 1, 100.000, 15.000, 1, 1, NULL, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_catalog`
--

CREATE TABLE `product_catalog` (
  `id` bigint UNSIGNED NOT NULL,
  `owner_id` bigint UNSIGNED NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_id` smallint UNSIGNED NOT NULL DEFAULT '1',
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_catalog`
--

INSERT INTO `product_catalog` (`id`, `owner_id`, `name`, `slug`, `barcode`, `description`, `image_url`, `unit_id`, `category_id`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 5, 'test3', 'test3', NULL, 'mon produit cool', NULL, 1, 4, 1, '2026-07-21 14:46:11', '2026-08-03 11:39:18', NULL),
(2, 5, 'iphone 14 pro', 'iphone-14-pro', NULL, 'aucune', 'http://global-visept-backend.onrender.com/uploads/products/product-1782250788984-669583536.png', 1, 4, 1, '2026-07-21 14:59:42', '2026-08-03 11:39:18', NULL),
(3, 5, 'iphone 13 pro', 'iphone-13-pro', NULL, 'telephone de marque apple', NULL, 1, 4, 1, '2026-07-21 14:59:43', '2026-08-03 11:39:18', NULL),
(4, 9, 'tes', 'tes', NULL, 'werty', NULL, 1, NULL, 1, '2026-07-28 11:51:53', '2026-07-28 11:51:53', NULL),
(6, 9, 'rizs', 'riz', NULL, NULL, NULL, 1, NULL, 1, '2026-07-29 00:20:33', '2026-07-29 00:20:50', NULL),
(8, 5, 'test2', 'test2', NULL, 'aucune', NULL, 1, NULL, 1, '2026-08-03 13:07:47', '2026-08-03 13:07:47', NULL),
(9, 5, 'Samsung Galaxy A54', 'samsung-galaxy-a54-cat-1785999902001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(10, 5, '├ëcouteurs Bluetooth', 'ecouteurs-bluetooth-cat-1785999902002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(11, 5, 'Chargeur rapide USB-C', 'chargeur-rapide-usbc-cat-1785999902003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(12, 5, 'Batterie externe 20000mAh', 'batterie-externe-cat-1785999902004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(13, 5, 'Cl├® USB 32Go', 'cle-usb-32go-cat-1785999902005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(14, 5, 'Tablette Huawei MatePad', 'tablette-huawei-matepad-cat-1785999902006', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(15, 5, 'C├óble HDMI 2m', 'cable-hdmi-2m-cat-1785999902007', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(16, 5, 'Souris sans fil', 'souris-sans-fil-cat-1785999902008', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(17, 5, 'Bazin Riche Homme', 'bazin-riche-homme-cat-1785999903001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(18, 5, 'Robe Wax Femme', 'robe-wax-femme-cat-1785999903002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(19, 5, 'T-shirt Coton Homme', 't-shirt-coton-homme-cat-1785999903003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(20, 5, 'Jean Slim Homme', 'jean-slim-homme-cat-1785999903004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(21, 5, 'Pagn├® 6 yards', 'pagne-6yards-cat-1785999903005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(22, 5, 'Ensemble Enfant 2-8 ans', 'ensemble-enfant-cat-1785999903006', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(23, 5, 'Chemise Formelle Homme', 'chemise-formelle-homme-cat-1785999903007', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(24, 5, 'D├®bardeur Femme', 'debardeur-femme-cat-1785999903008', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(25, 5, 'Basket Homme Nike', 'basket-homme-nike-cat-1785999904001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(26, 5, 'Sandale Cuir Femme', 'sandale-cuir-femme-cat-1785999904002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(27, 5, 'Chaussure Formelle Homme', 'chaussure-formelle-homme-cat-1785999904003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(28, 5, 'Tong Plastique Mixte', 'tong-plastique-mixte-cat-1785999904004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(29, 5, 'Chaussure Enfant 26-35', 'chaussure-enfant-cat-1785999904005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(30, 5, 'Huile V├®g├®tale 5L', 'huile-vegetale-5l-cat-1785999905001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(31, 5, 'Riz Parfum├® 25kg', 'riz-parfume-25kg-cat-1785999905002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(32, 5, 'Lait concentr├® sucr├®', 'lait-concentre-sucre-cat-1785999905003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(33, 5, 'Caf├® soluble 250g', 'cafe-soluble-250g-cat-1785999905004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(34, 5, 'Sucre en poudre 1kg', 'sucre-poudre-1kg-cat-1785999905005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(35, 5, 'Sardines en boite 125g', 'sardines-boite-125g-cat-1785999905006', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(36, 5, 'Eau min├®rale 1.5L', 'eau-minerale-1l5-cat-1785999905007', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(37, 5, 'P├ótes alimentaires 500g', 'pates-alimentaires-500g-cat-1785999905008', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(38, 5, 'Cr├¿me hydratante corps', 'creme-hydratante-corps-cat-1785999906001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(39, 5, 'Savon de toilette 200g', 'savon-toilette-200g-cat-1785999906002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(40, 5, 'Shampoing cheveux cr├®pus', 'shampoing-cheveux-crepus-cat-1785999906003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(41, 5, 'D├®odorant roll-on', 'deodorant-roll-on-cat-1785999906004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(42, 5, 'Huile de coco 250ml', 'huile-de-coco-250ml-cat-1785999906005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(43, 5, 'Seau plastique 15L', 'seau-plastique-15l-cat-1785999907001', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(44, 5, 'Balai en paille', 'balai-paille-cat-1785999907002', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(45, 5, 'Moustiquaire impr├®gn├®e', 'moustiquaire-impregnee-cat-1785999907003', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(46, 5, 'Bougie parfum├®e 4h', 'bougie-parfumee-4h-cat-1785999907004', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(47, 5, 'Bassine aluminium 30cm', 'bassine-aluminium-30cm-cat-1785999907005', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(48, 5, 'Lampe torche LED', 'lampe-torche-led-cat-1785999907006', NULL, NULL, NULL, 1, NULL, 1, '2026-08-07 23:00:39', '2026-08-07 23:00:39', NULL),
(55, 5, 'Smartphone Samsung Galaxy A14', 'smartphone-samsung-galaxy-a14', '8806091234567', 'Samsung A14 64Go 4Go RAM Noir', NULL, 1, 17, 1, '2026-08-14 10:43:41', '2026-08-14 10:43:41', NULL),
(56, 5, 'Chargeur Rapide 25W Type-C', 'chargeur-rapide-25w-type-c', '6934177701234', 'Adaptateur secteur USB-C charge rapide', NULL, 1, 18, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(57, 5, 'Smartphone Samsung Galaxy A05', 'smartphone-samsung-galaxy-a05', '0020100010013', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(58, 5, 'Smartphone Samsung Galaxy A15', 'smartphone-samsung-galaxy-a15', '0020200010029', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(59, 5, 'Smartphone Samsung Galaxy A25', 'smartphone-samsung-galaxy-a25', '0020300010035', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(60, 5, 'Smartphone Samsung Galaxy S23', 'smartphone-samsung-galaxy-s23', '0020400010041', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(61, 5, 'Smartphone Tecno Spark 20', 'smartphone-tecno-spark-20', '0020500010057', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(62, 5, 'Smartphone Tecno Spark 10', 'smartphone-tecno-spark-10', '0020600010063', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(63, 5, 'Smartphone Tecno Camon 20', 'smartphone-tecno-camon-20', '0020700010079', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(64, 5, 'Smartphone Tecno Pova 6', 'smartphone-tecno-pova-6', '0020800010085', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(65, 5, 'Smartphone Infinix Hot 40', 'smartphone-infinix-hot-40', '0020900010091', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(66, 5, 'Smartphone Infinix Note 30', 'smartphone-infinix-note-30', '0021000010103', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(67, 5, 'Smartphone Infinix Smart 8', 'smartphone-infinix-smart-8', '0021100010119', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(68, 5, 'Smartphone Infinix Zero 30', 'smartphone-infinix-zero-30', '0021200010125', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(69, 5, 'Smartphone Itel A70', 'smartphone-itel-a70', '0021300010131', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(70, 5, 'Smartphone Itel P55', 'smartphone-itel-p55', '0021400010147', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(71, 5, 'Smartphone Redmi 13C', 'smartphone-redmi-13c', '0021500010153', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(72, 5, 'Smartphone Redmi Note 13', 'smartphone-redmi-note-13', '0021600010169', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(73, 5, 'Smartphone Xiaomi Poco X6', 'smartphone-xiaomi-poco-x6', '0021700010175', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(74, 5, 'Smartphone iPhone 11 Reconditionné 64Go', 'smartphone-iphone-11-reconditionn-64go', '0021800010181', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:42', '2026-08-14 10:43:42', NULL),
(75, 5, 'Smartphone iPhone 12 Reconditionné 64Go', 'smartphone-iphone-12-reconditionn-64go', '0021900010197', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(76, 5, 'Smartphone iPhone 13 Reconditionné 128Go', 'smartphone-iphone-13-reconditionn-128go', '0022000010209', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(77, 5, 'Smartphone Oppo A18', 'smartphone-oppo-a18', '0022100010215', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(78, 5, 'Smartphone Oppo Reno 11', 'smartphone-oppo-reno-11', '0022200010221', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(79, 5, 'Smartphone Vivo Y18', 'smartphone-vivo-y18', '0022300010237', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(80, 5, 'Smartphone Nokia 105 Classic', 'smartphone-nokia-105-classic', '0022400010243', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(81, 5, 'Smartphone Nokia C22', 'smartphone-nokia-c22', '0022500010259', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(82, 5, 'Téléphone Basique Itel 2160', 't-l-phone-basique-itel-2160', '0022600010265', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(83, 5, 'Téléphone Basique Tecno T301', 't-l-phone-basique-tecno-t301', '0022700010271', NULL, NULL, 1, 17, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(84, 5, 'Écouteurs Bluetooth JBL Tune 510BT', 'couteurs-bluetooth-jbl-tune-510bt', '0022800010287', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(85, 5, 'Écouteurs Filaires Basiques', 'couteurs-filaires-basiques', '0022900010293', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(86, 5, 'Écouteurs Bluetooth Sans Fil TWS', 'couteurs-bluetooth-sans-fil-tws', '0023000010305', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(87, 5, 'Casque Bluetooth Over-Ear', 'casque-bluetooth-over-ear', '0023100010311', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(88, 5, 'Coque Silicone Universelle', 'coque-silicone-universelle', '0023200010327', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(89, 5, 'Coque Antichoc iPhone 12', 'coque-antichoc-iphone-12', '0023300010333', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(90, 5, 'Coque Antichoc Samsung A15', 'coque-antichoc-samsung-a15', '0023400010349', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(91, 5, 'Verre Trempé Universel', 'verre-tremp-universel', '0023500010355', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(92, 5, 'Verre Trempé iPhone', 'verre-tremp-iphone', '0023600010361', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(93, 5, 'Câble USB-C 1m', 'c-ble-usb-c-1m', '0023700010377', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(94, 5, 'Câble USB-C 2m Renforcé', 'c-ble-usb-c-2m-renforc', '0023800010383', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(95, 5, 'Câble Lightning 1m', 'c-ble-lightning-1m', '0023900010399', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(96, 5, 'Câble Micro-USB 1m', 'c-ble-micro-usb-1m', '0024000010401', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(97, 5, 'Chargeur Rapide 20W iPhone', 'chargeur-rapide-20w-iphone', '0024100010417', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(98, 5, 'Chargeur Secteur Basique 5W', 'chargeur-secteur-basique-5w', '0024200010423', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(99, 5, 'Chargeur Voiture Double USB', 'chargeur-voiture-double-usb', '0024300010439', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(100, 5, 'Powerbank 10000mAh', 'powerbank-10000mah', '0024400010445', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(101, 5, 'Powerbank 20000mAh', 'powerbank-20000mah', '0024500010451', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(102, 5, 'Powerbank Solaire 30000mAh', 'powerbank-solaire-30000mah', '0024600010467', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(103, 5, 'Support Téléphone Voiture', 'support-t-l-phone-voiture', '0024700010473', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(104, 5, 'Support Téléphone Bureau', 'support-t-l-phone-bureau', '0024800010489', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(105, 5, 'Trépied Smartphone 1m', 'tr-pied-smartphone-1m', '0024900010495', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(106, 5, 'Perche Selfie Bluetooth', 'perche-selfie-bluetooth', '0025000010507', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(107, 5, 'Carte Mémoire 32Go', 'carte-m-moire-32go', '0025100010513', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(108, 5, 'Carte Mémoire 64Go', 'carte-m-moire-64go', '0025200010529', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(109, 5, 'Carte Mémoire 128Go', 'carte-m-moire-128go', '0025300010535', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(110, 5, 'Adaptateur OTG USB-C', 'adaptateur-otg-usb-c', '0025400010541', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(111, 5, 'Lampe LED USB Portable', 'lampe-led-usb-portable', '0025500010557', NULL, NULL, 1, 18, 1, '2026-08-14 10:43:43', '2026-08-14 10:43:43', NULL),
(112, 5, 'Enceinte Bluetooth Portable', 'enceinte-bluetooth-portable', '0025600010563', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(113, 5, 'Enceinte Bluetooth Grande Puissance', 'enceinte-bluetooth-grande-puissance', '0025700010579', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(114, 5, 'Montre Connectée Sport', 'montre-connect-e-sport', '0025800010585', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(115, 5, 'Bracelet Connecté Fitness', 'bracelet-connect-fitness', '0025900010591', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(116, 5, 'Ordinateur Portable HP 15 i3', 'ordinateur-portable-hp-15-i3', '0026000010603', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 13:50:08', NULL),
(117, 5, 'Ordinateur Portable HP 15 i5', 'ordinateur-portable-hp-15-i5', '0026100010619', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(118, 5, 'Ordinateur Portable Lenovo IdeaPad', 'ordinateur-portable-lenovo-ideapad', '0026200010625', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(119, 5, 'Ordinateur Portable Dell Inspiron', 'ordinateur-portable-dell-inspiron', '0026300010631', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(120, 5, 'Mini PC Bureautique', 'mini-pc-bureautique', '0026400010647', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(121, 5, 'Souris Sans Fil Logitech M185', 'souris-sans-fil-logitech-m185', '0026500010653', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(122, 5, 'Souris Filaire Basique', 'souris-filaire-basique', '0026600010669', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(123, 5, 'Clavier Filaire AZERTY', 'clavier-filaire-azerty', '0026700010675', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(124, 5, 'Clavier Sans Fil AZERTY', 'clavier-sans-fil-azerty', '0026800010681', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(125, 5, 'Clé USB SanDisk 32Go', 'cl-usb-sandisk-32go', '0026900010697', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(126, 5, 'Clé USB SanDisk 64Go', 'cl-usb-sandisk-64go', '0027000010709', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(127, 5, 'Clé USB SanDisk 128Go', 'cl-usb-sandisk-128go', '0027100010715', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(128, 5, 'Disque Dur Externe 1To', 'disque-dur-externe-1to', '0027200010721', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(129, 5, 'Disque Dur Externe 2To', 'disque-dur-externe-2to', '0027300010737', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(130, 5, 'Webcam HD USB', 'webcam-hd-usb', '0027400010743', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(131, 5, 'Onduleur 650VA', 'onduleur-650va', '0027500010759', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(132, 5, 'Rallonge Multiprise 5 Prises', 'rallonge-multiprise-5-prises', '0027600010765', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(133, 5, 'Câble HDMI 1.5m', 'c-ble-hdmi-1-5m', '0027700010771', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(134, 5, 'Imprimante Jet d\'Encre HP', 'imprimante-jet-d-encre-hp', '0027800010787', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(135, 5, 'Cartouche Encre HP Noir', 'cartouche-encre-hp-noir', '0027900010793', NULL, NULL, 1, 19, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(136, 5, 'Ventilateur sur Pied 16 pouces', 'ventilateur-sur-pied-16-pouces', '0028000010805', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(137, 5, 'Ventilateur de Table', 'ventilateur-de-table', '0028100010811', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(138, 5, 'Bouilloire Électrique 1.7L', 'bouilloire-lectrique-1-7l', '0028200010827', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(139, 5, 'Fer à Repasser Électrique', 'fer-repasser-lectrique', '0028300010833', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(140, 5, 'Mixeur Blender 1.5L', 'mixeur-blender-1-5l', '0028400010849', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(141, 5, 'Réchaud Électrique 1 Feu', 'r-chaud-lectrique-1-feu', '0028500010855', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(142, 5, 'Réfrigérateur Table Top 90L', 'r-frig-rateur-table-top-90l', '0028600010861', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(143, 5, 'Congélateur Coffre 200L', 'cong-lateur-coffre-200l', '0028700010877', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(144, 5, 'Climatiseur Split 1CV', 'climatiseur-split-1cv', '0028800010883', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(145, 5, 'Téléviseur LED 32 pouces', 't-l-viseur-led-32-pouces', '0028900010899', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(146, 5, 'Téléviseur LED 43 pouces', 't-l-viseur-led-43-pouces', '0029000010901', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(147, 5, 'Fer à Lisser Cheveux', 'fer-lisser-cheveux', '0029100010917', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(148, 5, 'Lampe Rechargeable LED', 'lampe-rechargeable-led', '0029200010923', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(149, 5, 'Groupe Électrogène 2KVA', 'groupe-lectrog-ne-2kva', '0029300010939', NULL, NULL, 1, 20, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(150, 5, 'Riz Parfumé Local', 'riz-parfum-local', '0029400010945', NULL, NULL, 2, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(151, 5, 'Riz Brisé Importé', 'riz-bris-import', '0029500010951', NULL, NULL, 2, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(152, 5, 'Huile Végétale', 'huile-v-g-tale', '0029600010967', NULL, NULL, 4, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(153, 5, 'Sucre en Poudre', 'sucre-en-poudre', '0029700010973', NULL, NULL, 2, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(154, 5, 'Farine de Blé', 'farine-de-bl', '0029800010989', NULL, NULL, 2, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(155, 5, 'Lait en Poudre 400g', 'lait-en-poudre-400g', '0029900010995', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(156, 5, 'Concentré de Tomate 400g', 'concentr-de-tomate-400g', '0030000011003', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(157, 5, 'Thé Vert Chinois', 'th-vert-chinois', '0030100011019', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(158, 5, 'Café Soluble 100g', 'caf-soluble-100g', '0030200011025', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(159, 5, 'Savon de Lessive', 'savon-de-lessive', '0030300011031', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(160, 5, 'Eau Minérale 1.5L', 'eau-min-rale-1-5l', '0030400011047', NULL, NULL, 1, 8, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(161, 5, 'Crème Hydratante Corps 200ml', 'cr-me-hydratante-corps-200ml', '0030500011053', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(162, 5, 'Savon Éclaircissant', 'savon-claircissant', '0030600011069', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(163, 5, 'Parfum Femme 50ml', 'parfum-femme-50ml', '0030700011075', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(164, 5, 'Parfum Homme 50ml', 'parfum-homme-50ml', '0030800011081', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(165, 5, 'Gel Douche 500ml', 'gel-douche-500ml', '0030900011097', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(166, 5, 'Shampoing 400ml', 'shampoing-400ml', '0031000011109', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(167, 5, 'Vernis à Ongles', 'vernis-ongles', '0031100011115', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(168, 5, 'Rouge à Lèvres', 'rouge-l-vres', '0031200011121', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(169, 5, 'Kit Maquillage Complet', 'kit-maquillage-complet', '0031300011137', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(170, 5, 'Huile de Coco Bio 200ml', 'huile-de-coco-bio-200ml', '0031400011143', NULL, NULL, 1, 21, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(171, 5, 'T-Shirt Coton Femme', 't-shirt-coton-femme', '0031600011165', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(172, 5, 'Boubou Traditionnel Homme', 'boubou-traditionnel-homme', '0031700011171', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(173, 5, 'Sandales Homme', 'sandales-homme', '0031900011193', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(174, 5, 'Sandales Femme', 'sandales-femme', '0032000011205', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(175, 5, 'Baskets Sport Unisexe', 'baskets-sport-unisexe', '0032100011211', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(176, 5, 'Casquette', 'casquette', '0032200011227', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(177, 5, 'Ceinture Cuir Homme', 'ceinture-cuir-homme', '0032300011233', NULL, NULL, 1, 22, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(178, 5, 'Ampoule LED 9W', 'ampoule-led-9w', '0032400011249', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(179, 5, 'Ampoule LED 15W', 'ampoule-led-15w', '0032500011255', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(180, 5, 'Cadenas Robuste', 'cadenas-robuste', '0032600011261', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(181, 5, 'Marteau Standard', 'marteau-standard', '0032700011277', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(182, 5, 'Tournevis Set 6 Pièces', 'tournevis-set-6-pi-ces', '0032800011283', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(183, 5, 'Ruban Adhésif Large', 'ruban-adh-sif-large', '0032900011299', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(184, 5, 'Rallonge Électrique 5m', 'rallonge-lectrique-5m', '0033000011301', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(185, 5, 'Interrupteur Simple', 'interrupteur-simple', '0033100011317', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(186, 5, 'Fil Électrique 1.5mm (rouleau)', 'fil-lectrique-1-5mm-rouleau', '0033200011323', NULL, NULL, 1, 23, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(187, 5, 'Cahier 100 Pages', 'cahier-100-pages', '0033300011339', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(188, 5, 'Cahier 200 Pages', 'cahier-200-pages', '0033400011345', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(189, 5, 'Stylo Bille Bleu', 'stylo-bille-bleu', '0033500011351', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(190, 5, 'Stylo Bille Noir', 'stylo-bille-noir', '0033600011367', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(191, 5, 'Crayon à Papier', 'crayon-papier', '0033700011373', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(192, 5, 'Cartable Scolaire', 'cartable-scolaire', '0033800011389', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(193, 5, 'Calculatrice Scientifique', 'calculatrice-scientifique', '0033900011395', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL),
(194, 5, 'Rame Papier A4 500 Feuilles', 'rame-papier-a4-500-feuilles', '0034000011407', NULL, NULL, 1, 24, 1, '2026-08-14 10:43:44', '2026-08-14 10:43:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_compositions`
--

CREATE TABLE `product_compositions` (
  `id` bigint UNSIGNED NOT NULL,
  `parent_product_id` bigint UNSIGNED NOT NULL COMMENT 'Le plat/produit composé',
  `ingredient_id` bigint UNSIGNED NOT NULL COMMENT 'L''ingrédient',
  `quantity_used` decimal(12,3) NOT NULL COMMENT 'Quantité utilisée par portion',
  `unit_id` smallint UNSIGNED NOT NULL,
  `is_optional` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retail_price` decimal(12,2) DEFAULT NULL,
  `wholesale_price` decimal(12,2) DEFAULT NULL,
  `current_stock` decimal(12,3) DEFAULT '0.000',
  `low_stock_threshold` decimal(12,3) DEFAULT '10.000',
  `attributes` json DEFAULT NULL COMMENT '{"taille":"XL","couleur":"Rouge"}',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `table_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom personnalisé (ex: "Table VIP")',
  `capacity` tinyint UNSIGNED NOT NULL DEFAULT '2',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Salle, Terrasse, etc.',
  `position_x` int DEFAULT NULL COMMENT 'Position sur plan de salle',
  `position_y` int DEFAULT NULL,
  `status` enum('available','occupied','reserved','needs_cleaning','out_of_service') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_system` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `company_id`, `name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
(1, 1, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(2, 1, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(3, 1, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(4, 2, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(5, 2, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(6, 2, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(7, 3, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(8, 3, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(9, 3, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(10, 4, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(11, 4, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(12, 4, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(13, 7, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(14, 7, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(15, 7, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:09', '2026-08-01 16:32:09'),
(16, 8, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(17, 8, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(18, 8, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(19, 9, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(20, 9, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(21, 9, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(22, 5, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(23, 5, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(24, 5, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(25, 6, 'Propriétaire', 'Tous les droits sur l\'entreprise', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(26, 6, 'Gérant', 'Gestion complète sauf paramètres', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(27, 6, 'Caissier', 'Encaissement et ventes uniquement', 1, '2026-08-01 16:32:10', '2026-08-01 16:32:10'),
(28, 4, 'gestionnaire de stock', 'il gere les commandes fournisseurs, les receptions et les transfert entrepot vers boutique et boutique vers entrepot', 0, '2026-08-01 19:26:50', '2026-08-01 19:26:50'),
(29, 4, 'caissier_kaba', 'vendeur', 0, '2026-08-04 13:16:34', '2026-08-04 13:16:34');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` bigint UNSIGNED NOT NULL,
  `permission_id` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1),
(13, 1),
(14, 1),
(15, 1),
(16, 1),
(17, 1),
(18, 1),
(19, 1),
(20, 1),
(21, 1),
(22, 1),
(23, 1),
(24, 1),
(25, 1),
(26, 1),
(27, 1),
(1, 2),
(2, 2),
(3, 2),
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 2),
(10, 2),
(11, 2),
(12, 2),
(13, 2),
(14, 2),
(15, 2),
(16, 2),
(17, 2),
(18, 2),
(19, 2),
(20, 2),
(21, 2),
(22, 2),
(23, 2),
(24, 2),
(25, 2),
(26, 2),
(27, 2),
(28, 2),
(1, 3),
(2, 3),
(4, 3),
(5, 3),
(7, 3),
(8, 3),
(10, 3),
(11, 3),
(13, 3),
(14, 3),
(16, 3),
(17, 3),
(19, 3),
(20, 3),
(22, 3),
(23, 3),
(25, 3),
(26, 3),
(1, 4),
(2, 4),
(4, 4),
(5, 4),
(7, 4),
(8, 4),
(10, 4),
(11, 4),
(13, 4),
(14, 4),
(16, 4),
(17, 4),
(19, 4),
(20, 4),
(22, 4),
(23, 4),
(25, 4),
(26, 4),
(1, 5),
(2, 5),
(4, 5),
(5, 5),
(7, 5),
(8, 5),
(10, 5),
(11, 5),
(13, 5),
(14, 5),
(16, 5),
(17, 5),
(19, 5),
(20, 5),
(22, 5),
(23, 5),
(25, 5),
(26, 5),
(1, 6),
(2, 6),
(4, 6),
(5, 6),
(7, 6),
(8, 6),
(10, 6),
(11, 6),
(13, 6),
(14, 6),
(16, 6),
(17, 6),
(19, 6),
(20, 6),
(22, 6),
(23, 6),
(25, 6),
(26, 6),
(28, 6),
(1, 7),
(2, 7),
(4, 7),
(5, 7),
(7, 7),
(8, 7),
(10, 7),
(11, 7),
(13, 7),
(14, 7),
(16, 7),
(17, 7),
(19, 7),
(20, 7),
(22, 7),
(23, 7),
(25, 7),
(26, 7),
(28, 7),
(1, 8),
(2, 8),
(3, 8),
(4, 8),
(5, 8),
(6, 8),
(7, 8),
(8, 8),
(9, 8),
(10, 8),
(11, 8),
(12, 8),
(13, 8),
(14, 8),
(15, 8),
(16, 8),
(17, 8),
(18, 8),
(19, 8),
(20, 8),
(21, 8),
(22, 8),
(23, 8),
(24, 8),
(25, 8),
(26, 8),
(27, 8),
(1, 9),
(2, 9),
(3, 9),
(4, 9),
(5, 9),
(6, 9),
(7, 9),
(8, 9),
(9, 9),
(10, 9),
(11, 9),
(12, 9),
(13, 9),
(14, 9),
(15, 9),
(16, 9),
(17, 9),
(18, 9),
(19, 9),
(20, 9),
(21, 9),
(22, 9),
(23, 9),
(24, 9),
(25, 9),
(26, 9),
(27, 9),
(29, 9),
(1, 10),
(2, 10),
(4, 10),
(5, 10),
(7, 10),
(8, 10),
(10, 10),
(11, 10),
(13, 10),
(14, 10),
(16, 10),
(17, 10),
(19, 10),
(20, 10),
(22, 10),
(23, 10),
(25, 10),
(26, 10),
(1, 11),
(2, 11),
(4, 11),
(5, 11),
(7, 11),
(8, 11),
(10, 11),
(11, 11),
(13, 11),
(14, 11),
(16, 11),
(17, 11),
(19, 11),
(20, 11),
(22, 11),
(23, 11),
(25, 11),
(26, 11),
(1, 12),
(2, 12),
(4, 12),
(5, 12),
(7, 12),
(8, 12),
(10, 12),
(11, 12),
(13, 12),
(14, 12),
(16, 12),
(17, 12),
(19, 12),
(20, 12),
(22, 12),
(23, 12),
(25, 12),
(26, 12),
(1, 13),
(2, 13),
(3, 13),
(4, 13),
(5, 13),
(6, 13),
(7, 13),
(8, 13),
(9, 13),
(10, 13),
(11, 13),
(12, 13),
(13, 13),
(14, 13),
(15, 13),
(16, 13),
(17, 13),
(18, 13),
(19, 13),
(20, 13),
(21, 13),
(22, 13),
(23, 13),
(24, 13),
(25, 13),
(26, 13),
(27, 13),
(29, 13),
(1, 14),
(2, 14),
(4, 14),
(5, 14),
(7, 14),
(8, 14),
(10, 14),
(11, 14),
(13, 14),
(14, 14),
(16, 14),
(17, 14),
(19, 14),
(20, 14),
(22, 14),
(23, 14),
(25, 14),
(26, 14),
(1, 15),
(2, 15),
(3, 15),
(4, 15),
(5, 15),
(6, 15),
(7, 15),
(8, 15),
(9, 15),
(10, 15),
(11, 15),
(12, 15),
(13, 15),
(14, 15),
(15, 15),
(16, 15),
(17, 15),
(18, 15),
(19, 15),
(20, 15),
(21, 15),
(22, 15),
(23, 15),
(24, 15),
(25, 15),
(26, 15),
(27, 15),
(1, 16),
(2, 16),
(4, 16),
(5, 16),
(7, 16),
(8, 16),
(10, 16),
(11, 16),
(13, 16),
(14, 16),
(16, 16),
(17, 16),
(19, 16),
(20, 16),
(22, 16),
(23, 16),
(25, 16),
(26, 16),
(1, 17),
(2, 17),
(4, 17),
(5, 17),
(7, 17),
(8, 17),
(10, 17),
(11, 17),
(13, 17),
(14, 17),
(16, 17),
(17, 17),
(19, 17),
(20, 17),
(22, 17),
(23, 17),
(25, 17),
(26, 17),
(28, 17),
(1, 18),
(2, 18),
(4, 18),
(5, 18),
(7, 18),
(8, 18),
(10, 18),
(11, 18),
(13, 18),
(14, 18),
(16, 18),
(17, 18),
(19, 18),
(20, 18),
(22, 18),
(23, 18),
(25, 18),
(26, 18),
(28, 18),
(1, 19),
(2, 19),
(4, 19),
(5, 19),
(7, 19),
(8, 19),
(10, 19),
(11, 19),
(13, 19),
(14, 19),
(16, 19),
(17, 19),
(19, 19),
(20, 19),
(22, 19),
(23, 19),
(25, 19),
(26, 19),
(28, 19),
(1, 20),
(2, 20),
(4, 20),
(5, 20),
(7, 20),
(8, 20),
(10, 20),
(11, 20),
(13, 20),
(14, 20),
(16, 20),
(17, 20),
(19, 20),
(20, 20),
(22, 20),
(23, 20),
(25, 20),
(26, 20),
(1, 21),
(2, 21),
(4, 21),
(5, 21),
(7, 21),
(8, 21),
(10, 21),
(11, 21),
(13, 21),
(14, 21),
(16, 21),
(17, 21),
(19, 21),
(20, 21),
(22, 21),
(23, 21),
(25, 21),
(26, 21),
(28, 21),
(1, 22),
(2, 22),
(4, 22),
(5, 22),
(7, 22),
(8, 22),
(10, 22),
(11, 22),
(13, 22),
(14, 22),
(16, 22),
(17, 22),
(19, 22),
(20, 22),
(22, 22),
(23, 22),
(25, 22),
(26, 22),
(28, 22),
(1, 23),
(2, 23),
(4, 23),
(5, 23),
(7, 23),
(8, 23),
(10, 23),
(11, 23),
(13, 23),
(14, 23),
(16, 23),
(17, 23),
(19, 23),
(20, 23),
(22, 23),
(23, 23),
(25, 23),
(26, 23),
(28, 23),
(1, 24),
(2, 24),
(4, 24),
(5, 24),
(7, 24),
(8, 24),
(10, 24),
(11, 24),
(13, 24),
(14, 24),
(16, 24),
(17, 24),
(19, 24),
(20, 24),
(22, 24),
(23, 24),
(25, 24),
(26, 24),
(28, 24),
(1, 25),
(2, 25),
(4, 25),
(5, 25),
(7, 25),
(8, 25),
(10, 25),
(11, 25),
(13, 25),
(14, 25),
(16, 25),
(17, 25),
(19, 25),
(20, 25),
(22, 25),
(23, 25),
(25, 25),
(26, 25),
(28, 25),
(1, 26),
(2, 26),
(4, 26),
(5, 26),
(7, 26),
(8, 26),
(10, 26),
(11, 26),
(13, 26),
(14, 26),
(16, 26),
(17, 26),
(19, 26),
(20, 26),
(22, 26),
(23, 26),
(25, 26),
(26, 26),
(28, 26),
(1, 27),
(2, 27),
(4, 27),
(5, 27),
(7, 27),
(8, 27),
(10, 27),
(11, 27),
(13, 27),
(14, 27),
(16, 27),
(17, 27),
(19, 27),
(20, 27),
(22, 27),
(23, 27),
(25, 27),
(26, 27),
(28, 27),
(1, 28),
(2, 28),
(4, 28),
(5, 28),
(7, 28),
(8, 28),
(10, 28),
(11, 28),
(13, 28),
(14, 28),
(16, 28),
(17, 28),
(19, 28),
(20, 28),
(22, 28),
(23, 28),
(25, 28),
(26, 28),
(28, 28),
(1, 29),
(2, 29),
(4, 29),
(5, 29),
(7, 29),
(8, 29),
(10, 29),
(11, 29),
(13, 29),
(14, 29),
(16, 29),
(17, 29),
(19, 29),
(20, 29),
(22, 29),
(23, 29),
(25, 29),
(26, 29),
(28, 29),
(1, 30),
(2, 30),
(4, 30),
(5, 30),
(7, 30),
(8, 30),
(10, 30),
(11, 30),
(13, 30),
(14, 30),
(16, 30),
(17, 30),
(19, 30),
(20, 30),
(22, 30),
(23, 30),
(25, 30),
(26, 30),
(1, 31),
(2, 31),
(4, 31),
(5, 31),
(7, 31),
(8, 31),
(10, 31),
(11, 31),
(13, 31),
(14, 31),
(16, 31),
(17, 31),
(19, 31),
(20, 31),
(22, 31),
(23, 31),
(25, 31),
(26, 31),
(1, 32),
(2, 32),
(4, 32),
(5, 32),
(7, 32),
(8, 32),
(10, 32),
(11, 32),
(13, 32),
(14, 32),
(16, 32),
(17, 32),
(19, 32),
(20, 32),
(22, 32),
(23, 32),
(25, 32),
(26, 32),
(1, 33),
(2, 33),
(4, 33),
(5, 33),
(7, 33),
(8, 33),
(10, 33),
(11, 33),
(13, 33),
(14, 33),
(16, 33),
(17, 33),
(19, 33),
(20, 33),
(22, 33),
(23, 33),
(25, 33),
(26, 33),
(1, 34),
(2, 34),
(4, 34),
(5, 34),
(7, 34),
(8, 34),
(10, 34),
(11, 34),
(13, 34),
(14, 34),
(16, 34),
(17, 34),
(19, 34),
(20, 34),
(22, 34),
(23, 34),
(25, 34),
(26, 34),
(28, 34),
(1, 35),
(2, 35),
(4, 35),
(5, 35),
(7, 35),
(8, 35),
(10, 35),
(11, 35),
(13, 35),
(14, 35),
(16, 35),
(17, 35),
(19, 35),
(20, 35),
(22, 35),
(23, 35),
(25, 35),
(26, 35),
(28, 35),
(1, 36),
(2, 36),
(4, 36),
(5, 36),
(7, 36),
(8, 36),
(10, 36),
(11, 36),
(13, 36),
(14, 36),
(16, 36),
(17, 36),
(19, 36),
(20, 36),
(22, 36),
(23, 36),
(25, 36),
(26, 36),
(28, 36),
(1, 37),
(2, 37),
(4, 37),
(5, 37),
(7, 37),
(8, 37),
(10, 37),
(11, 37),
(13, 37),
(14, 37),
(16, 37),
(17, 37),
(19, 37),
(20, 37),
(22, 37),
(23, 37),
(25, 37),
(26, 37),
(28, 37),
(1, 38),
(2, 38),
(4, 38),
(5, 38),
(7, 38),
(8, 38),
(10, 38),
(11, 38),
(13, 38),
(14, 38),
(16, 38),
(17, 38),
(19, 38),
(20, 38),
(22, 38),
(23, 38),
(25, 38),
(26, 38),
(1, 39),
(2, 39),
(4, 39),
(5, 39),
(7, 39),
(8, 39),
(10, 39),
(11, 39),
(13, 39),
(14, 39),
(16, 39),
(17, 39),
(19, 39),
(20, 39),
(22, 39),
(23, 39),
(25, 39),
(26, 39),
(1, 40),
(2, 40),
(4, 40),
(5, 40),
(7, 40),
(8, 40),
(10, 40),
(11, 40),
(13, 40),
(14, 40),
(16, 40),
(17, 40),
(19, 40),
(20, 40),
(22, 40),
(23, 40),
(25, 40),
(26, 40),
(1, 41),
(2, 41),
(4, 41),
(5, 41),
(7, 41),
(8, 41),
(10, 41),
(11, 41),
(13, 41),
(14, 41),
(16, 41),
(17, 41),
(19, 41),
(20, 41),
(22, 41),
(23, 41),
(25, 41),
(26, 41),
(1, 42),
(4, 42),
(7, 42),
(10, 42),
(13, 42),
(16, 42),
(19, 42),
(22, 42),
(25, 42),
(1, 43),
(4, 43),
(7, 43),
(10, 43),
(13, 43),
(16, 43),
(19, 43),
(22, 43),
(25, 43),
(1, 44),
(4, 44),
(7, 44),
(10, 44),
(13, 44),
(16, 44),
(19, 44),
(22, 44),
(25, 44),
(1, 45),
(3, 45),
(4, 45),
(6, 45),
(7, 45),
(9, 45),
(10, 45),
(12, 45),
(13, 45),
(15, 45),
(16, 45),
(18, 45),
(19, 45),
(21, 45),
(22, 45),
(24, 45),
(25, 45),
(27, 45),
(29, 45),
(1, 46),
(4, 46),
(7, 46),
(10, 46),
(13, 46),
(16, 46),
(19, 46),
(22, 46),
(25, 46);

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `sale_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` bigint UNSIGNED DEFAULT NULL,
  `client_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom client de passage (si non enregistré)',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `discount_type` enum('none','percentage','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `discount_value` decimal(12,2) DEFAULT NULL,
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `returned_amount` decimal(12,2) DEFAULT '0.00',
  `payment_status` enum('paid','partial','unpaid','debt') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `amount_due` decimal(12,2) DEFAULT '0.00',
  `payment_method` enum('cash','mobile_money','bank_transfer','card','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence transaction mobile money',
  `status` enum('completed','pending','canceled','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `cancel_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `table_id` bigint UNSIGNED DEFAULT NULL,
  `table_session_id` bigint DEFAULT NULL,
  `seller_id` bigint UNSIGNED DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `sale_number`, `client_id`, `client_name`, `subtotal`, `discount_amount`, `discount_type`, `discount_value`, `tax_amount`, `total_amount`, `returned_amount`, `payment_status`, `amount_paid`, `amount_due`, `payment_method`, `payment_reference`, `status`, `cancel_reason`, `table_id`, `table_session_id`, `seller_id`, `notes`, `sale_date`, `created_at`, `updated_at`) VALUES
(1, 2, 'VTE-202605-00001', NULL, NULL, 17000.00, 500.00, 'fixed', 500.00, 0.00, 16500.00, 0.00, 'debt', 0.00, 16500.00, 'cash', NULL, 'canceled', 'Annulation manuelle', NULL, NULL, 2, NULL, '2026-05-20 13:16:33', '2026-05-20 11:16:33', '2026-05-20 11:17:07'),
(2, 2, 'VTE-202605-00002', NULL, NULL, 25500.00, 1000.00, 'fixed', 1000.00, 0.00, 24500.00, 0.00, 'paid', 24500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 13:20:37', '2026-05-20 11:20:37', '2026-05-20 11:20:37'),
(3, 2, 'VTE-202605-00003', NULL, NULL, 30000.00, 3000.00, 'percentage', 10.00, 0.00, 27000.00, 0.00, 'paid', 27000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 13:22:21', '2026-05-20 11:22:21', '2026-05-20 13:28:08'),
(4, 2, 'VTE-202605-00004', NULL, NULL, 25500.00, 500.00, 'fixed', 500.00, 0.00, 25000.00, 0.00, 'debt', 20000.00, 5000.00, 'cash', NULL, 'canceled', 'Annulation manuelle', NULL, NULL, 2, NULL, '2026-05-20 15:47:39', '2026-05-20 13:47:39', '2026-05-20 13:48:43'),
(5, 2, 'VTE-202605-00005', NULL, NULL, 25500.00, 500.00, 'fixed', 500.00, 0.00, 25000.00, 0.00, 'paid', 25000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 17:15:58', '2026-05-20 15:15:58', '2026-05-20 15:15:58'),
(6, 2, 'VTE-202605-00006', 1, 'Gabriel toure', 20000.00, 0.00, 'none', NULL, 0.00, 20000.00, 0.00, 'paid', 20000.00, 0.00, 'mobile_money', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 23:02:19', '2026-05-20 21:02:19', '2026-05-20 21:02:19'),
(7, 2, 'VTE-202605-00007', 1, NULL, 20000.00, 0.00, 'none', NULL, 0.00, 20000.00, 0.00, 'debt', 0.00, 20000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-21 12:57:01', '2026-05-21 10:57:01', '2026-07-22 15:55:52'),
(8, 2, 'VTE-202605-00008', 2, NULL, 34000.00, 0.00, 'none', NULL, 0.00, 34000.00, 0.00, 'debt', 0.00, 34000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-21 12:59:17', '2026-05-21 10:59:17', '2026-07-22 15:55:52'),
(9, 2, 'VTE-202605-00009', 2, NULL, 34000.00, 0.00, 'none', NULL, 0.00, 34000.00, 0.00, 'debt', 0.00, 34000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-21 13:01:45', '2026-05-21 11:01:45', '2026-07-22 15:55:52'),
(10, 2, 'VTE-202605-00010', 1, NULL, 45000.00, 0.00, 'none', NULL, 0.00, 45000.00, 0.00, 'debt', 0.00, 45000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-21 13:43:55', '2026-05-21 11:43:55', '2026-07-22 15:55:52'),
(11, 2, 'VTE-202605-00011', 3, NULL, 8500.00, 500.00, 'fixed', 500.00, 0.00, 8000.00, 0.00, 'debt', 4000.00, 4000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-21 13:51:29', '2026-05-21 11:51:29', '2026-07-22 15:55:52'),
(12, 4, 'VTE-202606-00001', NULL, NULL, 300000.00, 10000.00, 'fixed', 10000.00, 0.00, 290000.00, 0.00, 'paid', 290000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-22 22:21:52', '2026-06-22 20:21:52', '2026-06-22 20:21:52'),
(13, 4, 'VTE-202606-00002', NULL, 'isac', 200000.00, 0.00, 'none', NULL, 0.00, 200000.00, 0.00, 'paid', 200000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-22 23:15:22', '2026-06-22 21:15:22', '2026-06-22 21:15:22'),
(14, 4, 'VTE-202606-00003', 4, NULL, 200000.00, 0.00, 'none', NULL, 0.00, 200000.00, 0.00, 'debt', 50000.00, 150000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-22 23:31:44', '2026-06-22 21:31:44', '2026-07-22 15:55:52'),
(15, 4, 'VTE-202606-00004', 4, NULL, 500000.00, 20000.00, 'fixed', 20000.00, 0.00, 480000.00, 0.00, 'debt', 250000.00, 230000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-22 23:38:28', '2026-06-22 21:38:28', '2026-07-22 15:55:52'),
(16, 5, 'RES-202606-00001', NULL, NULL, 6000.00, 0.00, 'none', NULL, 0.00, 6000.00, 0.00, 'paid', 6000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-23 17:34:56', '2026-06-23 15:34:56', '2026-06-23 15:36:16'),
(17, 5, 'VTE-202606-00001', 5, NULL, 10000.00, 0.00, 'none', NULL, 0.00, 10000.00, 0.00, 'debt', 3000.00, 7000.00, 'cash', 'completed', 'completed', NULL, NULL, NULL, 5, NULL, '2026-06-23 18:53:10', '2026-06-23 16:53:10', '2026-07-22 15:55:52'),
(18, 4, 'VTE-202607-00001', NULL, NULL, 75000.00, 0.00, 'none', NULL, 0.00, 75000.00, 45000.00, 'paid', 75000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-07-21 16:44:49', '2026-07-21 16:44:49', '2026-07-22 16:32:20'),
(19, 4, 'VTE-202607-00002', NULL, NULL, 400000.00, 0.00, 'none', NULL, 0.00, 400000.00, 200000.00, 'paid', 400000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-07-22 16:38:31', '2026-07-22 16:38:31', '2026-07-22 16:38:50'),
(20, 4, 'VTE-202607-00003', NULL, NULL, 7500.00, 0.00, 'none', NULL, 0.00, 7500.00, 0.00, 'paid', 7500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 10, NULL, '2026-07-23 10:38:01', '2026-07-23 10:38:01', '2026-07-23 10:38:01'),
(21, 4, 'VTE-202607-00004', NULL, NULL, 200000.00, 0.00, 'none', NULL, 0.00, 200000.00, 0.00, 'paid', 200000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 10, NULL, '2026-07-23 10:58:15', '2026-07-23 10:58:15', '2026-07-23 10:58:15'),
(22, 4, 'VTE-202608-00001', NULL, NULL, 30000.00, 0.00, 'none', NULL, 0.00, 30000.00, 0.00, 'paid', 30000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 16:44:08', '2026-08-03 14:44:08', '2026-08-03 14:44:08'),
(23, 4, 'VTE-202608-00002', NULL, NULL, 22500.00, 0.00, 'none', NULL, 0.00, 22500.00, 0.00, 'paid', 22500.00, 0.00, 'mobile_money', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 16:46:12', '2026-08-03 14:46:12', '2026-08-03 14:46:12'),
(24, 4, 'VTE-202608-00003', NULL, NULL, 22500.00, 0.00, 'none', NULL, 0.00, 22500.00, 0.00, 'paid', 22500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 16:52:06', '2026-08-03 14:52:06', '2026-08-03 14:52:06'),
(25, 4, 'VTE-202608-00004', NULL, NULL, 37500.00, 0.00, 'none', NULL, 0.00, 37500.00, 0.00, 'paid', 40000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 18:19:40', '2026-08-03 16:19:40', '2026-08-03 16:19:40'),
(26, 4, 'VTE-202608-00005', NULL, NULL, 15000.00, 0.00, 'none', NULL, 0.00, 15000.00, 0.00, 'paid', 15000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 18:29:27', '2026-08-03 16:29:27', '2026-08-03 16:29:27'),
(27, 4, 'VTE-202608-00006', NULL, NULL, 15000.00, 0.00, 'none', NULL, 0.00, 15000.00, 0.00, 'paid', 17000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-03 18:32:05', '2026-08-03 16:32:05', '2026-08-03 16:32:05'),
(28, 4, 'VTE-202608-00007', NULL, NULL, 22500.00, 0.00, 'none', NULL, 0.00, 22500.00, 0.00, 'paid', 25000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 19, NULL, '2026-08-04 16:20:08', '2026-08-04 14:20:08', '2026-08-04 14:20:08'),
(29, 4, 'VTE-202608-00008', NULL, NULL, 422500.00, 2500.00, 'fixed', 2500.00, 0.00, 420000.00, 0.00, 'paid', 420000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 18, NULL, '2026-08-07 14:36:55', '2026-08-07 12:36:55', '2026-08-07 12:36:55'),
(30, 4, 'VTE-202608-00009', NULL, NULL, 15000.00, 0.00, 'none', NULL, 0.00, 15000.00, 0.00, 'paid', 20000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 18, NULL, '2026-08-07 14:43:16', '2026-08-07 12:43:16', '2026-08-07 12:43:16'),
(31, 4, 'VTE-202608-00010', NULL, NULL, 400000.00, 0.00, 'none', NULL, 0.00, 400000.00, 0.00, 'paid', 400000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 18, NULL, '2026-08-07 14:43:56', '2026-08-07 12:43:56', '2026-08-07 12:43:56'),
(32, 4, 'VTE-202608-00011', 4, NULL, 400000.00, 0.00, 'none', NULL, 0.00, 400000.00, 0.00, 'debt', 0.00, 400000.00, 'cash', 'completed', NULL, NULL, NULL, NULL, 5, NULL, '2026-08-07 15:16:09', '2026-08-07 13:16:09', '2026-08-07 13:16:09'),
(33, 4, 'VTE-202608-00012', NULL, NULL, 35800.00, 0.00, 'none', NULL, 0.00, 35800.00, 1200.00, 'paid', 36000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-08 05:05:55', '2026-08-08 03:05:55', '2026-08-08 03:07:03'),
(34, 1, 'VTE-202608-00001', NULL, NULL, 2500.00, 0.00, 'none', NULL, 0.00, 2500.00, 0.00, 'paid', 2500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 1, NULL, '2026-08-13 00:42:08', '2026-08-12 22:42:08', '2026-08-12 22:42:08'),
(35, 1, 'VTE-202608-00002', NULL, NULL, 2500.00, 0.00, 'none', NULL, 0.00, 2500.00, 0.00, 'paid', 2500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 1, NULL, '2026-08-13 00:42:26', '2026-08-12 22:42:26', '2026-08-12 22:42:26'),
(36, 1, 'VTE-202608-00003', NULL, NULL, 2500.00, 0.00, 'none', NULL, 0.00, 2500.00, 0.00, 'paid', 2500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 1, NULL, '2026-08-13 00:42:45', '2026-08-12 22:42:45', '2026-08-12 22:42:45'),
(37, 1, 'VTE-202608-00004', NULL, NULL, 2500.00, 0.00, 'none', NULL, 0.00, 2500.00, 0.00, 'paid', 2500.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 1, NULL, '2026-08-13 00:43:44', '2026-08-12 22:43:44', '2026-08-12 22:43:44'),
(38, 4, 'VTE-202608-00013', NULL, NULL, 82000.00, 0.00, 'none', NULL, 0.00, 82000.00, 0.00, 'paid', 85000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 5, NULL, '2026-08-14 14:17:44', '2026-08-14 12:17:44', '2026-08-14 12:17:44');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint UNSIGNED NOT NULL,
  `sale_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `price_type` enum('retail','wholesale','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'retail',
  `unit_price` decimal(12,2) NOT NULL COMMENT 'Prix unitaire effectif appliqué',
  `retail_price_ref` decimal(12,2) DEFAULT NULL COMMENT 'Prix détail de référence au moment vente',
  `wholesale_price_ref` decimal(12,2) DEFAULT NULL COMMENT 'Prix gros de référence au moment vente',
  `total_price` decimal(12,2) NOT NULL COMMENT 'quantity * unit_price',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `cost_price` decimal(12,2) DEFAULT NULL COMMENT 'Coût de revient au moment de la vente',
  `item_status` enum('pending','preparing','ready','served','canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Notes de cuisine (cuisson, etc.)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `variant_id`, `quantity`, `price_type`, `unit_price`, `retail_price_ref`, `wholesale_price_ref`, `total_price`, `discount_amount`, `cost_price`, `item_status`, `notes`, `created_at`) VALUES
(1, 1, 2, NULL, 2.000, 'retail', 8500.00, 8500.00, 8000.00, 17000.00, 0.00, 7500.00, 'canceled', NULL, '2026-05-20 11:16:33'),
(2, 2, 2, NULL, 3.000, 'retail', 8500.00, 8500.00, 8000.00, 25500.00, 0.00, 7500.00, NULL, NULL, '2026-05-20 11:20:37'),
(5, 3, 2, NULL, 3.000, 'custom', 10000.00, 8500.00, 8000.00, 30000.00, 0.00, 7500.00, NULL, NULL, '2026-05-20 13:28:08'),
(6, 4, 2, NULL, 3.000, 'retail', 8500.00, 8500.00, 8000.00, 25500.00, 0.00, 7500.00, 'canceled', NULL, '2026-05-20 13:47:39'),
(7, 5, 2, NULL, 3.000, 'retail', 8500.00, 8500.00, 8000.00, 25500.00, 0.00, 7500.00, NULL, NULL, '2026-05-20 15:15:58'),
(8, 6, 2, NULL, 2.000, 'retail', 10000.00, 8500.00, 8000.00, 20000.00, 0.00, 7500.00, NULL, NULL, '2026-05-20 21:02:19'),
(9, 7, 2, NULL, 2.000, 'retail', 10000.00, 8500.00, 8000.00, 20000.00, 0.00, 7500.00, NULL, NULL, '2026-05-21 10:57:01'),
(10, 8, 2, NULL, 4.000, 'retail', 8500.00, 8500.00, 8000.00, 34000.00, 0.00, 7500.00, NULL, NULL, '2026-05-21 10:59:17'),
(11, 9, 2, NULL, 4.000, 'retail', 8500.00, 8500.00, 8000.00, 34000.00, 0.00, 7500.00, NULL, NULL, '2026-05-21 11:01:45'),
(12, 10, 2, NULL, 3.000, 'retail', 15000.00, 8500.00, 8000.00, 45000.00, 0.00, 7500.00, NULL, NULL, '2026-05-21 11:43:55'),
(13, 11, 2, NULL, 1.000, 'retail', 8500.00, 8500.00, 8000.00, 8500.00, 0.00, 7500.00, NULL, NULL, '2026-05-21 11:51:29'),
(14, 12, 4, NULL, 1.000, 'retail', 300000.00, 200000.00, 195000.00, 300000.00, 0.00, 170000.00, NULL, NULL, '2026-06-22 20:21:52'),
(15, 13, 4, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 170000.00, NULL, NULL, '2026-06-22 21:15:22'),
(16, 14, 3, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 140000.00, NULL, NULL, '2026-06-22 21:31:44'),
(17, 15, 4, NULL, 1.000, 'retail', 500000.00, 200000.00, 195000.00, 500000.00, 0.00, 170000.00, NULL, NULL, '2026-06-22 21:38:28'),
(19, 16, 5, NULL, 3.000, 'retail', 2000.00, 2000.00, 0.00, 6000.00, 0.00, 0.00, NULL, NULL, '2026-06-23 15:36:16'),
(20, 17, 5, NULL, 5.000, 'retail', 2000.00, 2000.00, 0.00, 10000.00, 0.00, 0.00, NULL, NULL, '2026-06-23 16:53:11'),
(21, 18, 7, NULL, 10.000, 'retail', 7500.00, 7500.00, 7000.00, 75000.00, 0.00, 5000.00, NULL, NULL, '2026-07-21 16:44:49'),
(22, 19, 3, NULL, 2.000, 'retail', 200000.00, 200000.00, 195000.00, 400000.00, 0.00, 200000.00, NULL, NULL, '2026-07-22 16:38:31'),
(23, 20, 7, NULL, 1.000, 'retail', 7500.00, 7500.00, 7000.00, 7500.00, 0.00, 5000.00, NULL, NULL, '2026-07-23 10:38:01'),
(24, 21, 3, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 200000.00, NULL, NULL, '2026-07-23 10:58:15'),
(25, 22, 7, NULL, 4.000, 'retail', 7500.00, 7500.00, 7000.00, 30000.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 14:44:08'),
(26, 23, 7, NULL, 3.000, 'retail', 7500.00, 7500.00, 7000.00, 22500.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 14:46:12'),
(27, 24, 7, NULL, 3.000, 'retail', 7500.00, 7500.00, 7000.00, 22500.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 14:52:06'),
(28, 25, 7, NULL, 5.000, 'retail', 7500.00, 7500.00, 7000.00, 37500.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 16:19:40'),
(29, 26, 7, NULL, 2.000, 'retail', 7500.00, 7500.00, 7000.00, 15000.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 16:29:27'),
(30, 27, 7, NULL, 2.000, 'retail', 7500.00, 7500.00, 7000.00, 15000.00, 0.00, 5000.00, NULL, NULL, '2026-08-03 16:32:05'),
(31, 28, 7, NULL, 3.000, 'retail', 7500.00, 7500.00, 7000.00, 22500.00, 0.00, 5000.00, NULL, NULL, '2026-08-04 14:20:09'),
(32, 29, 4, NULL, 2.000, 'retail', 200000.00, 200000.00, 195000.00, 400000.00, 0.00, 170000.00, NULL, NULL, '2026-08-07 12:36:55'),
(33, 29, 7, NULL, 3.000, 'retail', 7500.00, 7500.00, 7000.00, 22500.00, 0.00, 5000.00, NULL, NULL, '2026-08-07 12:36:55'),
(34, 30, 7, NULL, 2.000, 'retail', 7500.00, 7500.00, 7000.00, 15000.00, 0.00, 5000.00, NULL, NULL, '2026-08-07 12:43:16'),
(35, 31, 3, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 200000.00, NULL, NULL, '2026-08-07 12:43:56'),
(36, 31, 4, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 170000.00, NULL, NULL, '2026-08-07 12:43:56'),
(37, 32, 4, NULL, 2.000, 'retail', 200000.00, 200000.00, 195000.00, 400000.00, 0.00, 170000.00, NULL, NULL, '2026-08-07 13:16:09'),
(38, 33, 48, NULL, 4.000, 'retail', 1200.00, 1200.00, 1000.00, 4800.00, 0.00, 600.00, NULL, NULL, '2026-08-08 03:05:55'),
(39, 33, 29, NULL, 1.000, 'retail', 27000.00, 27000.00, 25000.00, 27000.00, 0.00, 18000.00, NULL, NULL, '2026-08-08 03:05:55'),
(40, 33, 51, NULL, 1.000, 'retail', 4000.00, 4000.00, 3500.00, 4000.00, 0.00, 2500.00, NULL, NULL, '2026-08-08 03:05:55'),
(41, 34, 53, NULL, 1.000, 'custom', 2500.00, 1000.00, 0.00, 2500.00, 0.00, 500.00, NULL, NULL, '2026-08-12 22:42:08'),
(42, 35, 53, NULL, 1.000, 'custom', 2500.00, 1000.00, 0.00, 2500.00, 0.00, 500.00, NULL, NULL, '2026-08-12 22:42:27'),
(43, 36, 53, NULL, 1.000, 'custom', 2500.00, 1000.00, 0.00, 2500.00, 0.00, 500.00, NULL, NULL, '2026-08-12 22:42:45'),
(44, 37, 53, NULL, 1.000, 'custom', 2500.00, 1000.00, 0.00, 2500.00, 0.00, 500.00, NULL, NULL, '2026-08-12 22:43:44'),
(45, 38, 118, NULL, 1.000, 'retail', 15000.00, 15000.00, 13800.00, 15000.00, 0.00, 10000.00, NULL, NULL, '2026-08-14 12:17:44'),
(46, 38, 119, NULL, 1.000, 'retail', 45000.00, 45000.00, 41400.00, 45000.00, 0.00, 32000.00, NULL, NULL, '2026-08-14 12:17:46'),
(47, 38, 120, NULL, 1.000, 'retail', 22000.00, 22000.00, 20240.00, 22000.00, 0.00, 15000.00, NULL, NULL, '2026-08-14 12:17:46');

-- --------------------------------------------------------

--
-- Table structure for table `sale_payments`
--

CREATE TABLE `sale_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `sale_id` bigint UNSIGNED NOT NULL,
  `cash_session_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Peut être NULL si vente libre',
  `payment_method` enum('cash','mobile_money','bank_transfer','card','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_payments`
--

INSERT INTO `sale_payments` (`id`, `sale_id`, `cash_session_id`, `payment_method`, `amount`, `reference`, `created_at`) VALUES
(1, 1, NULL, 'cash', 0.00, NULL, '2026-05-20 11:16:33'),
(2, 2, NULL, 'cash', 24500.00, NULL, '2026-05-20 11:20:37'),
(3, 3, NULL, 'cash', 27000.00, NULL, '2026-05-20 11:22:21'),
(4, 4, NULL, 'cash', 20000.00, NULL, '2026-05-20 13:47:39'),
(5, 5, NULL, 'cash', 25000.00, NULL, '2026-05-20 15:15:58'),
(6, 6, NULL, 'mobile_money', 20000.00, NULL, '2026-05-20 21:02:19'),
(7, 7, NULL, 'cash', 0.00, NULL, '2026-05-21 10:57:01'),
(8, 8, NULL, 'cash', 0.00, NULL, '2026-05-21 10:59:17'),
(9, 9, NULL, 'cash', 0.00, NULL, '2026-05-21 11:01:45'),
(10, 10, NULL, 'cash', 0.00, NULL, '2026-05-21 11:43:55'),
(11, 11, NULL, 'cash', 4000.00, NULL, '2026-05-21 11:51:29'),
(12, 12, NULL, 'cash', 290000.00, NULL, '2026-06-22 20:21:52'),
(13, 13, NULL, 'cash', 200000.00, NULL, '2026-06-22 21:15:22'),
(14, 14, NULL, 'cash', 50000.00, NULL, '2026-06-22 21:31:44'),
(15, 15, NULL, 'cash', 250000.00, NULL, '2026-06-22 21:38:28'),
(16, 16, NULL, 'cash', 6000.00, NULL, '2026-06-23 15:34:56'),
(17, 17, NULL, 'cash', 3000.00, NULL, '2026-06-23 16:53:10'),
(18, 18, NULL, 'cash', 75000.00, NULL, '2026-07-21 16:44:49'),
(19, 19, NULL, 'cash', 400000.00, NULL, '2026-07-22 16:38:31'),
(20, 20, NULL, 'cash', 7500.00, NULL, '2026-07-23 10:38:01'),
(21, 21, NULL, 'cash', 200000.00, NULL, '2026-07-23 10:58:15'),
(32, 22, 1, 'cash', 30000.00, NULL, '2026-08-03 14:44:08'),
(33, 23, 1, 'mobile_money', 2500.00, NULL, '2026-08-03 14:46:12'),
(34, 23, 1, 'cash', 20000.00, NULL, '2026-08-03 14:46:12'),
(35, 24, 2, 'cash', 22500.00, NULL, '2026-08-03 14:52:06'),
(36, 25, 3, 'cash', 37500.00, NULL, '2026-08-03 16:19:40'),
(37, 26, 3, 'cash', 15000.00, NULL, '2026-08-03 16:29:27'),
(38, 27, 3, 'cash', 15000.00, NULL, '2026-08-03 16:32:05'),
(39, 28, 6, 'cash', 22500.00, NULL, '2026-08-04 14:20:08'),
(40, 29, 7, 'cash', 400000.00, NULL, '2026-08-07 12:36:55'),
(41, 29, 7, 'mobile_money', 20000.00, NULL, '2026-08-07 12:36:55'),
(42, 30, 7, 'cash', 15000.00, NULL, '2026-08-07 12:43:16'),
(43, 31, 7, 'cash', 400000.00, NULL, '2026-08-07 12:43:56'),
(44, 33, 8, 'cash', 35800.00, NULL, '2026-08-08 03:05:55'),
(45, 38, NULL, 'cash', 82000.00, NULL, '2026-08-14 12:17:44');

-- --------------------------------------------------------

--
-- Table structure for table `sale_returns`
--

CREATE TABLE `sale_returns` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `sale_id` bigint UNSIGNED NOT NULL,
  `return_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount_returned` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_returns`
--

INSERT INTO `sale_returns` (`id`, `company_id`, `sale_id`, `return_number`, `total_amount_returned`, `created_by`, `notes`, `created_at`, `updated_at`) VALUES
(1, 4, 18, 'RET-202607-00001', 37500.00, 5, NULL, '2026-07-21 16:53:31', '2026-07-21 16:53:31'),
(2, 4, 18, 'RET-202607-00002', 7500.00, 5, NULL, '2026-07-22 16:32:20', '2026-07-22 16:32:20'),
(3, 4, 19, 'RET-202607-00003', 200000.00, 5, NULL, '2026-07-22 16:38:50', '2026-07-22 16:38:50'),
(4, 4, 33, 'RET-202608-00001', 1200.00, 5, NULL, '2026-08-08 03:07:03', '2026-08-08 03:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `sale_return_items`
--

CREATE TABLE `sale_return_items` (
  `id` bigint UNSIGNED NOT NULL,
  `sale_return_id` bigint UNSIGNED NOT NULL,
  `sale_item_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `return_type` enum('reintegrable','defective') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reintegrable',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_return_items`
--

INSERT INTO `sale_return_items` (`id`, `sale_return_id`, `sale_item_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `total_price`, `return_type`, `reason`, `created_at`) VALUES
(1, 1, 21, 7, NULL, 5.000, 7500.00, 37500.00, 'reintegrable', NULL, '2026-07-21 16:53:31'),
(2, 2, 21, 7, NULL, 1.000, 7500.00, 7500.00, 'reintegrable', NULL, '2026-07-22 16:32:20'),
(3, 3, 22, 3, NULL, 1.000, 200000.00, 200000.00, 'reintegrable', NULL, '2026-07-22 16:38:50'),
(4, 4, 38, 48, NULL, 1.000, 1200.00, 1200.00, 'reintegrable', 'not_satisfied', '2026-08-08 03:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `staff_services`
--

CREATE TABLE `staff_services` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `service_id` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_invoices`
--

CREATE TABLE `subscription_invoices` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `plan_id` tinyint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'XOF',
  `status` enum('pending','paid','failed','canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_invoices`
--

INSERT INTO `subscription_invoices` (`id`, `company_id`, `plan_id`, `amount`, `currency`, `status`, `payment_method`, `paid_at`, `period_start`, `period_end`, `created_at`) VALUES
(1, 4, 4, 5000.00, 'XOF', 'paid', 'mobile_money', '2026-06-22 21:43:03', '2026-06-22', '2026-07-22', '2026-06-22 17:35:23');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payment_proofs`
--

CREATE TABLE `subscription_payment_proofs` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `subscription_invoice_id` bigint UNSIGNED DEFAULT NULL,
  `plan_id` tinyint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('mobile_money','bank_transfer','cash','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL du reçu téléversé',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` bigint UNSIGNED DEFAULT NULL COMMENT 'super_admin qui a validé',
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_payment_proofs`
--

INSERT INTO `subscription_payment_proofs` (`id`, `company_id`, `subscription_invoice_id`, `plan_id`, `amount`, `payment_method`, `payment_reference`, `proof_file_url`, `status`, `submitted_at`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `notes`, `created_at`) VALUES
(1, 4, 1, 4, 5000.00, 'mobile_money', NULL, 'http://localhost:5000/uploads/payments/payment-1782149723009-261903010.jpeg', 'approved', '2026-06-22 19:35:23', 4, '2026-06-22 21:43:03', NULL, NULL, '2026-06-22 17:35:23');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` tinyint UNSIGNED NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_yearly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_employees` int UNSIGNED DEFAULT NULL COMMENT 'NULL = illimité',
  `max_products` int UNSIGNED DEFAULT NULL,
  `max_clients` int UNSIGNED DEFAULT NULL,
  `features` json DEFAULT NULL COMMENT 'Liste des fonctionnalités activées',
  `is_active` tinyint(1) DEFAULT '1',
  `is_admin_only` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `code`, `name`, `price_monthly`, `price_yearly`, `max_employees`, `max_products`, `max_clients`, `features`, `is_active`, `is_admin_only`, `created_at`, `updated_at`) VALUES
(1, 'FREE', 'Gratuit', 0.00, 0.00, 0, 50, 100, '{\"reports\": false, \"employees\": false, \"suppliers\": false, \"api_access\": false, \"promotions\": false, \"warehouses\": false, \"advanced_stock\": false, \"module_returns\": false, \"product_returns\": false, \"advanced_reports\": false, \"module_employees\": false, \"module_warehouses\": false}', 1, 0, '2026-05-07 13:10:46', '2026-07-31 13:02:45'),
(2, 'STANDARD', 'Standard', 10000.00, 100000.00, 2, 500, 1000, '{\"reports\": true, \"suppliers\": true, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false, \"module_returns\": true, \"advanced_reports\": true, \"module_employees\": true, \"module_warehouses\": true}', 1, 0, '2026-05-07 13:10:46', '2026-07-31 13:02:45'),
(3, 'PREMIUM', 'Premium', 25000.00, 250000.00, NULL, NULL, NULL, '{\"reports\": true, \"suppliers\": true, \"api_access\": true, \"promotions\": true, \"advanced_stock\": true, \"module_returns\": true, \"advanced_reports\": true, \"module_employees\": true, \"module_warehouses\": true}', 1, 0, '2026-05-07 13:10:46', '2026-07-31 13:02:45'),
(4, 'ORG', 'test', 5000.00, 60000.00, 3, 5, 5, '{\"reports\": false, \"suppliers\": false, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false, \"module_returns\": true, \"advanced_reports\": true, \"module_employees\": true, \"module_warehouses\": true}', 1, 0, '2026-06-21 23:18:11', '2026-07-31 13:02:45'),
(5, 'UNLIMITED', 'Illimité Admin', 0.00, 0.00, NULL, NULL, NULL, '{\"reports\": true, \"suppliers\": true, \"api_access\": true, \"promotions\": true, \"advanced_stock\": true, \"module_returns\": true, \"advanced_reports\": true, \"module_employees\": true, \"module_warehouses\": true}', 1, 1, '2026-07-22 10:31:31', '2026-07-31 13:02:45');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_purchases` decimal(14,2) DEFAULT '0.00',
  `current_balance` decimal(14,2) DEFAULT '0.00' COMMENT 'Solde dû au fournisseur',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `company_id`, `company_name`, `contact_name`, `phone`, `email`, `address`, `city`, `country`, `notes`, `total_purchases`, `current_balance`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 4, 'issa diarra', 'Gabrielle toure', '00332200', 'sidibesounk2003@gmail.com', 'Bamako', 'Bamako', 'Mali', 'fournisseur creer avec un solde initial de 1millions', 61700000.00, 39000000.00, 1, '2026-06-22 11:12:04', '2026-07-21 15:01:19', NULL),
(2, 1, 'Test Supplier', NULL, '99999999', NULL, NULL, NULL, NULL, NULL, 0.00, 0.00, 1, '2026-08-12 22:42:07', '2026-08-12 22:42:07', NULL),
(3, 4, 'Distributeur Électro Mali', 'Bakary Diakité', '+223 66 77 88 99', 'contact@electromali.com', 'Zone Industrielle', 'Abidjan', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 15:12:35', NULL),
(4, 4, 'SOMATEL Import-Export', 'Aminata Sow', '+223 76 12 34 56', 'asow@somatel.ml', 'Route de Sotuba', 'Bamako', 'Mali', NULL, 0.00, 250000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(5, 4, 'Tech Distribution SARL', 'Ibrahim Konaté', '+223 65 22 33 44', 'iko@techdistrib.ml', 'Hamdallaye ACI 2000', 'Abidjan', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 15:12:35', NULL),
(6, 4, 'Africa Phone Wholesale', 'Salif Traoré', '+223 78 45 67 89', 'salif@africaphone.com', 'Zone Industrielle', 'Bamako', 'Mali', NULL, 0.00, 500000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(7, 4, 'Golden Electronics', 'Mariam Diallo', '+223 90 11 22 33', 'mdiallo@goldenelec.ml', 'Quartier du Fleuve', 'Abidjan', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 15:12:35', NULL),
(8, 4, 'Sahel Informatique', 'Moussa Keïta', '+223 63 55 44 33', 'mkeita@sahelinfo.ml', 'Avenue Cheick Zayed', NULL, 'Mali', NULL, 0.00, 0.00, 0, '2026-08-14 10:58:57', '2026-08-14 13:55:24', NULL),
(9, 4, 'West Africa Trading Co.', 'Kouassi Yao', '+225 07 08 09 10', 'kyao@watrading.ci', 'Zone 4C', NULL, 'Côte d\'Ivoire', NULL, 0.00, 0.00, 0, '2026-08-14 10:58:57', '2026-08-14 13:55:24', NULL),
(10, 4, 'Dragon Import Chine-Mali', 'Chen Wei', '+223 79 88 77 66', 'chenwei@dragonimport.com', 'Route de Ségou', 'Bamako', 'Mali', NULL, 0.00, 1200000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(11, 4, 'Bamako Cosmétiques Gros', 'Kadiatou Cissé', '+223 91 23 45 67', 'kcisse@bkocosmetiques.ml', 'Marché de Médine', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(12, 4, 'Sikasso Alimentation Gros', 'Adama Coulibaly', '+223 76 99 88 77', 'acoulibaly@sikassoalim.ml', 'Marché Central', 'Sikasso', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(13, 4, 'Ségou Textile & Wax', 'Oumou Sangaré', '+223 65 44 55 66', 'osangare@segoutextile.ml', 'Quartier Sokala', 'Ségou', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(14, 4, 'Quincaillerie Générale du Mali', 'Yacouba Traoré', '+223 66 30 40 50', 'ytraore@quincgen.ml', 'Zone Industrielle', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(15, 4, 'Papeterie Sahélienne', 'Fanta Konaté', '+223 78 90 12 34', 'fkonate@papsahel.ml', 'Avenue Kassé Keïta', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(16, 4, 'Global Mobile Parts', 'Li Ming', '+86 138 0013 8000', 'liming@globalmobileparts.com', 'Huaqiangbei', 'Shenzhen', 'Chine', NULL, 0.00, 3500000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(17, 4, 'Kayes Distribution', 'Boubacar Sissoko', '+223 63 77 88 99', 'bsissoko@kayesdist.ml', 'Quartier Plateau', 'Kayes', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(18, 4, 'Mopti Import', 'Aissata Maïga', '+223 79 11 33 55', 'amaiga@moptiimport.ml', 'Rue des Pêcheurs', 'Mopti', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(19, 4, 'Orange Mali - Partenaire B2B', 'Service Entreprises', '+223 44 90 00 00', 'b2b@orangemali.com', 'Immeuble Orange, ACI 2000', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(20, 4, 'Wave Mali - Support Marchands', 'Service Marchands', '+223 44 91 00 00', 'marchands@wave.com', 'Hippodrome', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(21, 4, 'Koutiala Négoce', 'Sekou Diarra', '+223 65 66 77 88', 'sdiarra@koutialanegoce.ml', 'Marché de Koutiala', 'Koutiala', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(22, 4, 'Prestige Meubles & Électroménager', 'Rokia Touré', '+223 76 22 44 66', 'rtoure@prestigemeubles.ml', 'Route de Koulikoro', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(23, 4, 'Bougouni Fournitures', 'Modibo Camara', '+223 90 55 66 77', 'mcamara@bougounifourn.ml', 'Centre Ville', 'Bougouni', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(24, 4, 'San Distribution Générale', 'Djeneba Sanogo', '+223 63 88 99 00', 'dsanogo@sandist.ml', 'Quartier Administratif', 'San', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(25, 4, 'Import Dakar-Bamako Express', 'Cheikh Ndiaye', '+221 77 123 45 67', 'cndiaye@dakarbamako.sn', 'Zone Portuaire', 'Dakar', 'Sénégal', NULL, 0.00, 800000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(26, 4, 'Gao Négoce Sahel', 'Alkassoum Touré', '+223 79 44 33 22', 'atoure@gaonegoce.ml', 'Marché Central', 'Gao', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(27, 4, 'Sino-Mali Electronics', 'Wang Fang', '+86 152 0021 3344', 'wangfang@sinomali.com', 'Futian District', 'Shenzhen', 'Chine', NULL, 0.00, 2100000.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(28, 4, 'Kati Provisions', 'Nènè Diakité', '+223 66 11 55 99', 'ndiakite@katiprov.ml', 'Quartier Sananfara', 'Kati', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(29, 4, 'Groupe Petro Mali', 'Souleymane Fofana', '+223 76 60 70 80', 'sfofana@petromali.ml', 'Route de Faladié', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(30, 4, 'Beauté d\'Afrique Cosmétiques', 'Aya Kouassi', '+225 05 44 33 22', 'akouassi@beauteafrique.ci', 'Marcory', 'Abidjan', 'Côte d\'Ivoire', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(31, 4, 'Sahel Meuble Design', 'Bourama Sidibé', '+223 91 77 88 99', 'bsidibe@sahelmeuble.ml', 'Zone Industrielle', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL),
(32, 4, 'Trans-Sahara Logistique & Fournitures', 'Hawa Bamba', '+223 65 99 00 11', 'hbamba@transsahara.ml', 'Route de Kayes', 'Bamako', 'Mali', NULL, 0.00, 0.00, 1, '2026-08-14 10:58:57', '2026-08-14 10:58:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `supplier_orders`
--

CREATE TABLE `supplier_orders` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED NOT NULL,
  `order_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence externe (bon de commande)',
  `status` enum('draft','ordered','confirmed','partially_received','received','canceled','disputed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `shipping_cost` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `total_paid` decimal(12,2) DEFAULT '0.00',
  `remaining_balance` decimal(12,2) DEFAULT '0.00',
  `ordered_at` datetime DEFAULT NULL,
  `expected_at` date DEFAULT NULL COMMENT 'Date de livraison prévue',
  `received_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_orders`
--

INSERT INTO `supplier_orders` (`id`, `company_id`, `supplier_id`, `order_number`, `reference`, `status`, `subtotal`, `tax_amount`, `shipping_cost`, `total_amount`, `total_paid`, `remaining_balance`, `ordered_at`, `expected_at`, `received_at`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'BC-202606-0001', NULL, 'received', 700000.00, 0.00, 0.00, 700000.00, 400000.00, 300000.00, '2026-06-22 14:50:00', '2026-06-26', '2026-06-22 15:08:21', 'aucune note suplementaire', 5, '2026-06-22 12:50:00', '2026-06-22 13:14:13'),
(2, 4, 1, 'BC-202606-0002', NULL, 'ordered', 15000000.00, 0.00, 0.00, 15000000.00, 1000000.00, 14000000.00, '2026-06-22 15:24:20', '2026-06-27', NULL, NULL, 5, '2026-06-22 13:24:20', '2026-06-22 13:26:17'),
(3, 4, 1, 'BC-202607-0001', NULL, 'partially_received', 1000000.00, 0.00, 0.00, 1000000.00, 300000.00, 700000.00, '2026-07-21 16:49:32', NULL, NULL, NULL, 5, '2026-07-21 14:49:32', '2026-07-21 14:51:28'),
(4, 4, 1, 'BC-202607-0002', NULL, 'partially_received', 45000000.00, 0.00, 0.00, 45000000.00, 20000000.00, 25000000.00, '2026-07-21 16:59:13', NULL, NULL, NULL, 5, '2026-07-21 14:59:13', '2026-07-21 15:01:19');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_order_items`
--

CREATE TABLE `supplier_order_items` (
  `id` bigint UNSIGNED NOT NULL,
  `supplier_order_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `quantity_ordered` decimal(12,3) NOT NULL,
  `quantity_received` decimal(12,3) DEFAULT '0.000',
  `unit_cost` decimal(12,2) NOT NULL,
  `total_cost` decimal(12,2) NOT NULL COMMENT 'quantity_ordered * unit_cost',
  `received_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_order_items`
--

INSERT INTO `supplier_order_items` (`id`, `supplier_order_id`, `product_id`, `variant_id`, `quantity_ordered`, `quantity_received`, `unit_cost`, `total_cost`, `received_at`, `created_at`, `updated_at`) VALUES
(1, 1, 3, NULL, 5.000, 5.000, 140000.00, 700000.00, '2026-06-22 15:08:21', '2026-06-22 12:50:00', '2026-06-22 13:08:21'),
(2, 2, 4, NULL, 100.000, 0.000, 150000.00, 15000000.00, NULL, '2026-06-22 13:24:20', '2026-06-22 13:24:20'),
(3, 3, 7, NULL, 200.000, 150.000, 5000.00, 1000000.00, '2026-07-21 16:57:34', '2026-07-21 14:49:32', '2026-07-21 14:57:34'),
(4, 4, 6, NULL, 100.000, 50.000, 250000.00, 25000000.00, '2026-07-21 16:59:42', '2026-07-21 14:59:13', '2026-07-21 14:59:42'),
(5, 4, 3, NULL, 100.000, 50.000, 200000.00, 20000000.00, '2026-07-21 16:59:43', '2026-07-21 14:59:13', '2026-07-21 14:59:43');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_payments`
--

CREATE TABLE `supplier_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED NOT NULL,
  `supplier_order_id` bigint UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','check','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date NOT NULL,
  `paid_by` bigint UNSIGNED DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_payments`
--

INSERT INTO `supplier_payments` (`id`, `company_id`, `supplier_id`, `supplier_order_id`, `amount`, `payment_method`, `payment_reference`, `payment_date`, `paid_by`, `note`, `created_at`) VALUES
(1, 4, 1, 1, 200000.00, 'cash', NULL, '2026-06-22', 5, 'Paiement initial', '2026-06-22 12:50:00'),
(2, 4, 1, 1, 200000.00, 'cash', NULL, '2026-06-22', 5, NULL, '2026-06-22 13:14:13'),
(3, 4, 1, 2, 400000.00, 'cash', NULL, '2026-06-22', 5, 'Paiement initial', '2026-06-22 13:24:20'),
(4, 4, 1, 2, 600000.00, 'cash', NULL, '2026-06-22', 5, NULL, '2026-06-22 13:26:17'),
(6, 4, 1, NULL, 1000000.00, 'cash', NULL, '2026-06-22', 5, NULL, '2026-06-22 13:58:35'),
(7, 4, 1, 3, 300000.00, 'cash', NULL, '2026-07-21', 5, 'Paiement initial', '2026-07-21 14:49:32'),
(8, 4, 1, 4, 20000000.00, 'cash', NULL, '2026-07-21', 5, NULL, '2026-07-21 15:01:19');

-- --------------------------------------------------------

--
-- Table structure for table `table_sessions`
--

CREATE TABLE `table_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `table_id` bigint UNSIGNED NOT NULL,
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `number_of_guests` tinyint UNSIGNED DEFAULT '1',
  `staff_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Serveur assigné',
  `status` enum('open','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'fr',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `has_unlimited_access` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `avatar_url`, `email_verified_at`, `last_login_at`, `last_login_ip`, `language`, `is_active`, `created_at`, `updated_at`, `has_unlimited_access`) VALUES
(1, 'Sounkalo', 'Sidibe', 'sidibesounk2003@gmail.com', '82863206', '$2b$12$Gjaanes8ITFbtDW2e6/czO2wbKmskT4FfYkzHxoDNHRtYF8olh1RC', NULL, NULL, '2026-05-19 00:58:51', '::1', 'fr', 1, '2026-05-18 14:32:48', '2026-05-18 22:58:51', 0),
(2, 'isac', 'diarra', 'isac@gmail.com', '70667847', '$2b$10$UR4EenIE7.1HPIBC82xCYedaXB8oDdB7RRtyT8mvizsQytqx6rXvi', NULL, NULL, NULL, NULL, 'fr', 1, '2026-05-19 13:42:27', '2026-05-19 13:42:27', 0),
(3, 'Sounkalo', 'Sidibe', 'sidibe@hotmail.com', '8286320600', '$2b$10$Rdiikyrox5lBqaNf4pgSVOExnHIWeMlXoC/TJiSpZ11qR855AZY6u', NULL, NULL, '2026-06-19 15:32:29', NULL, 'fr', 1, '2026-06-19 13:32:29', '2026-06-19 13:32:29', 0),
(4, 'super', 'Administrateur', 'super_admin@gmail.com', '98778899', '$2b$10$UR4EenIE7.1HPIBC82xCYedaXB8oDdB7RRtyT8mvizsQytqx6rXvi', NULL, NULL, '2026-07-22 11:11:18', NULL, 'fr', 1, '2026-06-21 21:00:32', '2026-07-22 11:11:18', 0),
(5, 'kaba', 'traore', 'kaba@gmail.com', '65009060', '$2b$10$gNQ8L4RfTi.T3cJt2rlLf.7Q6PnoRxqEz3qD9oAqUuiFWnakb0A32', NULL, NULL, '2026-08-17 12:30:18', NULL, 'fr', 1, '2026-06-22 00:31:02', '2026-08-17 10:30:18', 1),
(6, 'Diallo ', 'Sidi', 'puralova29@gmail.com', '72122412', '$2b$10$e99DJhKhAqit7u5m.BHll..GGg70Ir/XQOXymsIbc1h60XpZUgDoe', NULL, NULL, NULL, NULL, 'fr', 1, '2026-06-24 13:32:15', '2026-06-24 13:32:15', 0),
(7, 'ibrahim', 'diarra', 'ibradiarra@gmail.com', '+22382863288', '$2b$10$3cZis.ycVrpte0IWhBv93OZpiTEIlEULzqDQHWj5uRL4K/13.vH/2', NULL, NULL, NULL, NULL, 'fr', 1, '2026-07-13 15:24:00', '2026-07-13 15:24:00', 0),
(8, 'issa kaba', 'traore', 'issakaba@gmail.com', '00876544', '$2b$10$RKYlZrl2prGDUp0IyBP32.AaOnsaq1YAKudERlX7q9KkBJk5isen2', NULL, NULL, '2026-07-21 19:37:02', NULL, 'fr', 1, '2026-07-21 19:36:27', '2026-07-21 19:37:02', 0),
(9, 'iba', 'soumano', 'ibasoumano@gmail.com', '78482906', '$2b$10$Mn/5sjI1IpmBVBiWCDyACuxwmCQfdXx.ZL.D//bQNy..diGyEBL9e', NULL, NULL, '2026-08-07 14:45:43', NULL, 'fr', 1, '2026-07-22 11:12:30', '2026-08-07 12:45:43', 1),
(10, 'ibrahim', 'traore', 'traore@gmail.com', '32234566', '$2b$10$iihsHgXA8SDP4xPgWSC0KeJbJzcPkEqh7OIhGKIIfjF9aiLmZs4f2', NULL, NULL, '2026-08-04 13:20:28', NULL, 'fr', 1, '2026-07-23 10:24:54', '2026-08-04 11:20:28', 0),
(15, 'Gabrielle', 'toure', 'gab@gmail.con', NULL, '$2b$10$SB/hxOq4Pp5jK4hspcIcn.5b/KdQnJH/LG9FDwIvX6LJ6I1wIOfHa', NULL, NULL, '2026-07-31 16:59:13', NULL, 'fr', 1, '2026-07-28 11:44:37', '2026-07-31 14:59:13', 0),
(16, 'ousmane', 'diarra', 'ous@gmail.com', '45655537', '$2b$10$eoBOKpv0q2Uw98kwKPtRvescE29B60CDOEzdi5dnDCVLu3JOwfDH.', NULL, NULL, '2026-07-31 17:52:40', NULL, 'fr', 1, '2026-07-31 13:32:57', '2026-07-31 15:52:40', 0),
(17, 'dian', 'sidibe', 'dian@gmail.com', '09876677', '$2b$10$1EQbDs9cJ0WuIOZruRHQVOQNllPYhwn4L4AuATIhcz/5eJ7LCCC/C', NULL, NULL, '2026-08-04 12:53:53', NULL, 'fr', 1, '2026-08-01 19:28:43', '2026-08-04 10:53:53', 0),
(18, 'bechir', 'sidibe', 'bechir@gmail.com', '33224500', '$2b$10$US4lG69Gik8gTVfTrBNGUu7oyTCrSJCrihZ9z2UFKmdsvnY/EddZ.', NULL, NULL, '2026-08-07 14:13:36', NULL, 'fr', 1, '2026-08-04 12:29:01', '2026-08-07 12:13:36', 0),
(19, 'ousmane', 'diarra', 'ousmane@gmail.com', '4567890', '$2b$10$mZnG87jKAURfbgMogjNrye93OoFGptN2uXC2UNadvdgabr/8I0qNG', NULL, NULL, '2026-08-04 16:17:49', NULL, 'fr', 1, '2026-08-04 13:17:18', '2026-08-04 14:17:49', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_password_resets`
--

CREATE TABLE `user_password_resets` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_password_resets`
--

INSERT INTO `user_password_resets` (`id`, `user_id`, `token`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 1, 'd4b556e79f8c6f118dda8fd645502fcb26848152716bdb5192986da10bb44fc0', '2026-05-18 16:05:29', NULL, '2026-05-18 15:05:28');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `expires_at` datetime NOT NULL,
  `last_activity` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `token`, `ip_address`, `user_agent`, `expires_at`, `last_activity`, `created_at`) VALUES
(2, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTE1NjkzLCJleHAiOjE3Nzk3MjA0OTN9.eIWsv_W4RegpG6nJ6q_UoN9CvsCEFRdzX2b99D5jp7M', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 14:48:14', '2026-05-18 16:48:13', '2026-05-18 14:48:13'),
(5, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTE3MTcwLCJleHAiOjE3Nzk3MjE5NzB9.qZoaYq5A0ChkE_qL3gUATZKbAdUDwQlOSWEltus6KKo', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 15:12:50', '2026-05-18 17:12:50', '2026-05-18 15:12:50'),
(9, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTQzNTg1LCJleHAiOjE3Nzk3NDgzODV9.Uv9zbsZXGr8BmJ1-1swqQH0VCSKY-zbeO6vn6RIvd-A', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 22:33:05', '2026-05-19 00:33:05', '2026-05-18 22:33:05'),
(10, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTQ0MjgyLCJleHAiOjE3Nzk3NDkwODJ9.afqqdN9arMRBNZ66DXBMbzplwKjEM1wrCcv-ve3tIy8', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 22:44:42', '2026-05-19 00:44:42', '2026-05-18 22:44:42'),
(11, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTQ0NjI1LCJleHAiOjE3Nzk3NDk0MjV9.o9-c2O_rURvBM7lzZVYi_Z4LLA8qOWGzT-Y28VDonUI', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 22:50:26', '2026-05-19 00:50:25', '2026-05-18 22:50:25'),
(14, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic2lkaWJlc291bmsyMDAzQGdtYWlsLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc5MTQ3MjM5LCJleHAiOjE3Nzk3NTIwMzl9.s27BRTWYdbl2f4dWjSmo5DPo2CeHlGuJMlWi-os0Jcc', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-25 23:33:59', '2026-05-19 01:33:59', '2026-05-18 23:33:59');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` bigint UNSIGNED NOT NULL,
  `owner_id` bigint UNSIGNED NOT NULL COMMENT 'FK vers users.id (le propriétaire)',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `owner_id`, `name`, `description`, `address`, `status`, `created_at`, `updated_at`) VALUES
(1, 5, 'entrepot principal', 'qwertyuiop', 'bamako-coura', 'active', '2026-07-21 13:41:47', '2026-07-21 13:41:47'),
(2, 9, 'entrepot test', 'qwertyui', 'qwertyui', 'active', '2026-07-28 11:46:03', '2026-07-28 11:46:03'),
(3, 5, 'Entrepôt Central', '', '', 'active', '2026-08-14 10:35:56', '2026-08-14 10:35:56');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_movements`
--

CREATE TABLE `warehouse_movements` (
  `id` bigint UNSIGNED NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `catalog_product_id` bigint UNSIGNED NOT NULL,
  `movement_type` enum('in_from_supplier','transfer_to_shop','transfer_to_warehouse','adjustment','manual','transfer_cancel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL COMMENT 'Positif=entrée, Négatif=sortie',
  `stock_before` decimal(12,3) NOT NULL,
  `stock_after` decimal(12,3) NOT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'supplier_order, manual',
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `destination_company_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Si transféré vers une boutique',
  `performed_by` bigint UNSIGNED DEFAULT NULL COMMENT 'Utilisateur ayant fait l''opération',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_cancelled` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_movements`
--

INSERT INTO `warehouse_movements` (`id`, `warehouse_id`, `catalog_product_id`, `movement_type`, `quantity`, `stock_before`, `stock_after`, `reference_type`, `reference_id`, `destination_company_id`, `performed_by`, `notes`, `created_at`, `is_cancelled`) VALUES
(1, 1, 1, 'in_from_supplier', 200.000, 0.000, 200.000, 'manual', NULL, NULL, 5, 'Stock initial', '2026-07-21 14:46:11', 0),
(4, 1, 1, 'transfer_to_shop', -20.000, 200.000, 180.000, 'manual', NULL, 4, 5, 'Transfert vers boutique', '2026-07-21 14:54:05', 0),
(5, 1, 1, 'in_from_supplier', 100.000, 180.000, 280.000, 'supplier_order', 3, NULL, 5, NULL, '2026-07-21 14:57:34', 0),
(6, 1, 2, 'in_from_supplier', 50.000, 0.000, 50.000, 'supplier_order', 4, NULL, 5, NULL, '2026-07-21 14:59:42', 0),
(7, 1, 3, 'in_from_supplier', 50.000, 0.000, 50.000, 'supplier_order', 4, NULL, 5, NULL, '2026-07-21 14:59:43', 0),
(9, 2, 6, 'in_from_supplier', 300.000, 0.000, 300.000, 'manual', NULL, NULL, 9, 'Stock initial', '2026-07-29 00:20:33', 0),
(10, 2, 6, 'adjustment', 100.000, 300.000, 400.000, 'manual', NULL, NULL, 9, '[RETURN]', '2026-07-29 00:51:09', 0),
(11, 3, 55, 'in_from_supplier', 30.000, 0.000, 30.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:41', 0),
(12, 3, 57, 'in_from_supplier', 35.000, 0.000, 35.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(13, 3, 58, 'in_from_supplier', 17.000, 0.000, 17.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(14, 3, 59, 'in_from_supplier', 75.000, 0.000, 75.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(15, 3, 60, 'in_from_supplier', 3.000, 0.000, 3.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(16, 3, 61, 'in_from_supplier', 29.000, 0.000, 29.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(17, 3, 62, 'in_from_supplier', 71.000, 0.000, 71.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(18, 3, 65, 'in_from_supplier', 20.000, 0.000, 20.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(19, 3, 66, 'in_from_supplier', 35.000, 0.000, 35.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(20, 3, 67, 'in_from_supplier', 43.000, 0.000, 43.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(21, 3, 68, 'in_from_supplier', 48.000, 0.000, 48.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(22, 3, 69, 'in_from_supplier', 44.000, 0.000, 44.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(23, 3, 70, 'in_from_supplier', 58.000, 0.000, 58.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(24, 3, 72, 'in_from_supplier', 80.000, 0.000, 80.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(25, 3, 73, 'in_from_supplier', 8.000, 0.000, 8.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:42', 0),
(26, 3, 74, 'in_from_supplier', 37.000, 0.000, 37.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(27, 3, 75, 'in_from_supplier', 12.000, 0.000, 12.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(28, 3, 76, 'in_from_supplier', 58.000, 0.000, 58.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(29, 3, 77, 'in_from_supplier', 47.000, 0.000, 47.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(30, 3, 78, 'in_from_supplier', 34.000, 0.000, 34.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(31, 3, 79, 'in_from_supplier', 68.000, 0.000, 68.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(32, 3, 80, 'in_from_supplier', 59.000, 0.000, 59.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(33, 3, 81, 'in_from_supplier', 71.000, 0.000, 71.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(34, 3, 82, 'in_from_supplier', 7.000, 0.000, 7.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(35, 3, 83, 'in_from_supplier', 40.000, 0.000, 40.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(36, 3, 84, 'in_from_supplier', 8.000, 0.000, 8.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(37, 3, 85, 'in_from_supplier', 27.000, 0.000, 27.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(38, 3, 87, 'in_from_supplier', 33.000, 0.000, 33.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(39, 3, 88, 'in_from_supplier', 71.000, 0.000, 71.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(40, 3, 90, 'in_from_supplier', 28.000, 0.000, 28.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(41, 3, 92, 'in_from_supplier', 14.000, 0.000, 14.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(42, 3, 93, 'in_from_supplier', 54.000, 0.000, 54.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(43, 3, 96, 'in_from_supplier', 14.000, 0.000, 14.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(44, 3, 97, 'in_from_supplier', 14.000, 0.000, 14.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(45, 3, 100, 'in_from_supplier', 64.000, 0.000, 64.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(46, 3, 101, 'in_from_supplier', 80.000, 0.000, 80.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(47, 3, 102, 'in_from_supplier', 19.000, 0.000, 19.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(48, 3, 103, 'in_from_supplier', 69.000, 0.000, 69.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(49, 3, 104, 'in_from_supplier', 62.000, 0.000, 62.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(50, 3, 105, 'in_from_supplier', 46.000, 0.000, 46.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(51, 3, 106, 'in_from_supplier', 7.000, 0.000, 7.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(52, 3, 107, 'in_from_supplier', 10.000, 0.000, 10.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(53, 3, 108, 'in_from_supplier', 68.000, 0.000, 68.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(54, 3, 109, 'in_from_supplier', 60.000, 0.000, 60.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(55, 3, 110, 'in_from_supplier', 67.000, 0.000, 67.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(56, 3, 111, 'in_from_supplier', 69.000, 0.000, 69.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:43', 0),
(57, 3, 112, 'in_from_supplier', 51.000, 0.000, 51.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(58, 3, 114, 'in_from_supplier', 31.000, 0.000, 31.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(59, 3, 115, 'in_from_supplier', 43.000, 0.000, 43.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(60, 3, 116, 'in_from_supplier', 75.000, 0.000, 75.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(61, 3, 117, 'in_from_supplier', 75.000, 0.000, 75.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(62, 3, 119, 'in_from_supplier', 80.000, 0.000, 80.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(63, 3, 120, 'in_from_supplier', 29.000, 0.000, 29.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(64, 3, 121, 'in_from_supplier', 4.000, 0.000, 4.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(65, 3, 122, 'in_from_supplier', 9.000, 0.000, 9.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(66, 3, 123, 'in_from_supplier', 35.000, 0.000, 35.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(67, 3, 125, 'in_from_supplier', 69.000, 0.000, 69.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(68, 3, 126, 'in_from_supplier', 73.000, 0.000, 73.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(69, 3, 128, 'in_from_supplier', 60.000, 0.000, 60.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(70, 3, 130, 'in_from_supplier', 12.000, 0.000, 12.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(71, 3, 131, 'in_from_supplier', 55.000, 0.000, 55.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(72, 3, 132, 'in_from_supplier', 54.000, 0.000, 54.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(73, 3, 135, 'in_from_supplier', 12.000, 0.000, 12.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(74, 3, 136, 'in_from_supplier', 51.000, 0.000, 51.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(75, 3, 137, 'in_from_supplier', 13.000, 0.000, 13.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(76, 3, 138, 'in_from_supplier', 24.000, 0.000, 24.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(77, 3, 139, 'in_from_supplier', 68.000, 0.000, 68.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(78, 3, 141, 'in_from_supplier', 54.000, 0.000, 54.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(79, 3, 142, 'in_from_supplier', 35.000, 0.000, 35.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(80, 3, 144, 'in_from_supplier', 9.000, 0.000, 9.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(81, 3, 146, 'in_from_supplier', 6.000, 0.000, 6.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(82, 3, 147, 'in_from_supplier', 11.000, 0.000, 11.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(83, 3, 148, 'in_from_supplier', 21.000, 0.000, 21.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(84, 3, 152, 'in_from_supplier', 51.000, 0.000, 51.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(85, 3, 153, 'in_from_supplier', 21.000, 0.000, 21.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(86, 3, 155, 'in_from_supplier', 49.000, 0.000, 49.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(87, 3, 156, 'in_from_supplier', 58.000, 0.000, 58.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(88, 3, 157, 'in_from_supplier', 54.000, 0.000, 54.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(89, 3, 159, 'in_from_supplier', 24.000, 0.000, 24.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(90, 3, 160, 'in_from_supplier', 27.000, 0.000, 27.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(91, 3, 161, 'in_from_supplier', 40.000, 0.000, 40.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(92, 3, 162, 'in_from_supplier', 74.000, 0.000, 74.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(93, 3, 163, 'in_from_supplier', 7.000, 0.000, 7.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(94, 3, 164, 'in_from_supplier', 23.000, 0.000, 23.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(95, 3, 165, 'in_from_supplier', 30.000, 0.000, 30.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(96, 3, 166, 'in_from_supplier', 72.000, 0.000, 72.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(97, 3, 167, 'in_from_supplier', 79.000, 0.000, 79.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(98, 3, 169, 'in_from_supplier', 33.000, 0.000, 33.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(99, 3, 170, 'in_from_supplier', 30.000, 0.000, 30.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(100, 3, 171, 'in_from_supplier', 58.000, 0.000, 58.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(101, 3, 172, 'in_from_supplier', 1.000, 0.000, 1.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(102, 3, 173, 'in_from_supplier', 64.000, 0.000, 64.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(103, 3, 174, 'in_from_supplier', 44.000, 0.000, 44.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(104, 3, 175, 'in_from_supplier', 47.000, 0.000, 47.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(105, 3, 176, 'in_from_supplier', 56.000, 0.000, 56.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(106, 3, 177, 'in_from_supplier', 78.000, 0.000, 78.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(107, 3, 178, 'in_from_supplier', 70.000, 0.000, 70.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(108, 3, 179, 'in_from_supplier', 17.000, 0.000, 17.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(109, 3, 180, 'in_from_supplier', 13.000, 0.000, 13.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(110, 3, 181, 'in_from_supplier', 34.000, 0.000, 34.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(111, 3, 182, 'in_from_supplier', 43.000, 0.000, 43.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(112, 3, 183, 'in_from_supplier', 64.000, 0.000, 64.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(113, 3, 184, 'in_from_supplier', 6.000, 0.000, 6.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(114, 3, 186, 'in_from_supplier', 5.000, 0.000, 5.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(115, 3, 187, 'in_from_supplier', 16.000, 0.000, 16.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(116, 3, 188, 'in_from_supplier', 20.000, 0.000, 20.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(117, 3, 191, 'in_from_supplier', 14.000, 0.000, 14.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(118, 3, 192, 'in_from_supplier', 69.000, 0.000, 69.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(119, 3, 193, 'in_from_supplier', 74.000, 0.000, 74.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0),
(120, 3, 194, 'in_from_supplier', 55.000, 0.000, 55.000, 'import', NULL, NULL, 5, 'Stock initial Entrepôt via Importation', '2026-08-14 10:43:44', 0);

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_movements_backup_20260721`
--

CREATE TABLE `warehouse_movements_backup_20260721` (
  `id` bigint UNSIGNED NOT NULL DEFAULT '0',
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `movement_type` enum('in_from_supplier','transfer_to_shop','transfer_to_warehouse','adjustment','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL COMMENT 'Positif=entrée, Négatif=sortie',
  `stock_before` decimal(12,3) NOT NULL,
  `stock_after` decimal(12,3) NOT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'supplier_order, manual',
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `destination_company_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Si transféré vers une boutique',
  `performed_by` bigint UNSIGNED DEFAULT NULL COMMENT 'Utilisateur ayant fait l''opération',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_stocks`
--

CREATE TABLE `warehouse_stocks` (
  `id` bigint UNSIGNED NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `catalog_product_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `reserved_quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_stocks`
--

INSERT INTO `warehouse_stocks` (`id`, `warehouse_id`, `catalog_product_id`, `quantity`, `reserved_quantity`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 280.000, 0.000, '2026-07-21 14:46:11', '2026-07-21 14:57:34'),
(2, 1, 2, 50.000, 0.000, '2026-07-21 14:59:42', '2026-07-21 14:59:42'),
(3, 1, 3, 50.000, 0.000, '2026-07-21 14:59:43', '2026-07-21 14:59:43'),
(5, 2, 6, 400.000, 0.000, '2026-07-29 00:20:33', '2026-07-29 00:51:09'),
(6, 1, 9, 15.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(7, 1, 10, 40.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(8, 1, 11, 55.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(9, 1, 12, 25.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(10, 1, 13, 80.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(11, 1, 14, 10.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(12, 1, 15, 60.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(13, 1, 16, 35.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(14, 1, 17, 30.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(15, 1, 18, 45.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(16, 1, 19, 90.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(17, 1, 20, 55.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(18, 1, 21, 40.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(19, 1, 22, 35.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(20, 1, 23, 50.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(21, 1, 24, 70.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(22, 1, 25, 20.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(23, 1, 26, 30.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(24, 1, 27, 18.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(25, 1, 28, 120.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(26, 1, 29, 40.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(27, 1, 30, 60.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(28, 1, 31, 35.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(29, 1, 32, 144.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(30, 1, 33, 60.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(31, 1, 34, 80.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(32, 1, 35, 120.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(33, 1, 36, 200.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(34, 1, 37, 96.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(35, 1, 38, 50.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(36, 1, 39, 144.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(37, 1, 40, 40.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(38, 1, 41, 80.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(39, 1, 42, 35.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(40, 1, 43, 75.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(41, 1, 44, 60.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(42, 1, 45, 40.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(43, 1, 46, 100.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(44, 1, 47, 45.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(45, 1, 48, 30.000, 0.000, '2026-08-07 23:00:41', '2026-08-07 23:00:41'),
(46, 3, 55, 30.000, 0.000, '2026-08-14 10:43:41', '2026-08-14 10:43:41'),
(47, 3, 57, 35.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(48, 3, 58, 17.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(49, 3, 59, 75.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(50, 3, 60, 3.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(51, 3, 61, 29.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(52, 3, 62, 71.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(53, 3, 65, 20.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(54, 3, 66, 35.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(55, 3, 67, 43.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(56, 3, 68, 48.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(57, 3, 69, 44.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(58, 3, 70, 58.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(59, 3, 72, 80.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(60, 3, 73, 8.000, 0.000, '2026-08-14 10:43:42', '2026-08-14 10:43:42'),
(61, 3, 74, 37.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(62, 3, 75, 12.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(63, 3, 76, 58.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(64, 3, 77, 47.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(65, 3, 78, 34.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(66, 3, 79, 68.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(67, 3, 80, 59.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(68, 3, 81, 71.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(69, 3, 82, 7.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(70, 3, 83, 40.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(71, 3, 84, 8.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(72, 3, 85, 27.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(73, 3, 87, 33.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(74, 3, 88, 71.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(75, 3, 90, 28.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(76, 3, 92, 14.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(77, 3, 93, 54.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(78, 3, 96, 14.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(79, 3, 97, 14.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(80, 3, 100, 64.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(81, 3, 101, 80.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(82, 3, 102, 19.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(83, 3, 103, 69.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(84, 3, 104, 62.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(85, 3, 105, 46.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(86, 3, 106, 7.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(87, 3, 107, 10.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(88, 3, 108, 68.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(89, 3, 109, 60.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(90, 3, 110, 67.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(91, 3, 111, 69.000, 0.000, '2026-08-14 10:43:43', '2026-08-14 10:43:43'),
(92, 3, 112, 51.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(93, 3, 114, 31.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(94, 3, 115, 43.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(95, 3, 116, 75.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(96, 3, 117, 75.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(97, 3, 119, 80.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(98, 3, 120, 29.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(99, 3, 121, 4.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(100, 3, 122, 9.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(101, 3, 123, 35.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(102, 3, 125, 69.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(103, 3, 126, 73.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(104, 3, 128, 60.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(105, 3, 130, 12.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(106, 3, 131, 55.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(107, 3, 132, 54.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(108, 3, 135, 12.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(109, 3, 136, 51.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(110, 3, 137, 13.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(111, 3, 138, 24.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(112, 3, 139, 68.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(113, 3, 141, 54.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(114, 3, 142, 35.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(115, 3, 144, 9.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(116, 3, 146, 6.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(117, 3, 147, 11.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(118, 3, 148, 21.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(119, 3, 152, 51.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(120, 3, 153, 21.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(121, 3, 155, 49.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(122, 3, 156, 58.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(123, 3, 157, 54.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(124, 3, 159, 24.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(125, 3, 160, 27.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(126, 3, 161, 40.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(127, 3, 162, 74.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(128, 3, 163, 7.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(129, 3, 164, 23.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(130, 3, 165, 30.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(131, 3, 166, 72.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(132, 3, 167, 79.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(133, 3, 169, 33.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(134, 3, 170, 30.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(135, 3, 171, 58.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(136, 3, 172, 1.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(137, 3, 173, 64.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(138, 3, 174, 44.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(139, 3, 175, 47.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(140, 3, 176, 56.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(141, 3, 177, 78.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(142, 3, 178, 70.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(143, 3, 179, 17.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(144, 3, 180, 13.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(145, 3, 181, 34.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(146, 3, 182, 43.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(147, 3, 183, 64.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(148, 3, 184, 6.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(149, 3, 186, 5.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(150, 3, 187, 16.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(151, 3, 188, 20.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(152, 3, 191, 14.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(153, 3, 192, 69.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(154, 3, 193, 74.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44'),
(155, 3, 194, 55.000, 0.000, '2026-08-14 10:43:44', '2026-08-14 10:43:44');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_stocks_backup_20260721`
--

CREATE TABLE `warehouse_stocks_backup_20260721` (
  `id` bigint UNSIGNED NOT NULL DEFAULT '0',
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `reserved_quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointments_date` (`company_id`,`start_datetime`),
  ADD KEY `idx_appointments_client` (`client_id`),
  ADD KEY `idx_appointments_staff` (`staff_id`),
  ADD KEY `idx_appointments_status` (`status`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `appointment_services`
--
ALTER TABLE `appointment_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_app_services_appointment` (`appointment_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `business_types`
--
ALTER TABLE `business_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `cash_register_users`
--
ALTER TABLE `cash_register_users`
  ADD PRIMARY KEY (`cash_register_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_register_id` (`cash_register_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_category_slug_company` (`company_id`,`slug`),
  ADD KEY `idx_categories_parent` (`parent_id`),
  ADD KEY `idx_categories_sort` (`sort_order`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_phone_company` (`company_id`,`phone`),
  ADD KEY `idx_clients_company` (`company_id`),
  ADD KEY `idx_clients_name` (`full_name`),
  ADD KEY `idx_clients_debt` (`current_debt`);

--
-- Indexes for table `client_debts`
--
ALTER TABLE `client_debts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_debts_client` (`client_id`),
  ADD KEY `idx_debts_status` (`status`),
  ADD KEY `idx_debts_due_date` (`due_date`),
  ADD KEY `idx_debts_sale` (`sale_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_companies_slug` (`slug`),
  ADD KEY `idx_companies_business_type` (`business_type_id`),
  ADD KEY `idx_companies_subscription` (`subscription_plan_id`);

--
-- Indexes for table `company_subscription_history`
--
ALTER TABLE `company_subscription_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `debt_payments`
--
ALTER TABLE `debt_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_debt_payments_debt` (`client_debt_id`),
  ADD KEY `idx_debt_payments_date` (`payment_date`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_schedules_user` (`user_id`,`day_of_week`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expenses_company` (`company_id`),
  ADD KEY `idx_expenses_category` (`category`),
  ADD KEY `idx_expenses_date` (`expense_date`),
  ADD KEY `idx_expenses_created_by` (`created_by`);

--
-- Indexes for table `inventory_counts`
--
ALTER TABLE `inventory_counts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_counts_company` (`company_id`),
  ADD KEY `counted_by` (`counted_by`),
  ADD KEY `validated_by` (`validated_by`);

--
-- Indexes for table `inventory_count_items`
--
ALTER TABLE `inventory_count_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_count_item` (`inventory_count_id`,`product_id`,`variant_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_movements_company` (`company_id`),
  ADD KEY `idx_movements_product` (`product_id`),
  ADD KEY `idx_movements_type` (`movement_type`),
  ADD KEY `idx_movements_date` (`created_at`),
  ADD KEY `idx_movements_reference` (`reference_type`,`reference_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `performed_by` (`performed_by`);

--
-- Indexes for table `measurement_units`
--
ALTER TABLE `measurement_units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `memberships`
--
ALTER TABLE `memberships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_membership_user_company` (`user_id`,`company_id`),
  ADD KEY `idx_memberships_company` (`company_id`),
  ADD KEY `idx_memberships_user` (`user_id`),
  ADD KEY `idx_memberships_role` (`role`),
  ADD KEY `memberships_role_id_foreign` (`role_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_code_unique` (`code`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_slug_company` (`company_id`,`slug`),
  ADD UNIQUE KEY `uq_product_barcode_company` (`company_id`,`barcode`),
  ADD UNIQUE KEY `uq_products_company_catalog` (`company_id`,`catalog_product_id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_type` (`product_type`),
  ADD KEY `idx_products_barcode` (`barcode`),
  ADD KEY `idx_products_sku` (`sku`),
  ADD KEY `idx_products_stock` (`current_stock`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `fk_products_catalog` (`catalog_product_id`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_products_name` (`name`);

--
-- Indexes for table `product_catalog`
--
ALTER TABLE `product_catalog`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_catalog_slug` (`owner_id`,`slug`),
  ADD UNIQUE KEY `uq_product_catalog_barcode` (`owner_id`,`barcode`),
  ADD KEY `idx_product_catalog_owner` (`owner_id`),
  ADD KEY `fk_product_catalog_unit` (`unit_id`);

--
-- Indexes for table `product_compositions`
--
ALTER TABLE `product_compositions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_composition` (`parent_product_id`,`ingredient_id`),
  ADD KEY `idx_composition_parent` (`parent_product_id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `unit_id` (`unit_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_variant_sku_company` (`product_id`,`sku`),
  ADD UNIQUE KEY `uq_variant_barcode` (`barcode`),
  ADD KEY `idx_variants_product` (`product_id`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_table_number` (`company_id`,`table_number`),
  ADD KEY `idx_tables_status` (`company_id`,`status`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roles_company_id_index` (`company_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `rp_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sale_number_company` (`company_id`,`sale_number`),
  ADD KEY `idx_sales_client` (`client_id`),
  ADD KEY `idx_sales_date` (`sale_date`),
  ADD KEY `idx_sales_status` (`status`),
  ADD KEY `idx_sales_payment_status` (`payment_status`),
  ADD KEY `idx_sales_seller` (`seller_id`),
  ADD KEY `idx_sales_table` (`table_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_items_sale` (`sale_id`),
  ADD KEY `idx_sale_items_product` (`product_id`),
  ADD KEY `idx_sale_items_status` (`item_status`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `cash_session_id` (`cash_session_id`);

--
-- Indexes for table `sale_returns`
--
ALTER TABLE `sale_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_return_number_company` (`company_id`,`return_number`),
  ADD KEY `idx_sale_returns_sale` (`sale_id`),
  ADD KEY `idx_sale_returns_company` (`company_id`),
  ADD KEY `idx_sale_returns_created_by` (`created_by`);

--
-- Indexes for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_return_items_return` (`sale_return_id`),
  ADD KEY `idx_sale_return_items_sale_item` (`sale_item_id`),
  ADD KEY `idx_sale_return_items_product` (`product_id`);

--
-- Indexes for table `staff_services`
--
ALTER TABLE `staff_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_staff_service` (`user_id`,`service_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoices_company` (`company_id`),
  ADD KEY `idx_invoices_status` (`status`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indexes for table `subscription_payment_proofs`
--
ALTER TABLE `subscription_payment_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `subscription_invoice_id` (`subscription_invoice_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_suppliers_company` (`company_id`),
  ADD KEY `idx_suppliers_phone` (`phone`);

--
-- Indexes for table `supplier_orders`
--
ALTER TABLE `supplier_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_number_company` (`company_id`,`order_number`),
  ADD KEY `idx_supplier_orders_supplier` (`supplier_id`),
  ADD KEY `idx_supplier_orders_status` (`status`),
  ADD KEY `idx_supplier_orders_date` (`created_at`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `supplier_order_items`
--
ALTER TABLE `supplier_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`supplier_order_id`),
  ADD KEY `idx_order_items_product` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier_payments_supplier` (`supplier_id`),
  ADD KEY `idx_supplier_payments_order` (`supplier_order_id`),
  ADD KEY `idx_supplier_payments_date` (`payment_date`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `paid_by` (`paid_by`);

--
-- Indexes for table `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_is_active` (`is_active`);

--
-- Indexes for table `user_password_resets`
--
ALTER TABLE `user_password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resets_token` (`token`),
  ADD KEY `idx_resets_user` (`user_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sessions_token` (`token`(191)),
  ADD KEY `idx_sessions_user` (`user_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_warehouses_owner` (`owner_id`);

--
-- Indexes for table `warehouse_movements`
--
ALTER TABLE `warehouse_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wm_warehouse` (`warehouse_id`),
  ADD KEY `idx_wm_type` (`movement_type`),
  ADD KEY `fk_wm_user` (`performed_by`),
  ADD KEY `fk_wm_company` (`destination_company_id`),
  ADD KEY `idx_wm_catalog_product` (`catalog_product_id`);

--
-- Indexes for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_warehouse_catalog_product` (`warehouse_id`,`catalog_product_id`),
  ADD KEY `idx_warehouse_stocks_catalog_product` (`catalog_product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_services`
--
ALTER TABLE `appointment_services`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_types`
--
ALTER TABLE `business_types`
  MODIFY `id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `cash_movements`
--
ALTER TABLE `cash_movements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `cash_registers`
--
ALTER TABLE `cash_registers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=172;

--
-- AUTO_INCREMENT for table `client_debts`
--
ALTER TABLE `client_debts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `company_subscription_history`
--
ALTER TABLE `company_subscription_history`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `debt_payments`
--
ALTER TABLE `debt_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `inventory_counts`
--
ALTER TABLE `inventory_counts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory_count_items`
--
ALTER TABLE `inventory_count_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;

--
-- AUTO_INCREMENT for table `measurement_units`
--
ALTER TABLE `measurement_units`
  MODIFY `id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT for table `product_catalog`
--
ALTER TABLE `product_catalog`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=195;

--
-- AUTO_INCREMENT for table `product_compositions`
--
ALTER TABLE `product_compositions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `sale_payments`
--
ALTER TABLE `sale_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `sale_returns`
--
ALTER TABLE `sale_returns`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `staff_services`
--
ALTER TABLE `staff_services`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscription_payment_proofs`
--
ALTER TABLE `subscription_payment_proofs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `supplier_orders`
--
ALTER TABLE `supplier_orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `supplier_order_items`
--
ALTER TABLE `supplier_order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `table_sessions`
--
ALTER TABLE `table_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user_password_resets`
--
ALTER TABLE `user_password_resets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `warehouse_movements`
--
ALTER TABLE `warehouse_movements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `admin_audit_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointment_services`
--
ALTER TABLE `appointment_services`
  ADD CONSTRAINT `appointment_services_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD CONSTRAINT `cash_movements_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD CONSTRAINT `cash_registers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_register_users`
--
ALTER TABLE `cash_register_users`
  ADD CONSTRAINT `cash_register_users_ibfk_1` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cash_register_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD CONSTRAINT `cash_sessions_ibfk_1` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `cash_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `cash_sessions_ibfk_3` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_debts`
--
ALTER TABLE `client_debts`
  ADD CONSTRAINT `client_debts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_debts_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_debts_ibfk_3` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `client_debts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`business_type_id`) REFERENCES `business_types` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `companies_ibfk_2` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `debt_payments`
--
ALTER TABLE `debt_payments`
  ADD CONSTRAINT `debt_payments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `debt_payments_ibfk_2` FOREIGN KEY (`client_debt_id`) REFERENCES `client_debts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `debt_payments_ibfk_3` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD CONSTRAINT `employee_schedules_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_schedules_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_counts`
--
ALTER TABLE `inventory_counts`
  ADD CONSTRAINT `inventory_counts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_counts_ibfk_2` FOREIGN KEY (`counted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inventory_counts_ibfk_3` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_count_items`
--
ALTER TABLE `inventory_count_items`
  ADD CONSTRAINT `inventory_count_items_ibfk_1` FOREIGN KEY (`inventory_count_id`) REFERENCES `inventory_counts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_count_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_count_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_movements_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inventory_movements_ibfk_4` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `memberships`
--
ALTER TABLE `memberships`
  ADD CONSTRAINT `memberships_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `memberships_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `memberships_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_catalog` FOREIGN KEY (`catalog_product_id`) REFERENCES `product_catalog` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `measurement_units` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `product_catalog`
--
ALTER TABLE `product_catalog`
  ADD CONSTRAINT `fk_product_catalog_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_catalog_unit` FOREIGN KEY (`unit_id`) REFERENCES `measurement_units` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `product_compositions`
--
ALTER TABLE `product_compositions`
  ADD CONSTRAINT `product_compositions_ibfk_1` FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_compositions_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_compositions_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `measurement_units` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD CONSTRAINT `restaurant_tables_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `rp_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rp_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD CONSTRAINT `sale_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_payments_ibfk_2` FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_returns`
--
ALTER TABLE `sale_returns`
  ADD CONSTRAINT `fk_sale_returns_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  ADD CONSTRAINT `fk_sale_return_items_return` FOREIGN KEY (`sale_return_id`) REFERENCES `sale_returns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_services`
--
ALTER TABLE `staff_services`
  ADD CONSTRAINT `staff_services_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_services_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_services_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  ADD CONSTRAINT `subscription_invoices_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_invoices_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `subscription_payment_proofs`
--
ALTER TABLE `subscription_payment_proofs`
  ADD CONSTRAINT `subscription_payment_proofs_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payment_proofs_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  ADD CONSTRAINT `subscription_payment_proofs_ibfk_3` FOREIGN KEY (`subscription_invoice_id`) REFERENCES `subscription_invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `subscription_payment_proofs_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `supplier_orders`
--
ALTER TABLE `supplier_orders`
  ADD CONSTRAINT `supplier_orders_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `supplier_orders_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `supplier_orders_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `supplier_order_items`
--
ALTER TABLE `supplier_order_items`
  ADD CONSTRAINT `supplier_order_items_ibfk_1` FOREIGN KEY (`supplier_order_id`) REFERENCES `supplier_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `supplier_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `supplier_order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  ADD CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `supplier_payments_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `supplier_payments_ibfk_3` FOREIGN KEY (`supplier_order_id`) REFERENCES `supplier_orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `supplier_payments_ibfk_4` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD CONSTRAINT `table_sessions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `table_sessions_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `table_sessions_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_password_resets`
--
ALTER TABLE `user_password_resets`
  ADD CONSTRAINT `user_password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `fk_warehouse_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warehouse_movements`
--
ALTER TABLE `warehouse_movements`
  ADD CONSTRAINT `fk_wm_catalog_product` FOREIGN KEY (`catalog_product_id`) REFERENCES `product_catalog` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wm_company` FOREIGN KEY (`destination_company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_wm_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_wm_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  ADD CONSTRAINT `fk_ws_catalog_product` FOREIGN KEY (`catalog_product_id`) REFERENCES `product_catalog` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ws_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
