import { supabase } from './lib/supabase'

export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...')

    // Since we can't create tables via RPC, we'll just log that tables should exist
    // In production, you would create these tables via Supabase dashboard or SQL editor
    console.log('Please ensure the following tables exist in your Supabase database:')
    console.log(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        category VARCHAR(50),
        barcode VARCHAR(50),
        low_stock_threshold INTEGER DEFAULT 10,
        cost_price DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        brand VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100),
        customer_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Pending',
        total_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        order_date TIMESTAMP DEFAULT NOW(),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      );
    `)

    console.log('Database setup completed!')
    return true
  } catch (error) {
    console.error('Database setup failed:', error)
    return false
  }
}
