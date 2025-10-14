import React from 'react'
import { Order } from '../lib/supabase'
import { printReceipt, generateReceiptData } from '../utils/receiptPrinter'

interface OrderHistoryProps {
  orders: Order[]
  onPrintReceipt: (orderId: number) => void
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onPrintReceipt, companyInfo }) => {
  console.log('OrderHistory: Received orders:', orders?.length || 0)
  console.log('OrderHistory: Orders data:', orders)
  
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-pending'
    }
  }

  const handlePrintReceipt = (order: Order) => {
    // Convert order items to cart format for receipt generation
    const cartItems = order.items?.map(item => ({
      id: item.product_id,
      name: item.product_name,
      price: item.unit_price,
      quantity: item.quantity
    })) || []

    const receiptData = generateReceiptData(order, cartItems, companyInfo)
    printReceipt(receiptData)
  }

  return (
    <div className="order-history">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Order History</h2>
        <span className="text-muted">{orders.length} orders</span>
      </div>
      
          {orders.length === 0 ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <img src="/logo.png" alt="No orders" style={{ width: '60px', height: '60px', opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>No Orders Yet</h3>
              <p style={{ color: '#999' }}>Your order history will appear here</p>
            </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-number">#{order.order_number}</div>
                  <div className="order-date">{formatDate(order.order_date)}</div>
                </div>
                <div className="order-status-container">
                  <span className={`order-status ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="order-details">
                <div className="order-customer">
                  <strong>Customer:</strong> {order.customer_name}
                </div>
                {order.customer_email && (
                  <div className="order-email">
                    <strong>Email:</strong> {order.customer_email}
                  </div>
                )}
                {order.customer_phone && (
                  <div className="order-phone">
                    <strong>Phone:</strong> {order.customer_phone}
                  </div>
                )}
                {order.notes && (
                  <div className="order-notes">
                    <strong>Notes:</strong> {order.notes}
                  </div>
                )}
              </div>
              
              {order.items && order.items.length > 0 && (
                <div className="order-items">
                  <h4>Items:</h4>
                  <div className="items-list">
                    {order.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.product_name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.total_amount - order.tax_amount)}</span>
                </div>
                <div className="total-row">
                  <span>Tax:</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => handlePrintReceipt(order)}
                >
                  🖨️ Print Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
