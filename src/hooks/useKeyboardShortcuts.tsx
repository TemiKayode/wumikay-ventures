import React, { useEffect, useCallback } from 'react'

interface ShortcutHandlers {
  onNewSale?: () => void
  onPrintLastReceipt?: () => void
  onRefreshData?: () => void
  onCancel?: () => void
  onSearch?: () => void
  onSave?: () => void
  onDelete?: () => void
  onHelp?: () => void
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers, enabled: boolean = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable
    
    // Allow F-keys and Escape even in input fields
    const isFunctionKey = event.key.startsWith('F') || event.key === 'Escape'
    
    if (isInputField && !isFunctionKey) return
    
    switch (event.key) {
      case 'F1':
        event.preventDefault()
        handlers.onNewSale?.()
        break
        
      case 'F2':
        event.preventDefault()
        handlers.onPrintLastReceipt?.()
        break
        
      case 'F5':
        event.preventDefault()
        handlers.onRefreshData?.()
        break
        
      case 'Escape':
        handlers.onCancel?.()
        break
        
      case 'F3':
        event.preventDefault()
        handlers.onSearch?.()
        break
        
      case 'F10':
        event.preventDefault()
        handlers.onHelp?.()
        break
        
      // Ctrl+S for save
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          handlers.onSave?.()
        }
        break
        
      // Ctrl+P for print
      case 'p':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          handlers.onPrintLastReceipt?.()
        }
        break
        
      // Delete key
      case 'Delete':
        if (!isInputField) {
          handlers.onDelete?.()
        }
        break
    }
  }, [enabled, handlers])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827'
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280'
  },
  content: {
    padding: '16px 24px'
  },
  shortcutRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  key: {
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    fontFamily: 'monospace',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 0 #e5e7eb'
  },
  action: {
    color: '#4b5563',
    fontSize: '14px'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: '0 0 16px 16px'
  },
  hint: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center'
  }
}

// Show keyboard shortcuts help
export const KeyboardShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const shortcuts = [
    { key: 'F1', action: 'Start New Sale' },
    { key: 'F2', action: 'Print Last Receipt' },
    { key: 'F3', action: 'Focus Search' },
    { key: 'F5', action: 'Refresh Data' },
    { key: 'F10', action: 'Show Help' },
    { key: 'Ctrl+S', action: 'Save Changes' },
    { key: 'Ctrl+P', action: 'Print' },
    { key: 'Escape', action: 'Cancel / Close' }
  ]
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={styles.content}>
          {shortcuts.map(({ key, action }) => (
            <div key={key} style={styles.shortcutRow}>
              <kbd style={styles.key}>{key}</kbd>
              <span style={styles.action}>{action}</span>
            </div>
          ))}
        </div>
        <div style={styles.footer}>
          <p style={styles.hint}>Press Escape to close this dialog</p>
        </div>
      </div>
    </div>
  )
}

export default useKeyboardShortcuts
