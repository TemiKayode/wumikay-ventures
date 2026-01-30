import React, { useState, useEffect } from 'react'

interface SetupWizardProps {
  onComplete: (settings: SetupSettings) => void
  onSkip: () => void
}

interface SetupSettings {
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  receiptFooter: string
  currencySymbol: string
  adminEmail: string
  adminPassword: string
  databaseConnected: boolean
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  
  const [settings, setSettings] = useState<SetupSettings>({
    companyName: 'WumiKay Ventures',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    receiptFooter: 'Thank you for shopping with us!\\nWe appreciate your business.',
    currencySymbol: '₦',
    adminEmail: 'admin@wumikay.com',
    adminPassword: '',
    databaseConnected: false
  })

  const totalSteps = 4

  // Check server and database connection on mount
  useEffect(() => {
    checkConnections()
  }, [])

  const checkConnections = async () => {
    setServerStatus('checking')
    setDbStatus('checking')
    
    try {
      const response = await fetch('http://localhost:5000/api/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        setServerStatus('connected')
        const data = await response.json()
        if (data.database === 'connected') {
          setDbStatus('connected')
          setSettings(prev => ({ ...prev, databaseConnected: true }))
        } else {
          setDbStatus('failed')
        }
      } else {
        setServerStatus('failed')
        setDbStatus('failed')
      }
    } catch (error) {
      setServerStatus('failed')
      setDbStatus('failed')
    }
  }

  const handleInputChange = (field: keyof SetupSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    setIsLoading(true)
    
    try {
      // Save to localStorage
      const existingSettings = JSON.parse(localStorage.getItem('wumikay-settings') || '{}')
      const newSettings = {
        ...existingSettings,
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        receiptFooter: settings.receiptFooter,
        currencySymbol: settings.currencySymbol,
        setupCompleted: true,
        setupDate: new Date().toISOString()
      }
      localStorage.setItem('wumikay-settings', JSON.stringify(newSettings))
      
      // Mark setup as complete
      localStorage.setItem('wumikay-setup-complete', 'true')
      
      onComplete(settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      saveSettings()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <div key={step} style={styles.stepWrapper}>
          <div style={{
            ...styles.stepCircle,
            backgroundColor: step === currentStep ? '#667eea' : step < currentStep ? '#10b981' : '#e5e7eb',
            color: step <= currentStep ? 'white' : '#6b7280'
          }}>
            {step < currentStep ? '✓' : step}
          </div>
          <span style={{
            ...styles.stepLabel,
            color: step === currentStep ? '#667eea' : '#6b7280',
            fontWeight: step === currentStep ? 600 : 400
          }}>
            {step === 1 && 'Welcome'}
            {step === 2 && 'Business Info'}
            {step === 3 && 'Connection'}
            {step === 4 && 'Finish'}
          </span>
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <div style={styles.welcomeIcon}>🎉</div>
      <h2 style={styles.stepTitle}>Welcome to WumiKay Ventures!</h2>
      <p style={styles.stepDescription}>
        Let's set up your Point of Sale system in just a few easy steps.
        This wizard will help you configure your business information and verify your connections.
      </p>
      
      <div style={styles.featureList}>
        <div style={styles.featureItem}>
          <span style={styles.featureIcon}>📦</span>
          <span>Manage your products and inventory</span>
        </div>
        <div style={styles.featureItem}>
          <span style={styles.featureIcon}>🛒</span>
          <span>Process sales quickly and easily</span>
        </div>
        <div style={styles.featureItem}>
          <span style={styles.featureIcon}>🧾</span>
          <span>Print professional receipts</span>
        </div>
        <div style={styles.featureItem}>
          <span style={styles.featureIcon}>📊</span>
          <span>Track your business performance</span>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>Business Information</h2>
      <p style={styles.stepDescription}>
        Enter your business details. These will appear on receipts and reports.
      </p>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Business Name *</label>
        <input
          type="text"
          style={styles.input}
          value={settings.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your business name"
        />
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Address</label>
        <input
          type="text"
          style={styles.input}
          value={settings.companyAddress}
          onChange={(e) => handleInputChange('companyAddress', e.target.value)}
          placeholder="Enter your business address"
        />
      </div>
      
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            style={styles.input}
            value={settings.companyPhone}
            onChange={(e) => handleInputChange('companyPhone', e.target.value)}
            placeholder="+234..."
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            style={styles.input}
            value={settings.companyEmail}
            onChange={(e) => handleInputChange('companyEmail', e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Currency Symbol</label>
        <select
          style={styles.input}
          value={settings.currencySymbol}
          onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
        >
          <option value="₦">₦ - Nigerian Naira</option>
          <option value="$">$ - US Dollar</option>
          <option value="£">£ - British Pound</option>
          <option value="€">€ - Euro</option>
          <option value="GH₵">GH₵ - Ghanaian Cedi</option>
          <option value="KSh">KSh - Kenyan Shilling</option>
        </select>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Receipt Footer Message</label>
        <textarea
          style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
          value={settings.receiptFooter}
          onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
          placeholder="Thank you for your purchase!"
        />
        <small style={styles.hint}>Use \n for new lines</small>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>System Check</h2>
      <p style={styles.stepDescription}>
        Let's verify that everything is connected properly.
      </p>
      
      <div style={styles.connectionList}>
        <div style={styles.connectionItem}>
          <div style={styles.connectionIcon}>
            {serverStatus === 'checking' && <span style={styles.spinner}>⏳</span>}
            {serverStatus === 'connected' && <span style={styles.checkmark}>✅</span>}
            {serverStatus === 'failed' && <span style={styles.error}>❌</span>}
          </div>
          <div style={styles.connectionInfo}>
            <strong>Server Connection</strong>
            <p style={styles.connectionStatus}>
              {serverStatus === 'checking' && 'Checking...'}
              {serverStatus === 'connected' && 'Connected to local server'}
              {serverStatus === 'failed' && 'Not connected - Server may not be running'}
            </p>
          </div>
        </div>
        
        <div style={styles.connectionItem}>
          <div style={styles.connectionIcon}>
            {dbStatus === 'checking' && <span style={styles.spinner}>⏳</span>}
            {dbStatus === 'connected' && <span style={styles.checkmark}>✅</span>}
            {dbStatus === 'failed' && <span style={styles.error}>❌</span>}
          </div>
          <div style={styles.connectionInfo}>
            <strong>Database Connection</strong>
            <p style={styles.connectionStatus}>
              {dbStatus === 'checking' && 'Checking...'}
              {dbStatus === 'connected' && 'PostgreSQL database connected'}
              {dbStatus === 'failed' && 'Not connected - Check database settings'}
            </p>
          </div>
        </div>
      </div>
      
      <button 
        style={styles.retryButton} 
        onClick={checkConnections}
        disabled={serverStatus === 'checking' || dbStatus === 'checking'}
      >
        🔄 Retry Connection Check
      </button>
      
      {(serverStatus === 'failed' || dbStatus === 'failed') && (
        <div style={styles.helpBox}>
          <h4 style={styles.helpTitle}>🔧 Troubleshooting Tips</h4>
          <ul style={styles.helpList}>
            <li>Make sure PostgreSQL is running</li>
            <li>Use the WumiKay Launcher to start the app</li>
            <li>Check if another application is using port 5000</li>
            <li>You can still proceed - some features may be limited</li>
          </ul>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div style={styles.stepContent}>
      <div style={styles.welcomeIcon}>🚀</div>
      <h2 style={styles.stepTitle}>You're All Set!</h2>
      <p style={styles.stepDescription}>
        Your WumiKay Ventures POS system is ready to use.
      </p>
      
      <div style={styles.summaryBox}>
        <h4 style={styles.summaryTitle}>Setup Summary</h4>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Business:</span>
          <span style={styles.summaryValue}>{settings.companyName}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Currency:</span>
          <span style={styles.summaryValue}>{settings.currencySymbol}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Server:</span>
          <span style={{
            ...styles.summaryValue,
            color: serverStatus === 'connected' ? '#10b981' : '#f59e0b'
          }}>
            {serverStatus === 'connected' ? 'Connected' : 'Offline Mode'}
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Database:</span>
          <span style={{
            ...styles.summaryValue,
            color: dbStatus === 'connected' ? '#10b981' : '#f59e0b'
          }}>
            {dbStatus === 'connected' ? 'Connected' : 'Will sync later'}
          </span>
        </div>
      </div>
      
      <div style={styles.quickTips}>
        <h4 style={styles.tipsTitle}>💡 Quick Tips</h4>
        <ul style={styles.tipsList}>
          <li><strong>F1</strong> - Start a new sale</li>
          <li><strong>F2</strong> - Print last receipt</li>
          <li><strong>F5</strong> - Refresh data</li>
          <li><strong>ESC</strong> - Cancel / Go back</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div style={styles.overlay}>
      <div style={styles.wizard}>
        {/* Header */}
        <div style={styles.header}>
          <img 
            src="/logo.png" 
            alt="WumiKay Ventures" 
            style={styles.logo}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <h1 style={styles.title}>Setup Wizard</h1>
        </div>
        
        {/* Step Indicator */}
        {renderStepIndicator()}
        
        {/* Step Content */}
        <div style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
        
        {/* Footer Navigation */}
        <div style={styles.footer}>
          <button 
            style={styles.skipButton}
            onClick={onSkip}
          >
            Skip Setup
          </button>
          
          <div style={styles.navButtons}>
            {currentStep > 1 && (
              <button style={styles.prevButton} onClick={prevStep}>
                ← Back
              </button>
            )}
            <button 
              style={styles.nextButton} 
              onClick={nextStep}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : currentStep === totalSteps ? 'Get Started →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)'
  },
  wizard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px',
    textAlign: 'center'
  },
  logo: {
    width: '60px',
    height: '60px',
    marginBottom: '12px',
    borderRadius: '12px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s ease'
  },
  stepLabel: {
    fontSize: '12px'
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  },
  stepContent: {
    textAlign: 'center'
  },
  welcomeIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '12px'
  },
  stepDescription: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: 1.6
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
    maxWidth: '400px',
    margin: '0 auto'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#374151'
  },
  featureIcon: {
    fontSize: '24px'
  },
  formGroup: {
    marginBottom: '16px',
    textAlign: 'left',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  connectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  connectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    textAlign: 'left'
  },
  connectionIcon: {
    fontSize: '32px'
  },
  connectionInfo: {
    flex: 1
  },
  connectionStatus: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#6b7280'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  checkmark: {},
  error: {},
  retryButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  helpBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left'
  },
  helpTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#92400e'
  },
  helpList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#78350f',
    lineHeight: 1.8
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  summaryTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#166534'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #dcfce7'
  },
  summaryLabel: {
    color: '#4b5563'
  },
  summaryValue: {
    fontWeight: 600,
    color: '#111827'
  },
  quickTips: {
    backgroundColor: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left'
  },
  tipsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#1e40af'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#1e3a8a',
    lineHeight: 1.8
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  skipButton: {
    padding: '10px 16px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  navButtons: {
    display: 'flex',
    gap: '12px'
  },
  prevButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#374151',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  nextButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
}

export default SetupWizard
