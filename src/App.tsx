import React, { useState, useEffect } from 'react'
import { supabase, Product, Order, User } from './lib/supabase'
import { populateDatabase } from './populateDatabase'
import { printReceipt, generateReceiptData } from './utils/receiptPrinter'
import './App.css'

// Components
import Navbar from './components/Navbar'
import LoginView from './components/LoginView'
import RegisterView from './components/RegisterView'
import ProductSearchGrid from './components/ProductSearchGrid'
import ShoppingCart from './components/ShoppingCart'
import OrderHistory from './components/OrderHistory'
import CheckoutModal from './components/CheckoutModal'
import Dashboard from './components/Dashboard'
import ProductManagement from './components/ProductManagement'
import CustomerManagement from './components/CustomerManagement'
import Reports from './components/Reports'
import Settings from './components/Settings'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings'>('login')
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(true)
  const [companyInfo, setCompanyInfo] = useState({
    name: 'WumiKay Ventures',
    address: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State',
    phone: '08033683156, 07050509775',
    email: 'Kayodeomowumii@gmail.com'
  })

  // Load products on component mount
  useEffect(() => {
    loadProducts()
    // Populate database with sample data if needed
    populateDatabase()
  }, [])

  // Load orders when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, loading orders for:', user.email)
      loadOrders()
    }
  }, [user])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading products:', error)
        if (error.message.includes('relation "products" does not exist')) {
          console.log('Products table does not exist. Please run the database setup first.')
          // Set some mock products for demo purposes
          setProducts([
            {
              id: 1,
              name: 'Coca-Cola PET Bottle',
              description: 'PET Coke',
              price: 4450,
              quantity: 100,
              category: 'Beverages',
              barcode: 'COCA001',
              low_stock_threshold: 10,
              cost_price: 4000,
              selling_price: 4450,
              brand: 'Coca-Cola',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Fanta Orange PET Bottle',
              description: 'PET Fanta',
              price: 4450,
              quantity: 100,
              category: 'Beverages',
              barcode: 'FANTA001',
              low_stock_threshold: 10,
              cost_price: 4000,
              selling_price: 4450,
              brand: 'Fanta',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
        } else {
          throw error
        }
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    if (!user) {
      console.log('loadOrders: No user, skipping')
      return
    }

    console.log('loadOrders: Loading orders for user:', user.email)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('order_date', { ascending: false })

      if (error) {
        console.error('loadOrders error:', error)
        throw error
      }
      
      console.log('loadOrders: Loaded orders:', data?.length || 0)
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      // Try to get user from our users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (userError) {
        console.log('User not found in database:', userError.message)
        
        // For demo purposes, allow login with demo credentials even if not in database
        if (email === 'demo@wumikay.com' && password === 'demo123') {
          const demoUser = {
            id: 1,
            username: 'demo',
            email: 'demo@wumikay.com',
            role: 'customer',
            created_at: new Date().toISOString()
          }
        setUser(demoUser)
        setCurrentView('dashboard')
        console.log('Demo user set, calling loadOrders')
        loadOrders()
          return
        }
        
        throw new Error('Invalid credentials')
      }

      setUser(userData)
      setCurrentView('dashboard')
      console.log('User set, calling loadOrders')
      loadOrders()
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please check your credentials.')
    }
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      // Insert user directly into our users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username,
          email,
          password: password, // In production, hash this
          role: 'customer'
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error(insertError.message)
      }

      alert('Registration successful! Please login with your credentials.')
      setCurrentView('login')
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      alert(`Registration failed: ${errorMessage}`)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    setCart([])
    setOrders([])
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }])
    }
  }

  const updateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCheckout = async (customerInfo: any) => {
    if (!user || cart.length === 0) return

    try {
      const orderNumber = `ORD-${Date.now()}`
      const subtotal = getCartTotal()
      const posCharge = customerInfo.paymentMode === 'pos' ? 150 : 0
      const total = subtotal + posCharge

      console.log('Creating order with data:', {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        status: 'Pending',
        total_amount: total,
        subtotal_amount: subtotal,
        pos_charge: posCharge,
        payment_mode: customerInfo.paymentMode,
        tax_amount: 0,
        notes: customerInfo.notes
      })

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          status: 'Pending',
          total_amount: total,
          subtotal_amount: subtotal,
          pos_charge: posCharge,
          payment_mode: customerInfo.paymentMode,
          tax_amount: 0,
          notes: customerInfo.notes
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        if (orderError.message.includes('row-level security policy')) {
          throw new Error(`Database security policy error. Please run the FIX_RLS_POLICIES.sql script in your Supabase SQL Editor to fix this issue.`)
        }
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log('Order created successfully:', orderData)

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }))

      console.log('Creating order items:', orderItems)

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        if (itemsError.message.includes('row-level security policy')) {
          throw new Error(`Database security policy error. Please run the FIX_RLS_POLICIES.sql script in your Supabase SQL Editor to fix this issue.`)
        }
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      console.log('Order items created successfully')

      // Update order status to Completed
      const { error: statusError } = await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('id', orderData.id)

      if (statusError) {
        console.error('Status update error:', statusError)
      } else {
        console.log('Order status updated to Completed')
      }

            // Generate and print receipt
            const receiptData = generateReceiptData(orderData, cart, companyInfo)
            printReceipt(receiptData)

            // Clear cart and refresh orders
            setCart([])
            setShowCheckout(false)
            loadOrders()
            alert('Order placed successfully! Receipt printed.')
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Checkout failed: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Wumikay Ventures...</p>
      </div>
    )
  }

  return (
    <div className="App">
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        onViewChange={setCurrentView}
        cartCount={cart.length}
      />
      
      <main className="main-content">
        {currentView === 'login' && (
          <LoginView 
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )}
        
        {currentView === 'register' && (
          <RegisterView 
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        
        {currentView === 'dashboard' && user && (
          <Dashboard />
        )}
        
        {currentView === 'products' && user && (
          <div className="products-container">
            <ProductSearchGrid
              products={products}
              onAddToCart={addToCart}
            />
            <ShoppingCart
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onCheckout={() => setShowCheckout(true)}
              total={getCartTotal()}
            />
          </div>
        )}

        {currentView === 'product-management' && user && (
          <ProductManagement />
        )}
        
        {currentView === 'orders' && user && (
          <OrderHistory
            orders={orders}
            onPrintReceipt={(orderId) => console.log('Print receipt:', orderId)}
            companyInfo={companyInfo}
          />
        )}

        {currentView === 'customers' && user && (
          <CustomerManagement />
        )}

        {currentView === 'reports' && user && (
          <Reports />
        )}

        {currentView === 'settings' && user && (
          <Settings />
        )}
      </main>

      {showCheckout && (
        <CheckoutModal 
          onClose={() => setShowCheckout(false)}
          onCheckout={handleCheckout}
          total={getCartTotal()}
          posChargeAmount={150}
        />
      )}
    </div>
  )
}

export default App