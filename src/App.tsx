import React, { useState, useEffect, useCallback } from 'react'
import { api, Product, Order, User } from './lib/api'
import { printReceipt, printDualReceipts, generateReceiptData } from './utils/receiptPrinter'
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
import Notification from './components/Notification'
import SetupWizard from './components/SetupWizard'

// Hooks and services
import useKeyboardShortcuts, { KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts'
import { initOfflineListener, syncQueue } from './services/offlineQueue'

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
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: 'WumiKay Ventures',
    address: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State',
    phone: '08033683156, 07050509775',
    email: 'Kayodeomowumii@gmail.com'
  })
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
  }

  // Check if first-time setup is needed
  useEffect(() => {
    const setupComplete = localStorage.getItem('wumikay-setup-complete')
    if (!setupComplete && currentView !== 'login' && currentView !== 'register') {
      setShowSetupWizard(true)
    }
  }, [currentView])

  // Initialize offline queue listener
  useEffect(() => {
    const cleanup = initOfflineListener((online) => {
      setIsOnline(online)
      if (online) {
        syncQueue().then(result => {
          if (result.synced > 0) {
            showNotification(`${result.synced} offline order(s) synced successfully!`, 'success')
          }
        })
      }
    })
    return cleanup
  }, [])

  // Keyboard shortcuts handlers
  const handleNewSale = useCallback(() => {
    if (user) {
      setCurrentView('products')
    }
  }, [user])

  const handlePrintLastReceipt = useCallback(() => {
    if (lastOrder && lastOrder.items && lastOrder.items.length > 0) {
      const cartItems = lastOrder.items.map(item => ({
        id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity
      }))
      const receiptData = generateReceiptData(lastOrder, cartItems, companyInfo)
      printReceipt(receiptData)
    } else {
      showNotification('No recent order to print', 'info')
    }
  }, [lastOrder, companyInfo])

  const handleRefreshData = useCallback(() => {
    if (user) {
      loadProducts()
      loadOrders()
      showNotification('Data refreshed', 'success')
    }
  }, [user])

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNewSale: handleNewSale,
    onPrintLastReceipt: handlePrintLastReceipt,
    onRefreshData: handleRefreshData,
    onCancel: () => setShowCheckout(false),
    onHelp: () => setShowKeyboardHelp(true)
  }, !!user && currentView !== 'login' && currentView !== 'register')

  // Check server connection and auto-login on mount
  useEffect(() => {
    const checkServerAndAutoLogin = async () => {
      try {
        // Try to reach health endpoint with retries
        let connected = false
        for (let i = 0; i < 10; i++) {
          try {
            const response = await fetch('http://localhost:5000/api/health', {
              method: 'GET',
              signal: AbortSignal.timeout(2000)
            })
            if (response.ok) {
              connected = true
              console.log('✅ Server connection verified')
              break
            }
          } catch (err) {
            if (i < 9) {
              console.log(`Server check attempt ${i + 1}/10, waiting...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
        
        if (!connected) {
          console.warn('⚠️ Server not responding, but continuing...')
        }
        
        // Check for saved login session (auto-login)
        try {
          const savedSession = localStorage.getItem('wumikay-user-session')
          if (savedSession) {
            const session = JSON.parse(savedSession)
            // Verify the saved credentials are still valid
            if (session.email && session.password) {
              console.log('Found saved session, attempting auto-login...')
              const userData = await api.login(session.email, session.password)
              if (userData) {
                setUser(userData)
                setCurrentView('dashboard')
                console.log('✅ Auto-login successful')
                return // Exit early, user is logged in
              }
            }
          }
        } catch (autoLoginError) {
          console.warn('Auto-login failed, showing login screen:', autoLoginError)
          // Clear invalid session
          localStorage.removeItem('wumikay-user-session')
        }
      } catch (error) {
        console.warn('Server health check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    // Set a timeout to ensure loading state doesn't hang forever
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - setting loading to false')
        setLoading(false)
      }
    }, 15000) // 15 second timeout

    checkServerAndAutoLogin()

    return () => clearTimeout(timeoutId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply saved settings (theme, etc.) on startup and listen for changes
  useEffect(() => {
    const applyTheme = (themeValue: string | undefined) => {
      try {
        const root = document.documentElement
        const setDark = (isDark: boolean) => {
          if (isDark) {
            root.classList.add('theme-dark')
            root.classList.remove('theme-light')
          } else {
            root.classList.add('theme-light')
            root.classList.remove('theme-dark')
          }
        }

        if (!themeValue || themeValue === 'system-default' || themeValue === 'auto') {
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          setDark(prefersDark)
        } else if (themeValue === 'dark') {
          setDark(true)
        } else {
          setDark(false)
        }
      } catch (e) {
        console.warn('Failed to apply theme:', e)
      }
    }

    const loadAndApply = () => {
      try {
        const saved = localStorage.getItem('wumikay-settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          applyTheme(parsed?.themeSettings)
          // Apply brand color and company info if present
          if (parsed?.brandColor) {
            try { 
              document.documentElement.style.setProperty('--primary-color', parsed.brandColor)
              // Set a subtle gradient using the brand color
              document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${parsed.brandColor} 0%, ${parsed.brandColor}80 100%)`)
            } catch (e) {}
          }
          if (parsed?.companyInfo) {
            try { setCompanyInfo(prev => ({ ...prev, ...parsed.companyInfo })) } catch (e) {}
          }
          if (parsed?.logoUrl) {
            try { setCompanyInfo(prev => ({ ...prev, logoUrl: parsed.logoUrl })) } catch (e) {}
          }
        }
      } catch (e) { console.warn('Error loading settings for theme:', e) }
    }

    // Initial apply
    loadAndApply()

    // Listen for settings changes via the custom event
    const onSettingsChanged = (e: any) => {
      const detail = e?.detail
      if (!detail) return
      if (detail.themeSettings) applyTheme(detail.themeSettings)
      if (detail.brandColor) {
        try { 
          document.documentElement.style.setProperty('--primary-color', detail.brandColor)
          document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${detail.brandColor} 0%, ${detail.brandColor}80 100%)`)
        } catch (err) {}
      }
      if (detail.companyInfo) {
        try { setCompanyInfo(prev => ({ ...prev, ...detail.companyInfo })) } catch (err) {}
      }
      if (detail.logoUrl) {
        try { setCompanyInfo(prev => ({ ...prev, logoUrl: detail.logoUrl })) } catch (err) {}
      }
    }
    window.addEventListener('wumikay-settings-changed', onSettingsChanged)

    // Also listen to storage events (in case settings are changed in another window)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wumikay-settings') loadAndApply()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('wumikay-settings-changed', onSettingsChanged)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Reload products when switching to products view (to show newly added products)
  useEffect(() => {
    if (user && currentView === 'products') {
      loadProducts()
    }
  }, [currentView, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load orders when user changes OR when switching to orders view
  useEffect(() => {
    if (user) {
      console.log('User changed, loading orders for:', user.email)
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Reload orders when switching to orders or reports view
  useEffect(() => {
    if (user && (currentView === 'orders' || currentView === 'reports')) {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, user])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading products:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products'
      
      // Provide helpful error messages
      if (errorMessage.includes('Network error') || errorMessage.includes('Unable to connect')) {
        console.warn('Server connection issue - products will be empty until server is ready')
        // Don't show error on initial load - server might still be starting
      } else {
        console.error('Product loading error:', errorMessage)
      }
      
      setProducts([])
      // Still set loading to false so app can continue
    } finally {
      // Always set loading to false, even if there's an error
      // This ensures the app doesn't stay on loading screen forever
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    if (!user) {
      console.log('loadOrders: No user, skipping')
      return
    }

    console.log('loadOrders: Loading orders for user:', user.email)
    setOrdersLoading(true)
    try {
      const data = await api.getOrders()
      console.log('loadOrders: Loaded orders:', data?.length || 0)
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading orders:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load orders'
      
      // Provide helpful error messages
      if (errorMessage.includes('Network error') || errorMessage.includes('Unable to connect')) {
        console.warn('Server connection issue - orders will be empty until server is ready')
      } else {
        console.error('Order loading error:', errorMessage)
      }
      
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleLogin = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const userData = await api.login(email, password)
      setUser(userData)
      setCurrentView('dashboard')
      
      // Save session for auto-login if remember me is enabled
      if (rememberMe) {
        localStorage.setItem('wumikay-user-session', JSON.stringify({
          email,
          password,
          userId: userData.id,
          savedAt: new Date().toISOString()
        }))
        console.log('Session saved for auto-login')
      }
      
      console.log('User set, calling loadOrders')
      loadOrders()
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      
      // Provide helpful error messages for connection issues
      if (errorMessage.includes('Network error') || errorMessage.includes('Unable to connect')) {
        errorMessage = 'Cannot connect to server. Please ensure the application server is running. If this persists, restart the application.'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Server connection timeout. The server may be starting up. Please wait a moment and try again.'
      } else if (errorMessage.includes('Database unavailable')) {
        errorMessage = 'Database is unavailable. Please contact your administrator or try again later.'
      }
      
      showNotification(errorMessage, 'error')
    }
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      // Register the user
      const newUser = await api.register(username, email, password)
      console.log('User registered successfully:', newUser)
      
      // Automatically log in the newly registered user
      try {
        const userData = await api.login(email, password)
        setUser(userData)
        setCurrentView('dashboard')
        showNotification('Registration successful! You have been logged in.', 'success')
        // Load orders for the new user
        loadOrders()
      } catch (loginError) {
        // If auto-login fails, show success message and switch to login
        console.error('Auto-login error:', loginError)
        showNotification('Registration successful! Please login with your credentials.', 'success')
        setCurrentView('login')
      }
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      showNotification(`Registration failed: ${errorMessage}`, 'error')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    setCart([])
    setOrders([])
    // Clear saved session
    localStorage.removeItem('wumikay-user-session')
    console.log('User logged out, session cleared')
  }

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return
    const existingItem = cart.find(item => item.id === product.id)
    const maxQty = product.quantity || 0

    if (existingItem) {
      const newQty = Math.min(existingItem.quantity + 1, maxQty)
      if (newQty <= 0) return
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: newQty } : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: Math.min(1, maxQty)
      }])
    }
  }

  const updateCartQuantity = (id: number, quantity: number) => {
    const product = products.find(p => p.id === id)
    const maxQty = product ? product.quantity : 999

    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      const cappedQty = Math.min(quantity, maxQty)
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: cappedQty } : item
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
      
      // Get payment info from checkout
      const amountPaid = parseFloat(customerInfo.amountPaid) || total
      const amountDue = Math.max(0, total - amountPaid)
      const change = Math.max(0, amountPaid - total)

      // Create order items array
      const orderItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }))

      // Create order with items and payment tracking
      const orderData = await api.createOrder({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        status: amountPaid >= total ? 'Completed' : 'Pending Payment',
        total_amount: total,
        subtotal_amount: subtotal,
        pos_charge: posCharge,
        payment_mode: customerInfo.paymentMode,
        tax_amount: 0,
        notes: customerInfo.notes,
        items: orderItems,
        amount_paid: amountPaid  // New: Track amount paid
      })

      // Update order status if fully paid
      if (amountPaid >= total) {
        await api.updateOrderStatus(orderData.id, 'Completed')
      }

      // Save as last order for reprint
      setLastOrder(orderData)

      // Ensure order has items for receipt (if not, fetch full order)
      let orderForReceipt = orderData
      if (!orderForReceipt.items || orderForReceipt.items.length === 0) {
        orderForReceipt = await api.getOrder(orderData.id)
      }

      // Generate receipt data with payment info
      try {
        const receiptData = {
          ...generateReceiptData(orderForReceipt, cart, companyInfo),
          amountPaid: amountPaid,
          amountDue: amountDue,
          change: change,
          paymentStatus: customerInfo.paymentStatus || (amountPaid >= total ? 'paid' : 'partial')
        }
        
        // Print dual receipts if option selected
        if (customerInfo.printBothReceipts) {
          printDualReceipts(receiptData)
          showNotification('Order placed! Printing admin & customer receipts...', 'success')
        } else {
          printReceipt(receiptData)
          showNotification('Order placed successfully! Receipt printed.', 'success')
        }
      } catch (receiptError) {
        console.error('Receipt printing error:', receiptError)
        showNotification('Order placed successfully, but receipt printing failed.', 'info')
      }

      // Clear cart and refresh orders and products (stock reduced on server)
      setCart([])
      setShowCheckout(false)
      loadOrders()
      loadProducts()
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showNotification(`Checkout failed: ${errorMessage}`, 'error')
    }
  }

  // Show loading screen only briefly, then show login even if products haven't loaded
  if (loading) {
    return (
      <div className="loading-container">
        <img 
          src={(companyInfo as any).logoUrl || '/logo.png'} 
          alt="Wumikay Ventures" 
          style={{ width: '120px', height: 'auto', marginBottom: '2rem', filter: 'brightness(0) invert(1)' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="loading-spinner"></div>
        <p>Loading Wumikay Ventures...</p>
        <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: 0.8 }}>
          If this takes too long, the app will continue anyway...
        </p>
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
        companyLogo={(companyInfo as any).logoUrl}
        brandName={(companyInfo as any).name}
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
          <Dashboard 
            onViewOrder={(orderId) => {
              setCurrentView('orders')
              // Optionally scroll to the order or highlight it
            }}
            onNewSale={() => setCurrentView('products')}
            onViewOrders={() => setCurrentView('orders')}
            onAddProduct={() => setCurrentView('product-management')}
            companyInfo={companyInfo}
          />
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
          <ProductManagement onProductChange={loadProducts} />
        )}
        
        {currentView === 'orders' && user && (
          <OrderHistory
            orders={orders}
            onPrintReceipt={(orderId) => console.log('Print receipt:', orderId)}
            companyInfo={companyInfo}
            onRefresh={loadOrders}
            loading={ordersLoading}
          />
        )}

        {currentView === 'customers' && user && (
          <CustomerManagement />
        )}

        {currentView === 'reports' && user && (
          <Reports orders={orders} onRefresh={loadOrders} />
        )}

        {currentView === 'settings' && user && (
          <Settings 
            companyInfo={companyInfo}
            onCompanyInfoUpdate={setCompanyInfo}
            currentUser={user}
          />
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

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Setup Wizard for first-time users */}
      {showSetupWizard && (
        <SetupWizard
          onComplete={(settings) => {
            setShowSetupWizard(false)
            if (settings.companyName) {
              setCompanyInfo(prev => ({
                ...prev,
                name: settings.companyName,
                address: settings.companyAddress,
                phone: settings.companyPhone,
                email: settings.companyEmail
              }))
            }
            showNotification('Setup complete! Welcome to WumiKay Ventures.', 'success')
          }}
          onSkip={() => {
            setShowSetupWizard(false)
            localStorage.setItem('wumikay-setup-complete', 'true')
          }}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}

      {/* Online/Offline Indicator */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999
        }}>
          <span style={{ fontSize: '16px' }}>📡</span>
          <span style={{ color: '#92400e', fontSize: '14px', fontWeight: 500 }}>
            Offline Mode - Orders will sync when connected
          </span>
        </div>
      )}

      {/* Trademark footer when logged in */}
      {user && (
        <footer className="app-trademark" role="contentinfo">
          <span>WumiKay Ventures</span> © {new Date().getFullYear()}. All rights reserved.
        </footer>
      )}
    </div>
  )
}

export default App