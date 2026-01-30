import React, { useState, useEffect, useCallback, useRef } from 'react'

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  minLength?: number
  maxDelay?: number
  enabled?: boolean
}

export const useBarcodeScanner = (options: BarcodeScannerOptions) => {
  const { 
    onScan, 
    minLength = 4, 
    maxDelay = 50,  // Max milliseconds between keystrokes
    enabled = true 
  } = options
  
  const bufferRef = useRef<string>('')
  const lastKeyTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const processBuffer = useCallback(() => {
    const barcode = bufferRef.current.trim()
    if (barcode.length >= minLength) {
      console.log('Barcode scanned:', barcode)
      onScan(barcode)
    }
    bufferRef.current = ''
  }, [minLength, onScan])
  
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Ignore if focus is on a text input (except for Enter key)
    const target = event.target as HTMLElement
    const isTextInput = target.tagName === 'INPUT' && 
                        (target as HTMLInputElement).type === 'text'
    
    // Allow barcode scanning in search inputs
    const isSearchInput = isTextInput && 
                          (target.id === 'barcode-input' || 
                           target.classList.contains('barcode-enabled'))
    
    const now = Date.now()
    const timeDiff = now - lastKeyTimeRef.current
    
    // If too much time has passed, reset the buffer
    if (timeDiff > maxDelay && bufferRef.current.length > 0) {
      bufferRef.current = ''
    }
    
    lastKeyTimeRef.current = now
    
    // Handle Enter key - process the buffer
    if (event.key === 'Enter') {
      if (bufferRef.current.length >= minLength) {
        event.preventDefault()
        processBuffer()
      }
      return
    }
    
    // Only capture printable characters
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      bufferRef.current += event.key
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Set timeout to process buffer if no more keystrokes
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length >= minLength) {
          processBuffer()
        } else {
          bufferRef.current = ''
        }
      }, 100)
    }
  }, [enabled, maxDelay, minLength, processBuffer])
  
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keypress', handleKeyPress)
    }
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, handleKeyPress])
  
  // Manual scan input
  const [manualBarcode, setManualBarcode] = useState('')
  
  const handleManualSubmit = useCallback(() => {
    if (manualBarcode.length >= minLength) {
      onScan(manualBarcode)
      setManualBarcode('')
    }
  }, [manualBarcode, minLength, onScan])
  
  return {
    manualBarcode,
    setManualBarcode,
    handleManualSubmit,
    clearBuffer: () => { bufferRef.current = '' }
  }
}

// Barcode Scanner Input Component
interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export const BarcodeScannerInput: React.FC<BarcodeScannerInputProps> = ({
  onScan,
  placeholder = 'Scan barcode or enter manually...',
  style
}) => {
  const [value, setValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onScan(value.trim())
      setValue('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
      <input
        ref={inputRef}
        id="barcode-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="barcode-enabled"
        style={{
          flex: 1,
          padding: '12px 16px',
          fontSize: '15px',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          ...style
        }}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      />
      <button
        type="submit"
        style={{
          padding: '12px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📷 Scan
      </button>
    </form>
  )
}

export default useBarcodeScanner
