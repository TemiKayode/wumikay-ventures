import React from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface ShoppingCartProps {
  cart: CartItem[]
  onUpdateQuantity: (id: number, quantity: number) => void
  onCheckout: () => void
  total: number
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ 
  cart, 
  onUpdateQuantity, 
  onCheckout, 
  total 
}) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const grandTotal = total

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h3 className="cart-title">Shopping Cart</h3>
        <span className="cart-count">({cart.length} items)</span>
      </div>
      
      {cart.length === 0 ? (
        <div className="text-center" style={{ padding: '2rem 0' }}>
          <p style={{ color: '#666' }}>Your cart is empty</p>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>
            Add some products to get started
          </p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <div className="cart-item-placeholder">
                    <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>📦</span>
                  </div>
                </div>
                
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatPrice(item.price)} each</div>
                </div>
                
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-success w-100"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ShoppingCart
