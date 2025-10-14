import React, { useState } from 'react'

interface CheckoutModalProps {
  onClose: () => void
  onCheckout: (customerInfo: any) => void
  total: number
  posChargeAmount?: number
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onCheckout, total, posChargeAmount = 150 }) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    paymentMode: 'cash' as 'cash' | 'pos'
  })
  const [loading, setLoading] = useState(false)

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const posCharge = customerInfo.paymentMode === 'pos' ? posChargeAmount : 0
  const grandTotal = total + posCharge

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerInfo.name || !customerInfo.email) {
      alert('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      await onCheckout(customerInfo)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Checkout</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="checkout-summary mb-3">
          <h4>Order Summary</h4>
          <div className="order-breakdown">
            <div className="breakdown-item">
              <span>Subtotal:</span>
              <span>{formatPrice(total)}</span>
            </div>
            {customerInfo.paymentMode === 'pos' && (
              <div className="breakdown-item pos-charge">
                <span>POS Charge:</span>
                <span>{formatPrice(posChargeAmount)}</span>
              </div>
            )}
            <div className="breakdown-item total">
              <span>Total:</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              required
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
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
          
          <div className="form-group">
            <label className="form-label">Order Notes</label>
            <textarea
              className="form-textarea"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
              placeholder="Any special instructions for your order"
            />
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
            >
              {loading ? 'Processing...' : `Place Order (${formatPrice(grandTotal)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutModal
