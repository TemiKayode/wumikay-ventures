import React, { useState } from 'react'
import { User } from '../lib/supabase'

interface NavbarProps {
  user: User | null
  onLogout: () => void
  onViewChange: (view: 'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings') => void
  cartCount: number
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onViewChange, cartCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleViewChange = (view: 'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings') => {
    onViewChange(view)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="Wumikay Ventures" className="navbar-logo" />
        <span className="navbar-title">Wumikay Ventures</span>
      </div>
      
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      
      <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        {user ? (
          <>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('products')}
            >
              🛍️ Products
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('product-management')}
            >
              📦 Manage Products
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('orders')}
            >
              📋 Orders
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('customers')}
            >
              👥 Customers
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('reports')}
            >
              📈 Reports
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('settings')}
            >
              ⚙️ Settings
            </button>
            <button 
              className="nav-link cart-link"
              onClick={() => handleViewChange('products')}
            >
              🛒 Cart ({cartCount})
            </button>
            <div className="nav-link user-info">
              Welcome, {user.username}
            </div>
            <button 
              className="btn btn-outline"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('login')}
            >
              Login
            </button>
            <button 
              className="nav-link"
              onClick={() => handleViewChange('register')}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
