import React, { useState, useEffect } from 'react'

interface LoginViewProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void
  onSwitchToRegister: () => void
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  // Load saved email if available (for convenience)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('wumikay-user-session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        if (session.email) {
          setEmail(session.email)
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      await onLogin(email, password, rememberMe)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <div className="text-center mb-3">
          <img src={(() => { try { const s = localStorage.getItem('wumikay-settings'); if (s) { const p = JSON.parse(s); return p.logoUrl || (p.companyInfo && p.companyInfo.logoUrl) || '/logo.png' } } catch(e){} return '/logo.png' })()} alt="Wumikay Ventures" style={{ width: '80px', height: 'auto', marginBottom: '1rem', maxHeight: '80px' }} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
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
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ cursor: 'pointer', color: '#555', fontSize: '0.95rem' }}>
            Remember me (auto-login next time)
          </label>
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
      </div>
    </div>
  )
}

export default LoginView
