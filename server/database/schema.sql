CREATE DATABASE IF NOT EXISTS erpflow;

USE erpflow;


-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'ADMIN',
        'SALES',
        'WAREHOUSE',
        'ACCOUNTS'
    ) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================
-- CUSTOMERS
-- =========================================

CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    mobile VARCHAR(20) NOT NULL,

    email VARCHAR(150),

    business_name VARCHAR(200),

    gst_number VARCHAR(20),

    customer_type ENUM(
        'RETAIL',
        'WHOLESALE',
        'DISTRIBUTOR'
    ) NOT NULL,

    address TEXT,

    status ENUM(
        'LEAD',
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'LEAD',

    follow_up_date DATE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_customers_name (name),

    INDEX idx_customers_mobile (mobile),

    INDEX idx_customers_status (status)
);


-- =========================================
-- FOLLOW UPS
-- =========================================

CREATE TABLE follow_ups (
    id CHAR(36) PRIMARY KEY,

    customer_id CHAR(36) NOT NULL,

    note TEXT NOT NULL,

    follow_up_date DATE,

    created_by CHAR(36) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_followup_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_followup_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- =========================================
-- PRODUCTS
-- =========================================

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,

    name VARCHAR(200) NOT NULL,

    sku VARCHAR(100) NOT NULL UNIQUE,

    category VARCHAR(100) NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    current_stock INT NOT NULL DEFAULT 0,

    min_stock_alert INT NOT NULL DEFAULT 0,

    warehouse_location VARCHAR(150),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_products_name (name),

    INDEX idx_products_category (category),

    INDEX idx_products_stock (current_stock)
);


-- =========================================
-- STOCK MOVEMENTS
-- =========================================

CREATE TABLE stock_movements (
    id CHAR(36) PRIMARY KEY,

    product_id CHAR(36) NOT NULL,

    quantity INT NOT NULL,

    movement_type ENUM(
        'IN',
        'OUT'
    ) NOT NULL,

    reason VARCHAR(255) NOT NULL,

    created_by CHAR(36) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_stock_user
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    INDEX idx_stock_product (product_id),

    INDEX idx_stock_created_at (created_at)
);


-- =========================================
-- CHALLANS
-- =========================================

CREATE TABLE challans (
    id CHAR(36) PRIMARY KEY,

    challan_number VARCHAR(50) NOT NULL UNIQUE,

    customer_id CHAR(36) NOT NULL,

    total_quantity INT NOT NULL DEFAULT 0,

    status ENUM(
        'DRAFT',
        'CONFIRMED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    created_by CHAR(36) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_challan_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_challan_user
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    INDEX idx_challans_customer (customer_id),

    INDEX idx_challans_status (status),

    INDEX idx_challans_created_at (created_at)
);


-- =========================================
-- CHALLAN ITEMS
-- =========================================

CREATE TABLE challan_items (
    id CHAR(36) PRIMARY KEY,

    challan_id CHAR(36) NOT NULL,

    product_id CHAR(36) NOT NULL,

    product_name VARCHAR(200) NOT NULL,

    sku VARCHAR(100) NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    quantity INT NOT NULL,

    total_price DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_challan_item_challan
        FOREIGN KEY (challan_id)
        REFERENCES challans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_challan_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    INDEX idx_challan_items_challan (challan_id),

    INDEX idx_challan_items_product (product_id)
);