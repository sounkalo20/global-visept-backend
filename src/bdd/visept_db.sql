-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 22, 2026 at 11:45 AM
-- Server version: 8.0.30
-- PHP Version: 8.2.28

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
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `duration_minutes` int NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','canceled','no_show') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `cancel_reason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Coiffeur assigné',
  `notes` text COLLATE utf8mb4_unicode_ci,
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
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `company_id` bigint UNSIGNED NOT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `parent_id`, `name`, `slug`, `description`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, NULL, 'telephone ', 'telephone-1779206425400', 'differente categorie de telephone du systeme ', NULL, 0, 1, '2026-05-19 16:00:25', '2026-05-19 16:00:25', NULL),
(2, 2, NULL, 'tablette', 'tablette-1779206487479', 'blablaa', NULL, 0, 1, '2026-05-19 16:01:03', '2026-05-19 16:06:27', '2026-05-19 18:06:27'),
(3, 3, NULL, 'fauteuil', 'fauteuil-1779206841355', 'balabalaa', NULL, 0, 1, '2026-05-19 16:07:21', '2026-05-19 16:07:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
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
(1, 2, 'Gabriel', 'toure', 'Gabriel toure', '+223828632060', 'sidibesounk2003@gmail.com', 'Bamako', 'Bamako', 'aucune note suplementaire', NULL, '65000.00', 2, '2026-05-21 13:43:56', '50000.00', 1, '2026-05-20 16:48:29', '2026-05-21 11:43:56', NULL),
(2, 2, 'moussa', 'sidibe', 'moussa sidibe', '+223828632', 'client@gmail.com', 'Bamako', 'Bamako', 'aucune note suplementaire', NULL, '68000.00', 2, '2026-05-21 13:01:45', '34000.00', 1, '2026-05-20 16:51:38', '2026-05-21 11:39:43', NULL),
(3, 2, 'issa', 'bagayoko', 'issa bagayoko', '009877600', NULL, NULL, NULL, NULL, NULL, '8000.00', 1, '2026-05-21 13:51:29', '4000.00', 1, '2026-05-21 10:41:25', '2026-05-21 11:51:29', NULL);

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
  `status` enum('pending','partial','paid','overdue','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `due_date` date DEFAULT NULL COMMENT 'Date d''échéance',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_debts`
--

INSERT INTO `client_debts` (`id`, `company_id`, `client_id`, `sale_id`, `total_amount`, `remaining_amount`, `status`, `due_date`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 7, '20000.00', '5000.00', 'partial', '2026-06-07', NULL, 2, '2026-05-21 10:57:01', '2026-05-21 11:41:27'),
(2, 2, 2, 8, '34000.00', '34000.00', 'pending', '2026-06-06', NULL, 2, '2026-05-21 10:59:17', '2026-05-21 10:59:17'),
(3, 2, 2, 9, '34000.00', '0.00', 'canceled', NULL, NULL, 2, '2026-05-21 11:01:45', '2026-05-21 11:39:43'),
(4, 2, 1, 10, '45000.00', '45000.00', 'pending', '2026-06-21', NULL, 2, '2026-05-21 11:43:55', '2026-05-21 11:43:55'),
(5, 2, 3, 11, '8000.00', '4000.00', 'partial', '2026-05-30', NULL, 2, '2026-05-21 11:51:29', '2026-05-21 11:51:29');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID pour API publique',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_type_id` tinyint UNSIGNED NOT NULL,
  `subscription_plan_id` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `subscription_status` enum('active','past_due','canceled','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `subscription_ends_at` datetime DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL COMMENT 'Paramètres spécifiques entreprise',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `uuid`, `name`, `slug`, `description`, `logo_url`, `business_type_id`, `subscription_plan_id`, `subscription_status`, `subscription_ends_at`, `country`, `city`, `address`, `phone`, `settings`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '6e4ab3ae-1e9d-488e-9857-622daf404991', 'sounkalo_shop', 'sounkaloshop', 'vente d\'article electronique ', NULL, 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '828632060', '{}', 1, '2026-05-18 14:47:47', '2026-05-18 14:47:47', NULL),
(2, 'a04f9d8c-380e-4212-9537-7481989b04ef', 'isac_electro', 'isac-electro-1779202532604', 'electronique de chez isac ', 'http://localhost:5000/uploads/companies/company-1779202532562-781311330.jpg', 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+2238286320600', NULL, 1, '2026-05-19 14:55:32', '2026-05-19 14:55:32', NULL),
(3, '73755149-c9b0-400f-988e-1ff4f0279d23', 'mobilier_chez_isac', 'mobilier-chez-isac-1779202948386', 'vente de mobilier de bureau', 'http://localhost:5000/uploads/companies/company-1779202948369-40338303.png', 1, 1, 'active', NULL, 'Mali', 'Bamako', 'Bamako', '+2238286320600', NULL, 1, '2026-05-19 15:02:28', '2026-05-19 15:02:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `debt_payments`
--

CREATE TABLE `debt_payments` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `client_debt_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'N° transaction mobile money, etc.',
  `payment_date` date NOT NULL,
  `received_by` bigint UNSIGNED DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `debt_payments`
--

INSERT INTO `debt_payments` (`id`, `company_id`, `client_debt_id`, `amount`, `payment_method`, `payment_reference`, `payment_date`, `received_by`, `note`, `created_at`) VALUES
(2, 2, 1, '15000.00', 'mobile_money', NULL, '2026-05-21', 2, NULL, '2026-05-21 11:41:27'),
(3, 2, 5, '4000.00', 'cash', NULL, '2026-05-21', 2, 'Paiement initial', '2026-05-21 11:51:29');

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
(1, 2, 'nourriture', '', 'rent', '15000.00', 'XOF', 'cash', '', '2026-05-20', 2, '2026-05-21 21:31:53', '2026-05-21 21:37:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_counts`
--

CREATE TABLE `inventory_counts` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','in_progress','completed','validated') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `counted_by` bigint UNSIGNED DEFAULT NULL,
  `validated_by` bigint UNSIGNED DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `movement_type` enum('purchase','sale','return_customer','return_supplier','adjustment','loss','expiry','transfer_in','transfer_out','production','consumption') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL COMMENT 'Positif=entrée, Négatif=sortie',
  `stock_before` decimal(12,3) NOT NULL,
  `stock_after` decimal(12,3) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'sale, supplier_order, inventory_count',
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL COMMENT 'Coût unitaire au moment du mouvement',
  `note` text COLLATE utf8mb4_unicode_ci,
  `performed_by` bigint UNSIGNED DEFAULT NULL COMMENT 'Utilisateur ayant fait l''opération',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `company_id`, `product_id`, `variant_id`, `movement_type`, `quantity`, `stock_before`, `stock_after`, `reference_type`, `reference_id`, `unit_cost`, `note`, `performed_by`, `created_at`) VALUES
(1, 2, 2, NULL, 'sale', '-2.000', '50.000', '48.000', 'sale', 1, '7500.00', NULL, 2, '2026-05-20 11:16:33'),
(2, 2, 2, NULL, 'return_customer', '2.000', '48.000', '50.000', 'sale', 1, NULL, NULL, 2, '2026-05-20 11:17:07'),
(3, 2, 2, NULL, 'sale', '-3.000', '50.000', '47.000', 'sale', 2, '7500.00', NULL, 2, '2026-05-20 11:20:37'),
(4, 2, 2, NULL, 'sale', '-3.000', '47.000', '44.000', 'sale', 3, '7500.00', NULL, 2, '2026-05-20 11:22:21'),
(5, 2, 2, NULL, 'return_customer', '3.000', '44.000', '47.000', 'sale', 3, NULL, NULL, 2, '2026-05-20 12:43:36'),
(6, 2, 2, NULL, 'sale', '-4.000', '47.000', '43.000', 'sale', 3, '7500.00', NULL, 2, '2026-05-20 12:43:36'),
(7, 2, 2, NULL, 'return_customer', '4.000', '43.000', '47.000', 'sale', 3, NULL, NULL, 2, '2026-05-20 13:28:08'),
(8, 2, 2, NULL, 'return_customer', '3.000', '43.000', '46.000', 'sale', 3, NULL, NULL, 2, '2026-05-20 13:28:08'),
(9, 2, 2, NULL, 'sale', '-3.000', '46.000', '43.000', 'sale', 3, '7500.00', NULL, 2, '2026-05-20 13:28:08'),
(10, 2, 2, NULL, 'sale', '-3.000', '43.000', '40.000', 'sale', 4, '7500.00', NULL, 2, '2026-05-20 13:47:39'),
(11, 2, 2, NULL, 'return_customer', '3.000', '40.000', '43.000', 'sale', 4, NULL, NULL, 2, '2026-05-20 13:48:43'),
(12, 2, 2, NULL, 'sale', '-3.000', '43.000', '40.000', 'sale', 5, '7500.00', NULL, 2, '2026-05-20 15:15:58'),
(13, 2, 2, NULL, 'sale', '-2.000', '40.000', '38.000', 'sale', 6, '7500.00', NULL, 2, '2026-05-20 21:02:19'),
(14, 2, 2, NULL, 'sale', '-2.000', '38.000', '36.000', 'sale', 7, '7500.00', NULL, 2, '2026-05-21 10:57:01'),
(15, 2, 2, NULL, 'sale', '-4.000', '36.000', '32.000', 'sale', 8, '7500.00', NULL, 2, '2026-05-21 10:59:17'),
(16, 2, 2, NULL, 'sale', '-4.000', '32.000', '28.000', 'sale', 9, '7500.00', NULL, 2, '2026-05-21 11:01:45'),
(17, 2, 2, NULL, 'sale', '-3.000', '28.000', '25.000', 'sale', 10, '7500.00', NULL, 2, '2026-05-21 11:43:55'),
(18, 2, 2, NULL, 'sale', '-1.000', '25.000', '24.000', 'sale', 11, '7500.00', NULL, 2, '2026-05-21 11:51:29');

-- --------------------------------------------------------

--
-- Table structure for table `measurement_units`
--

CREATE TABLE `measurement_units` (
  `id` smallint UNSIGNED NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('piece','weight','volume','length','service') COLLATE utf8mb4_unicode_ci DEFAULT 'piece'
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
  `company_id` bigint UNSIGNED NOT NULL,
  `role` enum('owner','manager','cashier','employee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `custom_permissions` json DEFAULT NULL COMMENT '{"can_view_reports":true,"can_manage_products":false}',
  `invitation_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invited_at` datetime DEFAULT NULL,
  `joined_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `memberships`
--

INSERT INTO `memberships` (`id`, `user_id`, `company_id`, `role`, `custom_permissions`, `invitation_token`, `invited_at`, `joined_at`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'owner', NULL, NULL, NULL, '2026-05-18 16:47:47', 1, '2026-05-18 14:47:47', '2026-05-18 14:47:47'),
(2, 2, 2, 'owner', NULL, NULL, NULL, '2026-05-19 16:55:32', 1, '2026-05-19 14:55:32', '2026-05-19 14:55:32'),
(3, 2, 3, 'owner', NULL, NULL, NULL, '2026-05-19 17:02:28', 1, '2026-05-19 15:02:28', '2026-05-19 15:02:28');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `unit_id` smallint UNSIGNED NOT NULL DEFAULT '1',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Stock Keeping Unit - référence interne',
  `cost_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix d''achat/revient',
  `retail_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix de vente au détail',
  `wholesale_price` decimal(12,2) DEFAULT '0.00' COMMENT 'Prix de vente en gros',
  `wholesale_min_qty` int UNSIGNED DEFAULT '1' COMMENT 'Quantité minimum pour prix de gros',
  `allow_custom_price` tinyint(1) DEFAULT '0' COMMENT 'Permet saisie prix libre',
  `product_type` enum('product','service','dish','ingredient','raw_material') COLLATE utf8mb4_unicode_ci DEFAULT 'product',
  `manage_stock` tinyint(1) DEFAULT '1',
  `current_stock` decimal(12,3) DEFAULT '0.000',
  `low_stock_threshold` decimal(12,3) DEFAULT '10.000',
  `is_active` tinyint(1) DEFAULT '1',
  `is_available` tinyint(1) DEFAULT '1' COMMENT 'Disponible à la vente',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `category_id`, `unit_id`, `name`, `slug`, `description`, `barcode`, `sku`, `cost_price`, `retail_price`, `wholesale_price`, `wholesale_min_qty`, `allow_custom_price`, `product_type`, `manage_stock`, `current_stock`, `low_stock_threshold`, `is_active`, `is_available`, `image_url`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 1, 1, 'produit test 1', 'produit-test-1-1779223077159', 'aucune', '2000247821435', 'AMP-PDFB0B', '10000.00', '11000.00', '10500.00', 5, 0, 'product', 1, '20.000', '10.000', 1, 1, 'http://localhost:5000/uploads/products/product-1779223077128-544221727.png', '2026-05-19 20:37:57', '2026-05-19 20:59:37', '2026-05-19 22:59:37'),
(2, 2, 1, 1, 'produit test 2', 'produit-test-2-1779224262083', 'day 2 day ', '2000502621138', 'AMP-PDFB0C', '7500.00', '8500.00', '8000.00', 5, 0, 'product', 1, '24.000', '10.000', 1, 1, NULL, '2026-05-19 20:57:42', '2026-05-21 11:51:29', NULL);

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
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `table_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom personnalisé (ex: "Table VIP")',
  `capacity` tinyint UNSIGNED NOT NULL DEFAULT '2',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Salle, Terrasse, etc.',
  `position_x` int DEFAULT NULL COMMENT 'Position sur plan de salle',
  `position_y` int DEFAULT NULL,
  `status` enum('available','occupied','reserved','needs_cleaning','out_of_service') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `sale_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` bigint UNSIGNED DEFAULT NULL,
  `client_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom client de passage (si non enregistré)',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `discount_type` enum('none','percentage','fixed') COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `discount_value` decimal(12,2) DEFAULT NULL,
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('paid','partial','unpaid','debt') COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `amount_due` decimal(12,2) DEFAULT '0.00',
  `payment_method` enum('cash','mobile_money','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence transaction mobile money',
  `status` enum('completed','pending','canceled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `cancel_reason` text COLLATE utf8mb4_unicode_ci,
  `table_id` bigint UNSIGNED DEFAULT NULL,
  `table_session_id` bigint DEFAULT NULL,
  `seller_id` bigint UNSIGNED DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `sale_number`, `client_id`, `client_name`, `subtotal`, `discount_amount`, `discount_type`, `discount_value`, `tax_amount`, `total_amount`, `payment_status`, `amount_paid`, `amount_due`, `payment_method`, `payment_reference`, `status`, `cancel_reason`, `table_id`, `table_session_id`, `seller_id`, `notes`, `sale_date`, `created_at`, `updated_at`) VALUES
(1, 2, 'VTE-202605-00001', NULL, NULL, '17000.00', '500.00', 'fixed', '500.00', '0.00', '16500.00', 'debt', '0.00', '16500.00', 'cash', NULL, 'canceled', 'Annulation manuelle', NULL, NULL, 2, NULL, '2026-05-20 13:16:33', '2026-05-20 11:16:33', '2026-05-20 11:17:07'),
(2, 2, 'VTE-202605-00002', NULL, NULL, '25500.00', '1000.00', 'fixed', '1000.00', '0.00', '24500.00', 'paid', '24500.00', '0.00', 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 13:20:37', '2026-05-20 11:20:37', '2026-05-20 11:20:37'),
(3, 2, 'VTE-202605-00003', NULL, NULL, '30000.00', '3000.00', 'percentage', '10.00', '0.00', '27000.00', 'paid', '27000.00', '0.00', 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 13:22:21', '2026-05-20 11:22:21', '2026-05-20 13:28:08'),
(4, 2, 'VTE-202605-00004', NULL, NULL, '25500.00', '500.00', 'fixed', '500.00', '0.00', '25000.00', 'debt', '20000.00', '5000.00', 'cash', NULL, 'canceled', 'Annulation manuelle', NULL, NULL, 2, NULL, '2026-05-20 15:47:39', '2026-05-20 13:47:39', '2026-05-20 13:48:43'),
(5, 2, 'VTE-202605-00005', NULL, NULL, '25500.00', '500.00', 'fixed', '500.00', '0.00', '25000.00', 'paid', '25000.00', '0.00', 'cash', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 17:15:58', '2026-05-20 15:15:58', '2026-05-20 15:15:58'),
(6, 2, 'VTE-202605-00006', 1, 'Gabriel toure', '20000.00', '0.00', 'none', NULL, '0.00', '20000.00', 'paid', '20000.00', '0.00', 'mobile_money', NULL, 'completed', NULL, NULL, NULL, 2, NULL, '2026-05-20 23:02:19', '2026-05-20 21:02:19', '2026-05-20 21:02:19'),
(7, 2, 'VTE-202605-00007', 1, NULL, '20000.00', '0.00', 'none', NULL, '0.00', '20000.00', 'debt', '0.00', '20000.00', 'cash', 'completed', NULL, NULL, NULL, NULL, 2, NULL, '2026-05-21 12:57:01', '2026-05-21 10:57:01', '2026-05-21 10:57:01'),
(8, 2, 'VTE-202605-00008', 2, NULL, '34000.00', '0.00', 'none', NULL, '0.00', '34000.00', 'debt', '0.00', '34000.00', 'cash', 'completed', NULL, NULL, NULL, NULL, 2, NULL, '2026-05-21 12:59:17', '2026-05-21 10:59:17', '2026-05-21 10:59:17'),
(9, 2, 'VTE-202605-00009', 2, NULL, '34000.00', '0.00', 'none', NULL, '0.00', '34000.00', 'debt', '0.00', '34000.00', 'cash', 'completed', NULL, NULL, NULL, NULL, 2, NULL, '2026-05-21 13:01:45', '2026-05-21 11:01:45', '2026-05-21 11:01:45'),
(10, 2, 'VTE-202605-00010', 1, NULL, '45000.00', '0.00', 'none', NULL, '0.00', '45000.00', 'debt', '0.00', '45000.00', 'cash', 'completed', NULL, NULL, NULL, NULL, 2, NULL, '2026-05-21 13:43:55', '2026-05-21 11:43:55', '2026-05-21 11:43:55'),
(11, 2, 'VTE-202605-00011', 3, NULL, '8500.00', '500.00', 'fixed', '500.00', '0.00', '8000.00', 'debt', '4000.00', '4000.00', 'cash', 'completed', NULL, NULL, NULL, NULL, 2, NULL, '2026-05-21 13:51:29', '2026-05-21 11:51:29', '2026-05-21 11:51:29');

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
  `price_type` enum('retail','wholesale','custom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'retail',
  `unit_price` decimal(12,2) NOT NULL COMMENT 'Prix unitaire effectif appliqué',
  `retail_price_ref` decimal(12,2) DEFAULT NULL COMMENT 'Prix détail de référence au moment vente',
  `wholesale_price_ref` decimal(12,2) DEFAULT NULL COMMENT 'Prix gros de référence au moment vente',
  `total_price` decimal(12,2) NOT NULL COMMENT 'quantity * unit_price',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `cost_price` decimal(12,2) DEFAULT NULL COMMENT 'Coût de revient au moment de la vente',
  `item_status` enum('pending','preparing','ready','served','canceled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Notes de cuisine (cuisson, etc.)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `variant_id`, `quantity`, `price_type`, `unit_price`, `retail_price_ref`, `wholesale_price_ref`, `total_price`, `discount_amount`, `cost_price`, `item_status`, `notes`, `created_at`) VALUES
(1, 1, 2, NULL, '2.000', 'retail', '8500.00', '8500.00', '8000.00', '17000.00', '0.00', '7500.00', 'canceled', NULL, '2026-05-20 11:16:33'),
(2, 2, 2, NULL, '3.000', 'retail', '8500.00', '8500.00', '8000.00', '25500.00', '0.00', '7500.00', NULL, NULL, '2026-05-20 11:20:37'),
(5, 3, 2, NULL, '3.000', 'custom', '10000.00', '8500.00', '8000.00', '30000.00', '0.00', '7500.00', NULL, NULL, '2026-05-20 13:28:08'),
(6, 4, 2, NULL, '3.000', 'retail', '8500.00', '8500.00', '8000.00', '25500.00', '0.00', '7500.00', 'canceled', NULL, '2026-05-20 13:47:39'),
(7, 5, 2, NULL, '3.000', 'retail', '8500.00', '8500.00', '8000.00', '25500.00', '0.00', '7500.00', NULL, NULL, '2026-05-20 15:15:58'),
(8, 6, 2, NULL, '2.000', 'retail', '10000.00', '8500.00', '8000.00', '20000.00', '0.00', '7500.00', NULL, NULL, '2026-05-20 21:02:19'),
(9, 7, 2, NULL, '2.000', 'retail', '10000.00', '8500.00', '8000.00', '20000.00', '0.00', '7500.00', NULL, NULL, '2026-05-21 10:57:01'),
(10, 8, 2, NULL, '4.000', 'retail', '8500.00', '8500.00', '8000.00', '34000.00', '0.00', '7500.00', NULL, NULL, '2026-05-21 10:59:17'),
(11, 9, 2, NULL, '4.000', 'retail', '8500.00', '8500.00', '8000.00', '34000.00', '0.00', '7500.00', NULL, NULL, '2026-05-21 11:01:45'),
(12, 10, 2, NULL, '3.000', 'retail', '15000.00', '8500.00', '8000.00', '45000.00', '0.00', '7500.00', NULL, NULL, '2026-05-21 11:43:55'),
(13, 11, 2, NULL, '1.000', 'retail', '8500.00', '8500.00', '8000.00', '8500.00', '0.00', '7500.00', NULL, NULL, '2026-05-21 11:51:29');

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
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'XOF',
  `status` enum('pending','paid','failed','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` tinyint UNSIGNED NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_yearly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_employees` int UNSIGNED DEFAULT NULL COMMENT 'NULL = illimité',
  `max_products` int UNSIGNED DEFAULT NULL,
  `max_clients` int UNSIGNED DEFAULT NULL,
  `features` json DEFAULT NULL COMMENT 'Liste des fonctionnalités activées',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `code`, `name`, `price_monthly`, `price_yearly`, `max_employees`, `max_products`, `max_clients`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'FREE', 'Gratuit', '0.00', '0.00', 2, 50, 100, '{\"reports\": false, \"suppliers\": false, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false}', 1, '2026-05-07 13:10:46', '2026-05-07 13:10:46'),
(2, 'STANDARD', 'Standard', '9.99', '99.00', 10, 500, 1000, '{\"reports\": true, \"suppliers\": true, \"api_access\": false, \"promotions\": false, \"advanced_stock\": false}', 1, '2026-05-07 13:10:46', '2026-05-07 13:10:46'),
(3, 'PREMIUM', 'Premium', '29.99', '299.00', NULL, NULL, NULL, '{\"reports\": true, \"suppliers\": true, \"api_access\": true, \"promotions\": true, \"advanced_stock\": true}', 1, '2026-05-07 13:10:46', '2026-05-07 13:10:46');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `total_purchases` decimal(14,2) DEFAULT '0.00',
  `current_balance` decimal(14,2) DEFAULT '0.00' COMMENT 'Solde dû au fournisseur',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier_orders`
--

CREATE TABLE `supplier_orders` (
  `id` bigint UNSIGNED NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED NOT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence externe (bon de commande)',
  `status` enum('draft','ordered','confirmed','partially_received','received','canceled','disputed') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `shipping_cost` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `total_paid` decimal(12,2) DEFAULT '0.00',
  `remaining_balance` decimal(12,2) DEFAULT '0.00',
  `ordered_at` datetime DEFAULT NULL,
  `expected_at` date DEFAULT NULL COMMENT 'Date de livraison prévue',
  `received_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `payment_method` enum('cash','mobile_money','bank_transfer','check','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date NOT NULL,
  `paid_by` bigint UNSIGNED DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'fr',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `avatar_url`, `email_verified_at`, `last_login_at`, `last_login_ip`, `language`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Sounkalo', 'Sidibe', 'sidibesounk2003@gmail.com', '82863206', '$2b$12$Gjaanes8ITFbtDW2e6/czO2wbKmskT4FfYkzHxoDNHRtYF8olh1RC', NULL, NULL, '2026-05-19 00:58:51', '::1', 'fr', 1, '2026-05-18 14:32:48', '2026-05-18 22:58:51'),
(2, 'isac', 'diarra', 'isac@gmail.com', '70667847', '$2b$10$UR4EenIE7.1HPIBC82xCYedaXB8oDdB7RRtyT8mvizsQytqx6rXvi', NULL, NULL, NULL, NULL, 'fr', 1, '2026-05-19 13:42:27', '2026-05-19 13:42:27');

-- --------------------------------------------------------

--
-- Table structure for table `user_password_resets`
--

CREATE TABLE `user_password_resets` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
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

--
-- Indexes for dumped tables
--

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
  ADD KEY `idx_memberships_role` (`role`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_slug_company` (`company_id`,`slug`),
  ADD UNIQUE KEY `uq_product_barcode_company` (`company_id`,`barcode`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_type` (`product_type`),
  ADD KEY `idx_products_barcode` (`barcode`),
  ADD KEY `idx_products_sku` (`sku`),
  ADD KEY `idx_products_stock` (`current_stock`),
  ADD KEY `unit_id` (`unit_id`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_products_name` (`name`);

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
-- AUTO_INCREMENT for dumped tables
--

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `client_debts`
--
ALTER TABLE `client_debts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `debt_payments`
--
ALTER TABLE `debt_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventory_counts`
--
ALTER TABLE `inventory_counts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_count_items`
--
ALTER TABLE `inventory_count_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `measurement_units`
--
ALTER TABLE `measurement_units`
  MODIFY `id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `staff_services`
--
ALTER TABLE `staff_services`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_orders`
--
ALTER TABLE `supplier_orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_order_items`
--
ALTER TABLE `supplier_order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `table_sessions`
--
ALTER TABLE `table_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Constraints for dumped tables
--

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
  ADD CONSTRAINT `memberships_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `measurement_units` (`id`) ON DELETE RESTRICT;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
