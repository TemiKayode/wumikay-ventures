// Error handling for missing dependencies
let express, cors, Pool, path, dotenv;

try {
  express = require('express');
  cors = require('cors');
  Pool = require('pg').Pool;
  path = require('path');
  dotenv = require('dotenv');
} catch (error) {
  console.error('❌ Failed to load required dependencies:', error.message);
  console.error('   Please ensure all dependencies are installed: npm install');
  process.exit(1);
}

// Load .env file from server directory
// In production (packaged app), use SERVER_PATH env var if available
const serverPath = process.env.SERVER_PATH || __dirname;
try {
  dotenv.config({ path: path.join(serverPath, '.env') });
} catch (error) {
  console.warn('⚠️ Could not load .env file (this is okay if using environment variables):', error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection - trim whitespace from env vars
// Database connection is optional - server will work without it (demo mode)
const dbConfig = {
  user: (process.env.DB_USER || 'postgres').trim(),
  host: (process.env.DB_HOST || 'localhost').trim(),
  database: (process.env.DB_NAME || 'wumikay_ventures').trim(),
  password: (process.env.DB_PASSWORD || 'postgres').trim(),
  port: parseInt(process.env.DB_PORT || '5432'),
  // Connection timeout - shorter for faster failure detection
  connectionTimeoutMillis: 3000,
  // Don't fail immediately if connection fails
  idleTimeoutMillis: 30000,
  max: 20
};

// Log database connection info (without sensitive data)
console.log('Database: Connecting to', dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.database);

// Create pool - this doesn't block, connection is tested later
// Always create pool, even if connection will fail (allows graceful degradation)
let pool;
try {
  pool = new Pool(dbConfig);
} catch (error) {
  console.error('❌ Failed to create database pool:', error.message);
  console.error('   Server will continue without database (demo mode only)');
  // Create a dummy pool object to prevent null reference errors
  pool = {
    query: () => Promise.reject(new Error('Database not available')),
    connect: () => Promise.reject(new Error('Database not available')),
    on: () => {},
    end: () => Promise.resolve()
  };
}

// Track database connection status
let dbConnected = false;

// Test database connection (non-blocking, doesn't prevent server startup)
// This runs asynchronously and doesn't block the server from starting
setTimeout(() => {
  if (pool && typeof pool.query === 'function') {
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
        console.error('   Please ensure PostgreSQL is running and credentials are correct.');
        console.error('   Check server/.env file for database configuration.');
        console.error('   Server will continue - demo user will work without database.');
        console.error('   Database operations will fail. Admin login available via environment variables.');
        dbConnected = false;
        // Don't exit - let the server start anyway
      } else {
        console.log('✅ Database connected successfully');
        dbConnected = true;
      }
    });
  } else {
    console.warn('⚠️ Database pool not available - server running in demo mode only');
    dbConnected = false;
  }
}, 2000); // Wait 2 seconds after server starts before testing connection

// Handle pool errors (only if pool is valid)
if (pool && typeof pool.on === 'function') {
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    dbConnected = false;
    // Don't crash - just log the error
  });
}

// Database migration - Add payment tracking columns
const runMigrations = async () => {
  if (!pool || typeof pool.query !== 'function') return;
  
  try {
    // Add amount_paid column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'amount_paid') THEN
          ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
        END IF;
      END $$;
    `);
    
    // Add amount_due column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'amount_due') THEN
          ALTER TABLE orders ADD COLUMN amount_due DECIMAL(10,2) DEFAULT 0;
        END IF;
      END $$;
    `);
    
    // Add payment_status column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
          ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'paid';
        END IF;
      END $$;
    `);
    
    // Update existing orders to have correct payment status
    await pool.query(`
      UPDATE orders 
      SET amount_paid = COALESCE(amount_paid, total_amount),
          amount_due = COALESCE(amount_due, 0),
          payment_status = COALESCE(payment_status, 'paid')
      WHERE amount_paid IS NULL OR payment_status IS NULL
    `);
    
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.warn('⚠️ Migration warning (may be okay):', error.message);
  }
};

// Run migrations after connection test
setTimeout(() => {
  runMigrations();
}, 3000);

// ==================== USERS API ====================

// Get user by email and password (login)
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Trim and normalize email
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Try database lookup first
    try {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE LOWER(email) = $1 AND password = $2',
        [trimmedEmail, trimmedPassword]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json(result.rows[0]);
    } catch (dbError) {
      // If database query fails (connection, auth, or any other db error)
      // Fallback: check for admin user from environment
      console.log('Database error during login, trying admin fallback:', dbError.code || dbError.message);
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@wumikay.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'WumiKay2026!';
      
      if (trimmedEmail === adminEmail.toLowerCase() && trimmedPassword === adminPassword) {
        return res.json({
          id: 1,
          username: 'admin',
          email: adminEmail,
          role: 'admin',
          created_at: new Date().toISOString()
        });
      }
      
      // If not admin credentials, return appropriate error
      if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND' || dbError.code === 'ETIMEDOUT' || dbError.code === '28P01' || dbError.code === '28000') {
        return res.status(503).json({ error: 'Database unavailable. Please contact administrator.' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, role = 'customer' } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Trim and normalize
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // ADMIN ROLE RESTRICTION: Only admin@wumikay.com can have admin role
    const ADMIN_EMAIL = 'admin@wumikay.com';
    let finalRole = role;
    
    // If email is admin@wumikay.com, automatically set role to admin
    if (trimmedEmail === ADMIN_EMAIL) {
      finalRole = 'admin';
    } else {
      // For any other email, force role to be non-admin (customer or staff only)
      if (finalRole === 'admin') {
        console.log(`Blocked admin role assignment for non-admin email: ${trimmedEmail}`);
        finalRole = 'staff'; // Downgrade to staff if trying to register as admin
      }
    }

    try {
      const result = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
        [trimmedUsername, trimmedEmail, trimmedPassword, finalRole]
      );

      console.log(`User registered successfully: ${trimmedEmail}`);
      res.status(201).json(result.rows[0]);
    } catch (dbError) {
      if (dbError.code === '23505') { // Unique violation
        console.log(`Registration failed: Email or username already exists - ${trimmedEmail}`);
        res.status(400).json({ error: 'Email or username already exists' });
      } else if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        console.error('Registration: Database connection error');
        res.status(503).json({ error: 'Database unavailable. Please try again later.' });
      } else {
        console.error('Registration error:', dbError);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PRODUCTS API ====================

// Helper to check if error is a database connection error
function isDbConnectionError(error) {
  const connectionErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE'];
  return connectionErrors.includes(error.code) || 
         error.message?.includes('Connection terminated') ||
         error.message?.includes('connection') ||
         error.message?.includes('database') ||
         !dbConnected;
}

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('Database not connected, returning empty products list');
      return res.json([]);
    }
    const result = await pool.query(
      'SELECT * FROM products ORDER BY name'
    );
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    // If database is unavailable, return empty array instead of error
    if (isDbConnectionError(error)) {
      console.warn('Database unavailable, returning empty products list');
      res.json([]);
    } else {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const {
      name, description, price, quantity, category, barcode,
      low_stock_threshold, cost_price, selling_price, brand
    } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity, 10) || 0;
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }
    if (numQty < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, quantity, category, barcode, 
       low_stock_threshold, cost_price, selling_price, brand)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name.trim(), description || '', numPrice, numQty, category || '', barcode || null,
       parseInt(low_stock_threshold, 10) || 10, cost_price != null ? parseFloat(cost_price) : null, selling_price != null ? parseFloat(selling_price) : null, brand || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { id } = req.params;
    const {
      name, description, price, quantity, category, barcode,
      low_stock_threshold, cost_price, selling_price, brand
    } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity, 10);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }
    if (isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const result = await pool.query(
      `UPDATE products SET 
       name = $1, description = $2, price = $3, quantity = $4, category = $5,
       barcode = $6, low_stock_threshold = $7, cost_price = $8, 
       selling_price = $9, brand = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [name.trim(), description || '', numPrice, numQty, category || '', barcode || null,
       parseInt(low_stock_threshold, 10) || 10, cost_price != null ? parseFloat(cost_price) : null, selling_price != null ? parseFloat(selling_price) : null, brand || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ORDERS API ====================

// Get all orders with items
app.get('/api/orders', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('Database not connected, returning empty orders list');
      return res.json([]);
    }
    const ordersResult = await pool.query(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );

    const orders = ordersResult.rows || [];

    // Fetch order items for each order
    for (let order of orders) {
      try {
        const itemsResult = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        order.items = itemsResult.rows || [];
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError.message);
        order.items = []; // Set empty array if items can't be loaded
      }
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    // If database is unavailable, return empty array instead of error
    if (isDbConnectionError(error)) {
      console.warn('Database unavailable, returning empty orders list');
      res.json([]);
    } else {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected. Please ensure PostgreSQL is running.' });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.error('Order create: pool connect failed', connErr);
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    await client.query('BEGIN');

    const {
      order_number, customer_name, customer_email, customer_phone,
      status, total_amount, subtotal_amount, pos_charge, payment_mode,
      tax_amount, notes, items,
      amount_paid = 0
    } = req.body;

    // Allow guest checkout: use "Guest" and placeholder email when not provided
    const finalCustomerName = (customer_name && String(customer_name).trim()) ? String(customer_name).trim() : 'Guest';
    const finalCustomerEmail = (customer_email && String(customer_email).trim()) ? String(customer_email).trim() : 'guest@checkout.local';
    const finalCustomerPhone = (customer_phone != null && String(customer_phone).trim()) ? String(customer_phone).trim() : '';
    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Calculate amount due and payment status
    const finalAmountPaid = parseFloat(amount_paid) || 0;
    const finalTotal = parseFloat(total_amount) || 0;
    const amountDue = Math.max(0, finalTotal - finalAmountPaid);
    
    // Determine payment status
    let paymentStatus = 'unpaid';
    if (finalAmountPaid >= finalTotal) {
      paymentStatus = 'paid';
    } else if (finalAmountPaid > 0) {
      paymentStatus = 'partial';
    }

    // Insert order with payment tracking fields
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
       status, total_amount, subtotal_amount, pos_charge, payment_mode, tax_amount, notes,
       amount_paid, amount_due, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [order_number, finalCustomerName, finalCustomerEmail, finalCustomerPhone,
       status, finalTotal, subtotal_amount, pos_charge, payment_mode, tax_amount, notes,
       finalAmountPaid, amountDue, paymentStatus]
    );

    const order = orderResult.rows[0];

    // Insert order items and reduce product stock
    if (items && items.length > 0) {
      for (const item of items) {
        const qty = parseInt(item.quantity, 10) || 0;
        if (qty <= 0) continue;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.product_name, qty, item.unit_price, item.subtotal]
        );

        // Reduce product stock by quantity sold (never go below 0)
        await client.query(
          `UPDATE products SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [qty, item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch order with items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    order.items = itemsResult.rows;

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update order payment
app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_paid } = req.body;

    // Get current order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const newAmountPaid = parseFloat(amount_paid) || 0;
    const totalAmount = parseFloat(order.total_amount) || 0;
    const amountDue = Math.max(0, totalAmount - newAmountPaid);
    
    // Determine payment status
    let paymentStatus = 'unpaid';
    if (newAmountPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      paymentStatus = 'partial';
    }

    const result = await pool.query(
      `UPDATE orders SET amount_paid = $1, amount_due = $2, payment_status = $3, 
       updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [newAmountPaid, amountDue, paymentStatus, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get outstanding payments report
app.get('/api/reports/outstanding', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, order_number, customer_name, customer_email, customer_phone,
        total_amount, amount_paid, amount_due, payment_status, order_date
      FROM orders 
      WHERE payment_status IN ('unpaid', 'partial')
      ORDER BY order_date DESC
    `);

    const totalOutstanding = result.rows.reduce((sum, order) => 
      sum + (parseFloat(order.amount_due) || 0), 0);

    res.json({
      orders: result.rows,
      totalOutstanding,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching outstanding payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer payment history
app.get('/api/customers/:email/payments', async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, order_number, total_amount, amount_paid, amount_due, 
        payment_status, payment_mode, order_date
      FROM orders 
      WHERE customer_email = $1
      ORDER BY order_date DESC
    `, [email.toLowerCase()]);

    const totalPurchases = result.rows.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0);
    const totalPaid = result.rows.reduce((sum, order) => 
      sum + (parseFloat(order.amount_paid) || 0), 0);
    const totalOutstanding = result.rows.reduce((sum, order) => 
      sum + (parseFloat(order.amount_due) || 0), 0);

    res.json({
      orders: result.rows,
      summary: {
        totalPurchases,
        totalPaid,
        totalOutstanding,
        orderCount: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== DASHBOARD STATS API ====================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('Database not connected, returning empty dashboard stats');
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        lowStockCount: 0
      });
    }
    // Total orders
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalOrders = parseInt(ordersResult.rows[0].count);

    // Total revenue
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = $1',
      ['Completed']
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Total products
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(productsResult.rows[0].count);

    // Low stock products
    const lowStockResult = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold'
    );
    const lowStockCount = parseInt(lowStockResult.rows[0].count);

    res.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStockCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    if (isDbConnectionError(error)) {
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        lowStockCount: 0
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CUSTOMERS API ====================

app.get('/api/customers', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('Database not connected, returning empty customers list');
      return res.json([]);
    }
    const result = await pool.query(
      `SELECT 
        customer_name,
        customer_email,
        customer_phone,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent
       FROM orders
       GROUP BY customer_name, customer_email, customer_phone
       ORDER BY total_spent DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    if (isDbConnectionError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CLEAR TEST DATA API ====================

// Clear all test data (orders, order_items) - keeps products and admin user
app.post('/api/admin/clear-test-data', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { clearOrders, clearProducts, clearUsers } = req.body;
    const results = {
      ordersDeleted: 0,
      orderItemsDeleted: 0,
      productsDeleted: 0,
      usersDeleted: 0
    };
    
    // Clear orders and order items
    if (clearOrders !== false) {
      const orderItemsResult = await pool.query('DELETE FROM order_items');
      results.orderItemsDeleted = orderItemsResult.rowCount || 0;
      
      const ordersResult = await pool.query('DELETE FROM orders');
      results.ordersDeleted = ordersResult.rowCount || 0;
    }
    
    // Clear products if requested
    if (clearProducts === true) {
      const productsResult = await pool.query('DELETE FROM products');
      results.productsDeleted = productsResult.rowCount || 0;
    }
    
    // Clear users except admin if requested
    if (clearUsers === true) {
      const usersResult = await pool.query("DELETE FROM users WHERE role != 'admin'");
      results.usersDeleted = usersResult.rowCount || 0;
    }
    
    console.log('Test data cleared:', results);
    res.json({ 
      success: true, 
      message: 'Test data cleared successfully',
      ...results
    });
  } catch (error) {
    console.error('Error clearing test data:', error.message);
    res.status(500).json({ error: 'Failed to clear test data' });
  }
});

// Reset database to fresh state (keeps only admin user)
app.post('/api/admin/reset-database', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Delete all order items
    await pool.query('DELETE FROM order_items');
    
    // Delete all orders
    await pool.query('DELETE FROM orders');
    
    // Delete non-admin users
    await pool.query("DELETE FROM users WHERE role != 'admin'");
    
    // Get counts
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    
    console.log('Database reset completed');
    res.json({ 
      success: true, 
      message: 'Database reset successfully. Products kept, orders cleared, only admin user remains.',
      productsRemaining: parseInt(productsCount.rows[0].count),
      usersRemaining: parseInt(usersCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error resetting database:', error.message);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Health check - must work even if database is down
app.get('/api/health', (req, res) => {
  // This endpoint should always work, even if database is unavailable
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected (demo mode available)'
  });
});

// Start server with error handling
let server;

// Exported start function so the server can be started in-process when required
async function startServer(options = {}) {
  const host = options.host || 'localhost'
  const port = options.port || PORT

  return new Promise((resolve, reject) => {
    try {
      server = app.listen(port, host, () => {
        console.log(`🚀 Server running on http://${host}:${port}`);
        console.log(`📊 API endpoints available at http://${host}:${port}/api`);
        resolve(server);
      });

      // Handle port already in use error
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          const msg = `❌ Port ${port} is already in use.`
          console.error(msg)
          console.error(`   Please close the application using port ${port} or change the PORT in server/.env`)
          console.error(`   You can find the process using: netstat -ano | findstr :${port}`)
          reject(new Error(msg))
        } else {
          console.error('Server error:', err)
          reject(err)
        }
      })
    } catch (error) {
      console.error('Failed to start server:', error)
      reject(error)
    }
  })
}

// If run directly (node server/index.js), start immediately and exit on fatal errors
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal server error:', err)
    process.exit(1)
  })
}

module.exports = { startServer }
