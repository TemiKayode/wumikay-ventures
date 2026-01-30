import React, { useState } from 'react'
import { User } from '../lib/api'

interface NavbarProps {
  user: User | null
  onLogout: () => void
  onViewChange: (view: 'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings') => void
  cartCount: number
  companyLogo?: string
  brandName?: string
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onViewChange, cartCount, companyLogo, brandName }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleViewChange = (view: 'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings') => {
    onViewChange(view)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        {/* Mobile menu button - moved to top left */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'hamburger-open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <div className="navbar-brand">
          <img src={companyLogo || '/logo.png'} alt={brandName || 'Wumikay Ventures'} className="navbar-logo" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }} />
          <span className="navbar-title">{brandName || 'Wumikay Ventures'}</span>
        </div>
        
        <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        {/* Mobile menu close button */}
        {isMobileMenuOpen && (
          <button 
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <span className="close-icon">×</span>
          </button>
        )}
        
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
      
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export default Navbar
