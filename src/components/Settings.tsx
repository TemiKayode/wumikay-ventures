import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface CompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  logoUrl?: string
}

interface SettingsProps {
  companyInfo: CompanyInfo
  onCompanyInfoUpdate: (info: CompanyInfo) => void
  currentUser?: { id: number; email: string; role: string } | null
}

const Settings: React.FC<SettingsProps> = ({ companyInfo, onCompanyInfoUpdate, currentUser }) => {
  // Check if current user is an admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.includes('admin')
  const [systemInfo, setSystemInfo] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lastBackup: 'Never',
    databaseStatus: 'Checking...'
  })
  const [settings, setSettings] = useState({
    companyName: companyInfo.name,
    companyEmail: companyInfo.email,
    companyPhone: companyInfo.phone,
    companyAddress: companyInfo.address,
    logoUrl: '/logo.png',
    brandColor: '#667eea',
    lowStockThreshold: 10,
    currency: 'NGN',
    currencySymbol: '₦',
    posChargeAmount: 150,
    taxRate: 0,
    receiptFooter: 'Thank you for shopping with WumiKay Ventures!\nWe appreciate your business.\nVisit us again!',
    themeSettings: 'system-default',
    receiptSettings: {
      showLogo: true,
      showCompanyInfo: true,
      showItemDetails: true,
      showTaxBreakdown: false,
      receiptWidth: '80mm',
      fontSize: '12px',
      printAutomatically: false
    },
    notifications: {
      lowStock: true,
      newOrders: true,
      dailyReports: false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    userManagement: {
      allowRegistration: true,
      requireEmailVerification: false,
      defaultUserRole: 'customer',
      sessionTimeout: 30,
      passwordPolicy: 'medium'
    },
    dataManagement: {
      autoBackup: false,
      backupFrequency: 'daily',
      dataRetention: 365,
      exportFormat: 'csv',
      allowDataExport: true,
      allowDataImport: true
    }
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('wumikay-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({
          ...prev,
          ...parsed
        }))
      } catch (error) {
        console.error('Error loading settings from localStorage:', error)
      }
    }
    
    // Load system info
    loadSystemInfo()
    
    // Check last backup
    const lastBackup = localStorage.getItem('wumikay-last-backup')
    if (lastBackup) {
      setSystemInfo(prev => ({ ...prev, lastBackup }))
    }
  }, []) // Only run on mount

  const loadSystemInfo = async () => {
    try {
      const products = await api.getProducts()
      const orders = await api.getOrders()
      setSystemInfo(prev => ({
        ...prev,
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        databaseStatus: 'Connected'
      }))
    } catch (error) {
      console.error('Error loading system info:', error)
      setSystemInfo(prev => ({
        ...prev,
        databaseStatus: 'Disconnected'
      }))
    }
  }

  // Update local settings when companyInfo prop changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      companyName: companyInfo.name,
      companyEmail: companyInfo.email,
      companyPhone: companyInfo.phone,
      companyAddress: companyInfo.address
    }))
  }, [companyInfo])

  const handleSave = () => {
    // Update company info in parent component
    onCompanyInfoUpdate({
      name: settings.companyName,
      email: settings.companyEmail,
      phone: settings.companyPhone,
      address: settings.companyAddress
    })
    
    // Save other settings to localStorage
    const otherSettings = {
      lowStockThreshold: settings.lowStockThreshold,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      posChargeAmount: settings.posChargeAmount,
      taxRate: settings.taxRate,
      receiptFooter: settings.receiptFooter,
      themeSettings: settings.themeSettings,
      receiptSettings: settings.receiptSettings,
      brandColor: settings.brandColor,
      logoUrl: settings.logoUrl,
      companyInfo: {
        name: settings.companyName,
        email: settings.companyEmail,
        phone: settings.companyPhone,
        address: settings.companyAddress
      },
      notifications: settings.notifications,
      userManagement: settings.userManagement,
      dataManagement: settings.dataManagement
    }
    localStorage.setItem('wumikay-settings', JSON.stringify(otherSettings))
    // Notify other parts of the app that settings changed
    try {
      window.dispatchEvent(new CustomEvent('wumikay-settings-changed', { detail: otherSettings }))
    } catch (e) {
      console.warn('Failed to dispatch settings changed event', e)
    }

    alert('Settings saved successfully!')
  }

  // Export Data Function
  const handleExportData = async () => {
    try {
      const products = await api.getProducts()
      const orders = await api.getOrders()
      
      const exportData = {
        exportDate: new Date().toISOString(),
        companyInfo: companyInfo,
        settings: settings,
        products: products || [],
        orders: orders || []
      }
      
      let fileContent: string
      let fileName: string
      let mimeType: string
      
      const format = settings.dataManagement.exportFormat
      
      if (format === 'json') {
        fileContent = JSON.stringify(exportData, null, 2)
        fileName = `wumikay-backup-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else if (format === 'csv') {
        // Export products as CSV
        const productHeaders = ['ID', 'Name', 'Description', 'Price', 'Quantity', 'Category', 'Barcode', 'Brand']
        const productRows = (products || []).map((p: any) => 
          [p.id, p.name, p.description || '', p.price, p.quantity, p.category, p.barcode || '', p.brand || ''].join(',')
        )
        fileContent = [productHeaders.join(','), ...productRows].join('\n')
        fileName = `wumikay-products-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      } else {
        // Default to JSON
        fileContent = JSON.stringify(exportData, null, 2)
        fileName = `wumikay-backup-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      }
      
      // Create and download file
      const blob = new Blob([fileContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert(`Data exported successfully as ${format.toUpperCase()}!`)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }
  
  // Import Data Function
  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.csv'
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const content = await file.text()
        
        if (file.name.endsWith('.json')) {
          const importData = JSON.parse(content)
          
          // Validate JSON structure
          if (!importData.products && !importData.orders) {
            alert('Invalid backup file format. Missing products or orders data.')
            return
          }
          
          const confirmImport = window.confirm(
            `This will import:\n` +
            `- ${importData.products?.length || 0} products\n` +
            `- ${importData.orders?.length || 0} orders\n\n` +
            `Company Info: ${importData.companyInfo?.name || 'N/A'}\n\n` +
            `Do you want to proceed?`
          )
          
          if (confirmImport) {
            // Update company info if present
            if (importData.companyInfo) {
              onCompanyInfoUpdate(importData.companyInfo)
            }
            
            // Update settings if present
            if (importData.settings) {
              localStorage.setItem('wumikay-settings', JSON.stringify(importData.settings))
            }
            
            alert('Data imported successfully! Note: Products and orders need to be imported via the database directly.')
          }
        } else if (file.name.endsWith('.csv')) {
          alert('CSV import is for viewing only. For full data import, please use JSON format.')
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    
    input.click()
  }
  
  // Create Backup Function
  const handleCreateBackup = async () => {
    try {
      const products = await api.getProducts()
      const orders = await api.getOrders()
      
      const backupData = {
        backupDate: new Date().toISOString(),
        version: '1.0.0',
        companyInfo: companyInfo,
        settings: settings,
        data: {
          products: products || [],
          orders: orders || [],
          totalProducts: products?.length || 0,
          totalOrders: orders?.length || 0
        }
      }
      
      // Create backup file
      const backupContent = JSON.stringify(backupData, null, 2)
      const fileName = `wumikay-full-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      
      const blob = new Blob([backupContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Update last backup time
      const backupTime = new Date().toLocaleString()
      localStorage.setItem('wumikay-last-backup', backupTime)
      setSystemInfo(prev => ({ ...prev, lastBackup: backupTime }))
      
      alert(`Backup created successfully!\n\nFile: ${fileName}\n\nContains:\n- ${backupData.data.totalProducts} products\n- ${backupData.data.totalOrders} orders`)
    } catch (error) {
      console.error('Backup error:', error)
      alert('Failed to create backup. Please try again.')
    }
  }

  // Clear Test Data Function - Removes all orders and test users
  const handleClearTestData = async () => {
    const confirmClear = window.confirm(
      '⚠️ CLEAR TEST DATA\n\n' +
      'This will permanently delete:\n' +
      '• All orders and order items\n' +
      '• All non-admin users\n\n' +
      'Products will be KEPT.\n' +
      'Admin user will be KEPT.\n\n' +
      'This action cannot be undone!\n\n' +
      'Are you sure you want to proceed?'
    )
    
    if (!confirmClear) return
    
    // Double confirmation for safety
    const doubleConfirm = window.confirm(
      '🚨 FINAL CONFIRMATION\n\n' +
      'You are about to delete ALL test data.\n\n' +
      'Click OK to proceed with clearing data.'
    )
    
    if (!doubleConfirm) return
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(
          '✅ Test Data Cleared Successfully!\n\n' +
          `Products remaining: ${result.productsRemaining}\n` +
          `Users remaining: ${result.usersRemaining} (admin only)\n\n` +
          'The app is now ready for production use.'
        )
        // Refresh system info
        loadSystemInfo()
      } else {
        alert('❌ Failed to clear test data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Clear test data error:', error)
      alert('❌ Failed to clear test data. Please ensure the server is running.')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultCompanyInfo = {
        name: 'WumiKay Ventures',
        email: 'Kayodeomowumii@gmail.com',
        phone: '08033683156, 07050509775',
        address: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State'
      }
      
      // Reset company info in parent
      onCompanyInfoUpdate(defaultCompanyInfo)
      
      setSettings({
        companyName: defaultCompanyInfo.name,
        companyEmail: defaultCompanyInfo.email,
        companyPhone: defaultCompanyInfo.phone,
        companyAddress: defaultCompanyInfo.address,
        logoUrl: '/logo.png',
        brandColor: '#667eea',
        lowStockThreshold: 10,
        currency: 'NGN',
        currencySymbol: '₦',
        posChargeAmount: 150,
        taxRate: 0,
        receiptFooter: 'Thank you for shopping with WumiKay Ventures!\nWe appreciate your business.\nVisit us again!',
        themeSettings: 'system-default',
        receiptSettings: {
          showLogo: true,
          showCompanyInfo: true,
          showItemDetails: true,
          showTaxBreakdown: false,
          receiptWidth: '80mm',
          fontSize: '12px',
          printAutomatically: false
        },
        notifications: {
          lowStock: true,
          newOrders: true,
          dailyReports: false,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        },
        userManagement: {
          allowRegistration: true,
          requireEmailVerification: false,
          defaultUserRole: 'customer',
          sessionTimeout: 30,
          passwordPolicy: 'medium'
        },
        dataManagement: {
          autoBackup: false,
          backupFrequency: 'daily',
          dataRetention: 365,
          exportFormat: 'csv',
          allowDataExport: true,
          allowDataImport: true
        }
      })
    }
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset to Default
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>

      <div className="settings-content">
        {/* Business Information */}
        <div className="settings-section">
          <h3>🏢 Business Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={settings.companyEmail}
                onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Numbers</label>
              <input
                type="tel"
                className="form-input"
                value={settings.companyPhone}
                onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                placeholder="08033683156, 07050509775"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                className="form-input"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})}
                maxLength={3}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">POS Charge Amount (₦)</label>
              <input
                type="number"
                className="form-input"
                value={settings.posChargeAmount}
                onChange={(e) => setSettings({...settings, posChargeAmount: parseInt(e.target.value)})}
                min="0"
                step="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Theme Settings</label>
              <select
                className="form-input"
                value={settings.themeSettings}
                onChange={(e) => setSettings({...settings, themeSettings: e.target.value})}
              >
                <option value="system-default">System Default</option>
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="auto">Auto (Follow System)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business Address</label>
            <textarea
              className="form-textarea"
              value={settings.companyAddress}
              onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
              rows={3}
            />
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="settings-section">
          <h3>📄 Receipt Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Receipt Width</label>
              <select
                className="form-input"
                value={settings.receiptSettings.receiptWidth}
                onChange={(e) => setSettings({
                  ...settings,
                  receiptSettings: {...settings.receiptSettings, receiptWidth: e.target.value}
                })}
              >
                <option value="58mm">58mm (Thermal)</option>
                <option value="80mm">80mm (Standard)</option>
                <option value="A4">A4 (Full Page)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Font Size</label>
              <select
                className="form-input"
                value={settings.receiptSettings.fontSize}
                onChange={(e) => setSettings({
                  ...settings,
                  receiptSettings: {...settings.receiptSettings, fontSize: e.target.value}
                })}
              >
                <option value="10px">Small (10px)</option>
                <option value="12px">Medium (12px)</option>
                <option value="14px">Large (14px)</option>
              </select>
            </div>
          </div>

          <div className="receipt-options">
            <h4>Receipt Content</h4>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.receiptSettings.showLogo}
                  onChange={(e) => setSettings({
                    ...settings,
                    receiptSettings: {...settings.receiptSettings, showLogo: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Show Company Logo</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.receiptSettings.showCompanyInfo}
                  onChange={(e) => setSettings({
                    ...settings,
                    receiptSettings: {...settings.receiptSettings, showCompanyInfo: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Show Company Information</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.receiptSettings.showItemDetails}
                  onChange={(e) => setSettings({
                    ...settings,
                    receiptSettings: {...settings.receiptSettings, showItemDetails: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Show Item Details</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.receiptSettings.printAutomatically}
                  onChange={(e) => setSettings({
                    ...settings,
                    receiptSettings: {...settings.receiptSettings, printAutomatically: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Auto-print Receipts</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Receipt Footer Message</label>
            <textarea
              className="form-textarea"
              value={settings.receiptFooter}
              onChange={(e) => setSettings({...settings, receiptFooter: e.target.value})}
              placeholder="Enter custom footer message for receipts..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
            <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              This message appears at the bottom of all printed receipts. Use \n for new lines.
            </small>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3>🔔 Notifications</h3>
          <div className="notification-settings">
            <h4>Alert Types</h4>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.lowStock}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, lowStock: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Low Stock Alerts</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.newOrders}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, newOrders: e.target.checked}
                  })}
                />
                <span className="checkbox-text">New Order Notifications</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyReports}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, dailyReports: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Daily Sales Reports</span>
              </label>
            </div>

            <h4>Notification Methods</h4>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, emailNotifications: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Email Notifications</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, smsNotifications: e.target.checked}
                  })}
                />
                <span className="checkbox-text">SMS Notifications</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, pushNotifications: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Push Notifications</span>
              </label>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="settings-section">
          <h3>👥 User Management</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default User Role</label>
              <select
                className="form-input"
                value={settings.userManagement.defaultUserRole}
                onChange={(e) => setSettings({
                  ...settings,
                  userManagement: {...settings.userManagement, defaultUserRole: e.target.value}
                })}
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
              </select>
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Note: Admin role is reserved for admin@wumikay.com only
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Session Timeout (minutes)</label>
              <input
                type="number"
                className="form-input"
                value={settings.userManagement.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  userManagement: {...settings.userManagement, sessionTimeout: parseInt(e.target.value)}
                })}
                min="5"
                max="480"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password Policy</label>
              <select
                className="form-input"
                value={settings.userManagement.passwordPolicy}
                onChange={(e) => setSettings({
                  ...settings,
                  userManagement: {...settings.userManagement, passwordPolicy: e.target.value}
                })}
              >
                <option value="weak">Weak (6+ characters)</option>
                <option value="medium">Medium (8+ chars, mixed case)</option>
                <option value="strong">Strong (8+ chars, numbers, symbols)</option>
              </select>
            </div>
          </div>

          <div className="user-options">
            <h4>Registration Settings</h4>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.userManagement.allowRegistration}
                  onChange={(e) => setSettings({
                    ...settings,
                    userManagement: {...settings.userManagement, allowRegistration: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Allow User Registration</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.userManagement.requireEmailVerification}
                  onChange={(e) => setSettings({
                    ...settings,
                    userManagement: {...settings.userManagement, requireEmailVerification: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Require Email Verification</span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h3>💾 Data Management</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Backup Frequency</label>
              <select
                className="form-input"
                value={settings.dataManagement.backupFrequency}
                onChange={(e) => setSettings({
                  ...settings,
                  dataManagement: {...settings.dataManagement, backupFrequency: e.target.value}
                })}
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data Retention (days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.dataManagement.dataRetention}
                onChange={(e) => setSettings({
                  ...settings,
                  dataManagement: {...settings.dataManagement, dataRetention: parseInt(e.target.value)}
                })}
                min="30"
                max="3650"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Export Format</label>
              <select
                className="form-input"
                value={settings.dataManagement.exportFormat}
                onChange={(e) => setSettings({
                  ...settings,
                  dataManagement: {...settings.dataManagement, exportFormat: e.target.value}
                })}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div className="data-options">
            <h4>Data Access</h4>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.dataManagement.autoBackup}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataManagement: {...settings.dataManagement, autoBackup: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Enable Automatic Backup</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.dataManagement.allowDataExport}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataManagement: {...settings.dataManagement, allowDataExport: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Allow Data Export</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.dataManagement.allowDataImport}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataManagement: {...settings.dataManagement, allowDataImport: e.target.checked}
                  })}
                />
                <span className="checkbox-text">Allow Data Import</span>
              </label>
            </div>
          </div>

          <div className="data-actions">
            <button 
              className="btn btn-outline"
              onClick={handleExportData}
              disabled={!settings.dataManagement.allowDataExport}
              title={!settings.dataManagement.allowDataExport ? 'Data export is disabled' : 'Export all data'}
            >
              📤 Export Data
            </button>
            <button 
              className="btn btn-outline"
              onClick={handleImportData}
              disabled={!settings.dataManagement.allowDataImport}
              title={!settings.dataManagement.allowDataImport ? 'Data import is disabled' : 'Import data from file'}
            >
              📥 Import Data
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCreateBackup}
              title="Create a full backup of all data"
            >
              💾 Create Backup
            </button>
          </div>
          
          {/* Clear Test Data Section - Admin Only */}
          {isAdmin && (
            <div className="danger-zone" style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'rgba(220, 53, 69, 0.1)', 
              borderRadius: '12px',
              border: '1px solid rgba(220, 53, 69, 0.3)'
            }}>
              <h4 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>🚨 Danger Zone (Admin Only)</h4>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Clear all test data to prepare the app for production use. 
                This will delete all orders and non-admin users while keeping your products.
              </p>
              <button 
                className="btn"
                onClick={handleClearTestData}
                style={{ 
                  background: '#dc3545', 
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Clear all test orders and non-admin users"
              >
                🗑️ Clear Test Data & Reset App
              </button>
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="settings-section">
          <h3>ℹ️ System Information</h3>
          <div className="system-info">
            <div className="info-item">
              <span className="info-label">Application Version:</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Database Status:</span>
              <span className={`info-value ${systemInfo.databaseStatus === 'Connected' ? 'status-connected' : 'status-disconnected'}`}>
                {systemInfo.databaseStatus}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Backup:</span>
              <span className="info-value">{systemInfo.lastBackup}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Products:</span>
              <span className="info-value">{systemInfo.totalProducts}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Orders:</span>
              <span className="info-value">{systemInfo.totalOrders}</span>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-outline"
              onClick={loadSystemInfo}
              title="Refresh system information"
            >
              🔄 Refresh System Info
            </button>
          </div>
        </div>

        {/* Author / Trademark */}
        <div className="settings-section app-trademark-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <p className="app-trademark-text" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>WumiKay Ventures</span>
            {' © '}{new Date().getFullYear()}. All rights reserved. Trademark of WumiKay Ventures.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
