import React from 'react'
import { User } from '../lib/supabase'

interface NavbarProps {
  user: User | null
  onLogout: () => void
  onViewChange: (view: 'login' | 'register' | 'dashboard' | 'products' | 'product-management' | 'orders' | 'customers' | 'reports' | 'settings') => void
  cartCount: number
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onViewChange, cartCount }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="Wumikay Ventures" className="navbar-logo" />
        <span className="navbar-title">Wumikay Ventures</span>
      </div>
      
      <div className="navbar-nav">
        {user ? (
          <>
            <button 
              className="nav-link"
              onClick={() => onViewChange('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('products')}
            >
              🛍️ Products
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('product-management')}
            >
              📦 Manage Products
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('orders')}
            >
              📋 Orders
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('customers')}
            >
              👥 Customers
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('reports')}
            >
              📈 Reports
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('settings')}
            >
              ⚙️ Settings
            </button>
            <button 
              className="nav-link cart-link"
              onClick={() => onViewChange('products')}
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
              onClick={() => onViewChange('login')}
            >
              Login
            </button>
            <button 
              className="nav-link"
              onClick={() => onViewChange('register')}
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
