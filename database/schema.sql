-- WumiKay Ventures Database Schema
-- PostgreSQL Database Setup for Offline Mode

-- Create database (run this manually if needed)
-- CREATE DATABASE wumikay_ventures;

-- Enable UUID extension (if needed)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    low_stock_threshold INTEGER DEFAULT 10,
    cost_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL,
    pos_charge DECIMAL(10, 2) DEFAULT 0,
    payment_mode VARCHAR(20) DEFAULT 'cash',
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert admin user (change password immediately after first login!)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@wumikay.com', 'ChangeMe123!', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, quantity, category, barcode, low_stock_threshold, cost_price, selling_price, brand) VALUES
('Coca-Cola PET Bottle', 'PET Coke', 4450.00, 100, 'Beverages', 'COCA001', 10, 4000.00, 4450.00, 'Coca-Cola'),
('Fanta Orange PET Bottle', 'PET Fanta', 4450.00, 100, 'Beverages', 'FANTA001', 10, 4000.00, 4450.00, 'Fanta'),
('Pepsi Cola PET Bottle', 'PET Pepsi', 4400.00, 100, 'Beverages', 'PEPSI001', 10, 4000.00, 4400.00, 'Pepsi'),
('Teem Bitter Lemon PET Bottle', 'PET Teem', 4400.00, 100, 'Beverages', 'TEEM001', 10, 4000.00, 4400.00, 'Teem'),
('Sprite Lemon-Lime PET Bottle', 'PET Sprite', 4450.00, 100, 'Beverages', 'SPRITE001', 10, 4000.00, 4450.00, 'Sprite'),
('Schweppes Tonic Water PET Bottle', 'PET Schweepes', 4450.00, 100, 'Beverages', 'SCHW001', 10, 4000.00, 4450.00, 'Schweppes'),
('Predator Energy Drink', 'Predator', 5400.00, 100, 'Energy Drinks', 'PRED001', 10, 4800.00, 5400.00, 'Predator'),
('Fearless Energy Drink', 'Fearless', 4600.00, 100, 'Energy Drinks', 'FEAR001', 10, 4200.00, 4600.00, 'Fearless'),
('Mr. V Bottled Water', 'MR. V WATER', 1800.00, 100, 'Water', 'MRV001', 10, 1500.00, 1800.00, 'Mr. V'),
('Eva Bottled Water', 'Eva Water', 2850.00, 100, 'Water', 'EVA001', 10, 2500.00, 2850.00, 'Eva'),
('Cway Bottled Water', 'Cway Water', 1700.00, 100, 'Water', 'CWAY001', 10, 1400.00, 1700.00, 'Cway'),
('Coca-Cola Canned Drink', 'Cocacola Can', 10800.00, 100, 'Canned Drinks', 'COCACAN001', 10, 9800.00, 10800.00, 'Coca-Cola'),
('Viju Milk Drink', 'Viju Milk', 5500.00, 100, 'Dairy', 'VIJUM001', 10, 5000.00, 5500.00, 'Viju'),
('Viju Wheat Drink', 'Viju Wheat', 10000.00, 100, 'Dairy', 'VIJUW001', 10, 9000.00, 10000.00, 'Viju'),
('Viju Yoghurt Drink', 'Viju Yoghurt', 6000.00, 100, 'Dairy', 'VIJUY001', 10, 5500.00, 6000.00, 'Viju'),
('Viju Chocolate Milk Drink', 'Viju Chocolate', 10000.00, 100, 'Dairy', 'VIJUC001', 10, 9000.00, 10000.00, 'Viju'),
('American Cola / Planet Big Size', 'American Cola / Planet b/s', 3800.00, 100, 'Beverages', 'AMCOLBS001', 10, 3400.00, 3800.00, 'American Cola'),
('American Cola / Planet Small Size', 'American Cola / Planet s/s', 2300.00, 100, 'Beverages', 'AMCOLSS001', 10, 2000.00, 2300.00, 'American Cola'),
('Maltina Malt Drink PET Bottle', 'Maltina Pet', 5400.00, 100, 'Malt Drinks', 'MALT001', 10, 4800.00, 5400.00, 'Maltina'),
('7Up Lemon-Lime PET Bottle', '7Up Pet', 4400.00, 100, 'Beverages', '7UP001', 10, 4000.00, 4400.00, '7Up'),
('Razzl Drink Small Size PET', 'RAZZL PET s/s', 2300.00, 100, 'Beverages', 'RAZZL001', 10, 2000.00, 2300.00, 'Razzl'),
('Super Komando Energy Drink 50cl', 'Super Komando 50CL', 4500.00, 100, 'Energy Drinks', 'SUPERK001', 10, 4100.00, 4500.00, 'Super Komando'),
('RGB Coca-Cola Big Size', 'RGB Coke b/s', 7000.00, 100, 'Beverages', 'RGBBS001', 10, 6300.00, 7000.00, 'RGB'),
('RGB Coca-Cola Small Size Zero Sugar', 'RGB Coke s/s (Zero Sugar)', 3500.00, 100, 'Beverages', 'RGBSSZ001', 10, 3100.00, 3500.00, 'RGB'),
('RGB Coca-Cola Small Size Full Sugar', 'RGB Coke s/s (Full Sugar)', 4600.00, 100, 'Beverages', 'RGBSSF001', 10, 4200.00, 4600.00, 'RGB'),
('Bottled Pepsi Big Size', 'Bottled Pepsi b/s', 5100.00, 100, 'Beverages', 'PEPSIBS001', 10, 4600.00, 5100.00, 'Pepsi'),
('Bottled Pepsi Small Size', 'Bottled Pepsi s/s', 3600.00, 100, 'Beverages', 'PEPSISS001', 10, 3200.00, 3600.00, 'Pepsi'),
('Nutri Milk Big Size', 'NUTRI MILK b/s', 6000.00, 100, 'Dairy', 'NUTRIBS001', 10, 5500.00, 6000.00, 'Nutri'),
('Nutri Chocolate Milk Drink', 'Nutri Chocolate', 8400.00, 100, 'Dairy', 'NUTRIC001', 10, 7600.00, 8400.00, 'Nutri'),
('Nutri Super Kids Milk Drink', 'Nutri Super Kids', 5100.00, 100, 'Dairy', 'NUTRISK001', 10, 4600.00, 5100.00, 'Nutri'),
('5alive Pulpy Orange Big Size', '5alive Pulpy b/s', 6500.00, 100, 'Fruit Juices', '5ALIVEBS001', 10, 5900.00, 6500.00, '5alive'),
('5alive Pulpy Orange Small Size', '5alive Pulpy s/s', 5500.00, 100, 'Fruit Juices', '5ALIVESS001', 10, 5000.00, 5500.00, '5alive'),
('Hollandia Yoghurt 1 Liter', 'Hollandia Yoghurt 1 ltr', 16500.00, 100, 'Dairy', 'HOLL001', 10, 15000.00, 16500.00, 'Hollandia'),
('Origin Herbal Bitters', 'Origin Bitters', 22000.00, 100, 'Bitters', 'ORIGIN001', 10, 20000.00, 22000.00, 'Origin'),
('Ace Herbal Bitters', 'Ace Bitters', 17500.00, 100, 'Bitters', 'ACE001', 10, 16000.00, 17500.00, 'Ace'),
('Sosa Drink Big Size', 'Sosa b/s', 5400.00, 100, 'Beverages', 'SOSABS001', 10, 4900.00, 5400.00, 'Sosa'),
('Sosa Drink Small Size', 'Sosa s/s', 4500.00, 100, 'Beverages', 'SOSASS001', 10, 4100.00, 4500.00, 'Sosa'),
('Dudu Milk Drink', 'Dudu Milk', 7200.00, 100, 'Dairy', 'DUDU001', 10, 6500.00, 7200.00, 'Dudu'),
('Chivita Exotic Fruit Juice', 'Chivita Exotic', 15000.00, 100, 'Fruit Juices', 'CHIVEX001', 10, 13500.00, 15000.00, 'Chivita'),
('Chivita Active Fruit Juice', 'Chivita Active', 15500.00, 100, 'Fruit Juices', 'CHIVAC001', 10, 14000.00, 15500.00, 'Chivita'),
('Maltina Malt Drink Crates', 'Maltina Crates', 13500.00, 100, 'Malt Drinks', 'MALTCR001', 10, 12200.00, 13500.00, 'Maltina'),
('Happy Hour Drink', 'Happy Hour', 3800.00, 100, 'Beverages', 'HAPPY001', 10, 3400.00, 3800.00, 'Happy Hour'),
('Maca Energy Drink', 'Maca', 5100.00, 100, 'Energy Drinks', 'MACA001', 10, 4600.00, 5100.00, 'Maca'),
('Mr Fruit Yoghurt Drink', 'Mr Fruit Yoghurt', 5400.00, 100, 'Dairy', 'MRFRUIT001', 10, 4900.00, 5400.00, 'Mr Fruit'),
('Action Bitters PET Bottle', 'Action Bitters Pet', 15500.00, 100, 'Bitters', 'ACTIONPET001', 10, 14000.00, 15500.00, 'Action'),
('Action Bitters Sachet', 'Action Bitters Sachet', 1500.00, 100, 'Bitters', 'ACTIONSACH001', 10, 1300.00, 1500.00, 'Action'),
('Eagle Drink Sachet', 'Eagle Sachet', 1500.00, 100, 'Sachets', 'EAGLE001', 10, 1300.00, 1500.00, 'Eagle'),
('Seaman Drink Sachet', 'Seaman Sachet', 1600.00, 100, 'Sachets', 'SEAMAN001', 10, 1400.00, 1600.00, 'Seaman'),
('Chelsea Drink Sachet', 'Chelsea Sachet', 1600.00, 100, 'Sachets', 'CHELSEA001', 10, 1400.00, 1600.00, 'Chelsea'),
('Caprisun Fruit Drink Sachet', 'Caprisun Sachet', 5000.00, 100, 'Sachets', 'CAPRI001', 10, 4500.00, 5000.00, 'Caprisun'),
('B/B Star Drink', 'B/B STar', 4900.00, 100, 'Beverages', 'BBSTAR001', 10, 4400.00, 4900.00, 'B/B Star'),
('Goldberg Beer Can', 'Goldberg Can', 15500.00, 100, 'Alcoholic Beverages', 'GOLDBERG001', 10, 14000.00, 15500.00, 'Goldberg'),
('Heineken Beer Can', 'Heineken Can', 17000.00, 100, 'Alcoholic Beverages', 'HEINEKEN001', 10, 15300.00, 17000.00, 'Heineken')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
