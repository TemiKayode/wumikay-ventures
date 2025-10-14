import React, { useState } from 'react'

interface LoginViewProps {
  onLogin: (email: string, password: string) => void
  onSwitchToRegister: () => void
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      await onLogin(email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <div className="text-center mb-3">
        <img src="/logo.png" alt="Wumikay Ventures" style={{ width: '60px', height: '60px', marginBottom: '1rem' }} />
        <h2 className="form-title">Wumikay Ventures</h2>
        <p style={{ color: '#666' }}>Beverage Order Management System</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="text-center mt-2">
        <p style={{ color: '#666' }}>
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={onSwitchToRegister}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Register here
          </button>
        </p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            <strong>Demo Login:</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>
            Email: demo@wumikay.com<br/>
            Password: demo123
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginView
