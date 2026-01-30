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
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    // Validate username
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordError = validatePassword(password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await onRegister(username.trim(), email.trim().toLowerCase(), password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <div className="text-center mb-3">
        <img src={((): string => { try { const s = localStorage.getItem('wumikay-settings'); if (s) { const p = JSON.parse(s); return p.logoUrl || (p.companyInfo && p.companyInfo.logoUrl) || '/logo.png' } } catch(e){} return '/logo.png' })()} alt="Wumikay Ventures" style={{ width: '80px', height: 'auto', marginBottom: '1rem', maxHeight: '80px' }} onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }} />
        <h2 className="form-title">Create Account</h2>
        <p style={{ color: '#666' }}>Join Wumikay Ventures</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            className={`form-input ${errors.username ? 'input-error' : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (errors.username) setErrors({ ...errors, username: '' })
            }}
            required
            placeholder="Choose a username (min 3 characters)"
            minLength={3}
            maxLength={30}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-input ${errors.email ? 'input-error' : ''}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            required
            placeholder="Enter your email"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className={`form-input ${errors.password ? 'input-error' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors({ ...errors, password: '' })
            }}
            required
            placeholder="Create a password (min 6 characters)"
            minLength={6}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
          {password && !errors.password && (
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Must contain uppercase, lowercase, and number
            </small>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
            }}
            required
            placeholder="Confirm your password"
            minLength={6}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
