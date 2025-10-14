import React, { useState } from 'react'

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: 'WumiKay Ventures',
    companyEmail: 'Kayodeomowumii@gmail.com',
    companyPhone: '08033683156, 07050509775',
    companyAddress: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State',
    lowStockThreshold: 10,
    currency: 'NGN',
    currencySymbol: '₦',
    posChargeAmount: 150,
    taxRate: 0,
    receiptFooter: 'Thank you for your business!',
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

  const handleSave = () => {
    // In a real app, this would save to the database
    localStorage.setItem('wumikay-settings', JSON.stringify(settings))
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        companyName: 'WumiKay Ventures',
        companyEmail: 'Kayodeomowumii@gmail.com',
        companyPhone: '08033683156, 07050509775',
        companyAddress: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State',
        lowStockThreshold: 10,
        currency: 'NGN',
        currencySymbol: '₦',
        posChargeAmount: 150,
        taxRate: 0,
        receiptFooter: 'Thank you for your business!',
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
            />
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
                <option value="admin">Admin</option>
              </select>
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
            <button className="btn btn-outline">Export Data</button>
            <button className="btn btn-outline">Import Data</button>
            <button className="btn btn-outline">Create Backup</button>
          </div>
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
              <span className="info-value status-connected">Connected</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Backup:</span>
              <span className="info-value">Never</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Products:</span>
              <span className="info-value">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
