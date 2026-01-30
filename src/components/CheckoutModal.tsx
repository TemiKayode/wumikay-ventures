import React, { useState, useEffect } from 'react'

interface CheckoutModalProps {
  onClose: () => void
  onCheckout: (customerInfo: any) => void
  total: number
  posChargeAmount?: number
}

const GUEST_NAME = 'Guest'
const GUEST_EMAIL = 'guest@checkout.local'

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onCheckout, total, posChargeAmount = 150 }) => {
  const [isGuest, setIsGuest] = useState(true)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    paymentMode: 'cash' as 'cash' | 'pos',
    amountPaid: 0,
    printBothReceipts: true
  })
  const [loading, setLoading] = useState(false)

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const posCharge = customerInfo.paymentMode === 'pos' ? posChargeAmount : 0
  const grandTotal = total + posCharge
  
  // Calculate change or balance
  const amountPaid = parseFloat(String(customerInfo.amountPaid)) || 0
  const change = amountPaid - grandTotal
  const balanceDue = grandTotal - amountPaid

  // Set default amount paid to grand total when it changes
  useEffect(() => {
    if (customerInfo.amountPaid === 0) {
      setCustomerInfo(prev => ({ ...prev, amountPaid: grandTotal }))
    }
  }, [grandTotal])

  const handleAmountPaidChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setCustomerInfo({ ...customerInfo, amountPaid: numValue })
  }

  const setFullPayment = () => {
    setCustomerInfo({ ...customerInfo, amountPaid: grandTotal })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isGuest && (!customerInfo.name?.trim() || !customerInfo.email?.trim())) {
      alert('Please fill in customer name and email, or choose Guest checkout.')
      return
    }
    if (amountPaid <= 0) {
      alert('Please enter amount paid')
      return
    }

    const name = isGuest ? GUEST_NAME : customerInfo.name.trim()
    const email = isGuest ? GUEST_EMAIL : customerInfo.email.trim()
    const phone = isGuest ? '' : (customerInfo.phone?.trim() || '')

    setLoading(true)
    try {
      await onCheckout({
        ...customerInfo,
        name,
        email,
        phone,
        amountPaid: amountPaid,
        amountDue: balanceDue > 0 ? balanceDue : 0,
        change: change > 0 ? change : 0,
        paymentStatus: amountPaid >= grandTotal ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid')
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay checkout-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="modal-content checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="checkout-title" className="modal-title">Checkout</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="checkout-summary checkout-summary-prominent">
          <h4 className="checkout-summary-title">Order Summary</h4>
          <div className="order-breakdown">
            <div className="breakdown-item">
              <span>Subtotal:</span>
              <span className="breakdown-value">{formatPrice(total)}</span>
            </div>
            {customerInfo.paymentMode === 'pos' && (
              <div className="breakdown-item pos-charge">
                <span>POS Charge:</span>
                <span className="breakdown-value">{formatPrice(posChargeAmount)}</span>
              </div>
            )}
            <div className="breakdown-item breakdown-total">
              <span>Total:</span>
              <span className="breakdown-value">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-customer-type">
            <span className="checkout-customer-type-label">Customer type</span>
            <div className="checkout-customer-type-options">
              <label className={`checkout-type-option ${isGuest ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="customerType"
                  checked={isGuest}
                  onChange={() => setIsGuest(true)}
                />
                <span>Guest</span>
              </label>
              <label className={`checkout-type-option ${!isGuest ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="customerType"
                  checked={!isGuest}
                  onChange={() => setIsGuest(false)}
                />
                <span>Customer</span>
              </label>
            </div>
          </div>

          {!isGuest && (
            <>
              <div className="form-group">
                <label className="form-label checkout-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label className="form-label checkout-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="Enter customer email"
                />
              </div>
              <div className="form-group">
                <label className="form-label checkout-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </>
          )}

          <div className="form-group checkout-payment-mode-group">
            <label className="form-label checkout-label">Payment Mode *</label>
            <div className="payment-mode-selection">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMode"
                  value="cash"
                  checked={customerInfo.paymentMode === 'cash'}
                  onChange={(e) => setCustomerInfo({...customerInfo, paymentMode: e.target.value as 'cash' | 'pos'})}
                />
                <span className="payment-label">
                  <span className="payment-icon">💵</span>
                  <span className="payment-text">
                    <strong>Cash</strong>
                    <small>No additional charges</small>
                  </span>
                </span>
              </label>
              
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMode"
                  value="pos"
                  checked={customerInfo.paymentMode === 'pos'}
                  onChange={(e) => setCustomerInfo({...customerInfo, paymentMode: e.target.value as 'cash' | 'pos'})}
                />
                <span className="payment-label">
                  <span className="payment-icon">💳</span>
                  <span className="payment-text">
                    <strong>POS</strong>
                    <small>+₦{posChargeAmount.toLocaleString()} charge</small>
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Amount Paid Section */}
          <div style={{ 
            background: '#f0fdf4', 
            border: '2px solid #22c55e', 
            borderRadius: '12px', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold', color: '#166534' }}>
                💰 Amount Paid by Customer *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  value={customerInfo.amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  min="0"
                  step="0.01"
                  style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    flex: 1 
                  }}
                  required
                />
                <button 
                  type="button" 
                  onClick={setFullPayment}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Full Payment
                </button>
              </div>
            </div>

            {/* Change or Balance Display */}
            {amountPaid > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRadius: '8px',
                background: change >= 0 ? '#dcfce7' : '#fef3c7',
                marginTop: '0.5rem'
              }}>
                {change >= 0 ? (
                  <>
                    <span style={{ fontWeight: '600', color: '#166534' }}>Change to Give:</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#166534' }}>
                      {formatPrice(change)}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: '600', color: '#92400e' }}>Balance Due:</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#dc2626' }}>
                      {formatPrice(balanceDue)}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Payment Status Badge */}
            {amountPaid > 0 && (
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                {amountPaid >= grandTotal ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#22c55e',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    ✓ FULLY PAID
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#f59e0b',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    ⚠ PARTIAL PAYMENT
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Order Notes</label>
            <textarea
              className="form-textarea"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
              placeholder="Any special instructions for the order"
            />
          </div>

          {/* Print Options */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: '#f3f4f6',
              borderRadius: '8px'
            }}>
              <input
                type="checkbox"
                checked={customerInfo.printBothReceipts}
                onChange={(e) => setCustomerInfo({...customerInfo, printBothReceipts: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem' }}>
                🧾 Print both receipts (Admin copy + Customer copy)
              </span>
            </label>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Processing...' : `Complete Sale (${formatPrice(grandTotal)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutModal
