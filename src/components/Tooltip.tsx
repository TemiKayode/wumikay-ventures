import React, { useState, useRef } from 'react'

interface TooltipProps {
  children: React.ReactNode
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  text, 
  position = 'top',
  delay = 300 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      zIndex: 10000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden',
      transition: 'opacity 0.2s ease, visibility 0.2s ease',
      pointerEvents: 'none'
    }

    switch (position) {
      case 'top':
        return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }
      case 'bottom':
        return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }
      case 'left':
        return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' }
      case 'right':
        return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' }
      default:
        return base
    }
  }

  const getArrowStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      border: '6px solid transparent'
    }

    switch (position) {
      case 'top':
        return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', borderTopColor: '#1f2937' }
      case 'bottom':
        return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderBottomColor: '#1f2937' }
      case 'left':
        return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', borderLeftColor: '#1f2937' }
      case 'right':
        return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', borderRightColor: '#1f2937' }
      default:
        return base
    }
  }

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div style={getPositionStyles()}>
        {text}
        <div style={getArrowStyles()} />
      </div>
    </div>
  )
}

// Help icon with tooltip
interface HelpTooltipProps {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'top' }) => {
  return (
    <Tooltip text={text} position={position}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        height: '18px',
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
        borderRadius: '50%',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'help',
        marginLeft: '6px'
      }}>
        ?
      </span>
    </Tooltip>
  )
}

export default Tooltip
