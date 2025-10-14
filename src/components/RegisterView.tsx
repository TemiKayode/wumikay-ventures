import React, { useState } from 'react'

interface RegisterViewProps {
  onRegister: (username: string, email: string, password: string) => void
  onSwitchToLogin: () => void
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await onRegister(username, email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <div className="text-center mb-3">
        <img src="/logo.png" alt="Wumikay Ventures" style={{ width: '60px', height: '60px', marginBottom: '1rem' }} />
        <h2 className="form-title">Create Account</h2>
        <p style={{ color: '#666' }}>Join Wumikay Ventures</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
          />
        </div>
        
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
            placeholder="Create a password"
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <div className="text-center mt-2">
        <p style={{ color: '#666' }}>
          Already have an account?{' '}
          <button 
            type="button"
            onClick={onSwitchToLogin}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterView
