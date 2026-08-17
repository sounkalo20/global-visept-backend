-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 03, 2026 at 01:11 PM
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
(5, 5, 5, NULL, 'fritures', 'fritures-1782223337333', NULL, NULL, 0, 1, '2026-06-23 14:02:17', '2026-08-03 11:38:09', NULL);

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
(4, 4, 'Gabrielle', 'toure', 'Gabrielle toure', '+22382863206', 'gab2@gmail.con', 'Bamako', 'Bamako', NULL, NULL, 680000.00, 2, '2026-06-22 23:38:28', 150000.00, 1, '2026-06-22 21:31:01', '2026-06-23 11:17:51', NULL),
(5, 5, 'isac', 'yiarra', 'isac yiarra', '66557899', NULL, NULL, NULL, NULL, NULL, 10000.00, 1, '2026-06-23 18:53:11', 1000.00, 1, '2026-06-23 16:52:44', '2026-06-23 17:00:35', NULL);

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
(6, 4, 4, 14, 200000.00, 150000.00, 'partial', '2026-06-27', NULL, 5, '2026-06-22 21:31:44', '2026-06-22 21:31:44'),
(7, 4, 4, 15, 480000.00, 0.00, 'paid', '2026-07-22', NULL, 5, '2026-06-22 21:38:28', '2026-06-23 11:17:51'),
(8, 5, 5, 17, 10000.00, 1000.00, 'partial', '2026-08-01', NULL, 5, '2026-06-23 16:53:11', '2026-06-23 17:00:35');

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
(11, 5, 8, 2000.00, 'cash', NULL, '2026-06-23', 5, NULL, '2026-06-23 16:54:39');

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
(2, 4, 'factures', '', 'equipment', 200000.00, 'XOF', 'cash', '', '2026-06-21', 5, '2026-06-22 19:30:21', '2026-06-22 19:30:42', NULL);

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
(38, 4, 6, NULL, 'adjustment', 1.000, 20.000, 21.000, 'inventory_count', 1, 250000.00, '[Inventaire 1] Ajustement inventaire', 5, '2026-07-31 16:38:56');

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
(11, 10, 4, 'cashier', 12, NULL, NULL, NULL, '2026-07-23 10:24:54', 1, '2026-07-23 10:24:54', '2026-08-01 16:32:09'),
(12, 15, 8, 'manager', 17, NULL, NULL, NULL, '2026-07-28 11:44:37', 1, '2026-07-28 11:44:37', '2026-08-01 16:32:10'),
(13, 16, 9, 'owner', 19, NULL, NULL, NULL, '2026-07-31 15:36:01', 1, '2026-07-31 13:36:01', '2026-08-01 16:32:10'),
(14, 17, 4, 'owner', 28, NULL, NULL, NULL, '2026-08-01 21:28:43', 1, '2026-08-01 19:28:43', '2026-08-01 19:28:43');

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
(43, 'settings.manage', 'Paramètres', 'Gérer les paramètres', 'Accès aux paramètres de l\'entreprise');

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
(3, 4, 3, 4, 1, 'iphone 13 pro', 'iphone-13-pro-1782133776087', 'telephone de marque apple', NULL, '', '', 200000.00, 200000.00, 195000.00, 1, 0, 'product', 1, 6.000, 4.000, 1, 1, NULL, '2026-06-22 12:46:09', '2026-07-31 16:38:55', NULL),
(4, 4, NULL, 4, 1, 'ordinateur', 'ordinateur-1782133887203', 'ordi', NULL, NULL, NULL, 170000.00, 200000.00, 195000.00, 1, 0, 'product', 1, 95.000, 1.000, 1, 1, NULL, '2026-06-22 13:11:27', '2026-07-31 16:38:56', NULL),
(5, 5, NULL, 5, 7, 'plat1-test', 'plat1-test-1782226978271', NULL, 'riz , viande , frittes', NULL, NULL, 0.00, 2000.00, 0.00, 1, 0, 'dish', 0, 0.000, 10.000, 1, 1, NULL, '2026-06-23 15:01:40', '2026-06-23 15:02:58', NULL),
(6, 4, 2, 4, 1, 'iphone 14 pro', 'iphone-14-pro-1782250821426', 'aucune', NULL, NULL, NULL, 250000.00, 2500000.00, 245000.00, 1, 0, 'product', 1, 21.000, 10.000, 1, 1, 'http://global-visept-backend.onrender.com/uploads/products/product-1782250788984-669583536.png', '2026-06-23 21:39:49', '2026-07-31 16:38:56', NULL),
(7, 4, 1, 4, 1, 'test3', 'test3-1784645195182', 'mon produit cool', NULL, NULL, NULL, 5000.00, 7500.00, 7000.00, 10, 0, 'product', 1, 110.000, 5.000, 1, 1, NULL, '2026-07-21 14:46:11', '2026-07-23 10:38:01', NULL),
(8, 8, 4, NULL, 1, 'tes', 'tes-1785239513531', 'werty', NULL, NULL, 'we456', 600.00, 800.00, 700.00, 1, 0, 'product', 1, 1000.000, 10.000, 1, 1, NULL, '2026-07-28 11:51:53', '2026-07-28 11:51:53', NULL),
(9, 8, NULL, NULL, 1, 'rizs', 'rizs-1785283878160', 'aucune', NULL, NULL, NULL, 18000.00, 21000.00, 20000.00, 1, 0, 'product', 1, 250.000, 10.000, 1, 1, NULL, '2026-07-29 00:10:45', '2026-07-29 00:19:38', '2026-07-29 00:19:38'),
(10, 8, 6, NULL, 1, 'rizs', 'rizs-1785284450150', NULL, NULL, NULL, NULL, 18000.00, 20000.00, 19000.00, 1, 0, 'product', 1, 100.000, 10.000, 1, 1, NULL, '2026-07-29 00:20:33', '2026-07-29 00:20:50', NULL),
(11, 4, NULL, NULL, 1, 'iphone 11 pro', 'iphone-11-pro-1785612588156', 'blablaa', NULL, NULL, NULL, 0.00, 0.00, 0.00, 1, 0, 'product', 1, 0.000, 10.000, 1, 1, NULL, '2026-08-01 19:29:48', '2026-08-01 19:29:56', '2026-08-01 21:29:56'),
(12, 4, 8, NULL, 1, 'test2', 'test2-1785762467531', 'aucune', NULL, NULL, NULL, 0.00, 0.00, 0.00, 1, 0, 'product', 1, 0.000, 10.000, 1, 1, NULL, '2026-08-03 13:07:47', '2026-08-03 13:07:47', NULL);

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
(8, 5, 'test2', 'test2', NULL, 'aucune', NULL, 1, NULL, 1, '2026-08-03 13:07:47', '2026-08-03 13:07:47', NULL);

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
(28, 4, 'gestionnaire de stock', 'il gere les commandes fournisseurs, les receptions et les transfert entrepot vers boutique et boutique vers entrepot', 0, '2026-08-01 19:26:50', '2026-08-01 19:26:50');

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
(25, 43);

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
  `payment_method` enum('cash','mobile_money','bank_transfer','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
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
(21, 4, 'VTE-202607-00004', NULL, NULL, 200000.00, 0.00, 'none', NULL, 0.00, 200000.00, 0.00, 'paid', 200000.00, 0.00, 'cash', NULL, 'completed', NULL, NULL, NULL, 10, NULL, '2026-07-23 10:58:15', '2026-07-23 10:58:15', '2026-07-23 10:58:15');

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
(24, 21, 3, NULL, 1.000, 'retail', 200000.00, 200000.00, 195000.00, 200000.00, 0.00, 200000.00, NULL, NULL, '2026-07-23 10:58:15');

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
(3, 4, 19, 'RET-202607-00003', 200000.00, 5, NULL, '2026-07-22 16:38:50', '2026-07-22 16:38:50');

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
(3, 3, 22, 3, NULL, 1.000, 200000.00, 200000.00, 'reintegrable', NULL, '2026-07-22 16:38:50');

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
(1, 4, 'issa diarra', 'Gabrielle toure', '00332200', 'sidibesounk2003@gmail.com', 'Bamako', 'Bamako', 'Mali', 'fournisseur creer avec un solde initial de 1millions', 61700000.00, 39000000.00, 1, '2026-06-22 11:12:04', '2026-07-21 15:01:19', NULL);

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
(5, 'kaba', 'traore', 'kaba@gmail.com', '65009060', '$2b$10$gNQ8L4RfTi.T3cJt2rlLf.7Q6PnoRxqEz3qD9oAqUuiFWnakb0A32', NULL, NULL, '2026-08-03 14:52:20', NULL, 'fr', 1, '2026-06-22 00:31:02', '2026-08-03 12:52:20', 1),
(6, 'Diallo ', 'Sidi', 'puralova29@gmail.com', '72122412', '$2b$10$e99DJhKhAqit7u5m.BHll..GGg70Ir/XQOXymsIbc1h60XpZUgDoe', NULL, NULL, NULL, NULL, 'fr', 1, '2026-06-24 13:32:15', '2026-06-24 13:32:15', 0),
(7, 'ibrahim', 'diarra', 'ibradiarra@gmail.com', '+22382863288', '$2b$10$3cZis.ycVrpte0IWhBv93OZpiTEIlEULzqDQHWj5uRL4K/13.vH/2', NULL, NULL, NULL, NULL, 'fr', 1, '2026-07-13 15:24:00', '2026-07-13 15:24:00', 0),
(8, 'issa kaba', 'traore', 'issakaba@gmail.com', '00876544', '$2b$10$RKYlZrl2prGDUp0IyBP32.AaOnsaq1YAKudERlX7q9KkBJk5isen2', NULL, NULL, '2026-07-21 19:37:02', NULL, 'fr', 1, '2026-07-21 19:36:27', '2026-07-21 19:37:02', 0),
(9, 'iba', 'soumano', 'ibasoumano@gmail.com', '78482906', '$2b$10$Mn/5sjI1IpmBVBiWCDyACuxwmCQfdXx.ZL.D//bQNy..diGyEBL9e', NULL, NULL, '2026-07-31 16:58:50', NULL, 'fr', 1, '2026-07-22 11:12:30', '2026-07-31 14:58:50', 1),
(10, 'ibrahim', 'traore', 'traore@gmail.com', '32234566', '$2b$10$iihsHgXA8SDP4xPgWSC0KeJbJzcPkEqh7OIhGKIIfjF9aiLmZs4f2', NULL, NULL, '2026-07-23 11:33:07', NULL, 'fr', 1, '2026-07-23 10:24:54', '2026-07-23 11:33:07', 0),
(15, 'Gabrielle', 'toure', 'gab@gmail.con', NULL, '$2b$10$SB/hxOq4Pp5jK4hspcIcn.5b/KdQnJH/LG9FDwIvX6LJ6I1wIOfHa', NULL, NULL, '2026-07-31 16:59:13', NULL, 'fr', 1, '2026-07-28 11:44:37', '2026-07-31 14:59:13', 0),
(16, 'ousmane', 'diarra', 'ous@gmail.com', '45655537', '$2b$10$eoBOKpv0q2Uw98kwKPtRvescE29B60CDOEzdi5dnDCVLu3JOwfDH.', NULL, NULL, '2026-07-31 17:52:40', NULL, 'fr', 1, '2026-07-31 13:32:57', '2026-07-31 15:52:40', 0),
(17, 'dian', 'sidibe', 'dian@gmail.com', '09876677', '$2b$10$1EQbDs9cJ0WuIOZruRHQVOQNllPYhwn4L4AuATIhcz/5eJ7LCCC/C', NULL, NULL, '2026-08-03 14:09:29', NULL, 'fr', 1, '2026-08-01 19:28:43', '2026-08-03 12:09:29', 0);

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
(2, 9, 'entrepot test', 'qwertyui', 'qwertyui', 'active', '2026-07-28 11:46:03', '2026-07-28 11:46:03');

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
(10, 2, 6, 'adjustment', 100.000, 300.000, 400.000, 'manual', NULL, NULL, 9, '[RETURN]', '2026-07-29 00:51:09', 0);

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
(5, 2, 6, 400.000, 0.000, '2026-07-29 00:20:33', '2026-07-29 00:51:09');

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
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `client_debts`
--
ALTER TABLE `client_debts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `measurement_units`
--
ALTER TABLE `measurement_units`
  MODIFY `id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `product_catalog`
--
ALTER TABLE `product_catalog`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `sale_returns`
--
ALTER TABLE `sale_returns`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sale_return_items`
--
ALTER TABLE `sale_return_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `warehouse_movements`
--
ALTER TABLE `warehouse_movements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
