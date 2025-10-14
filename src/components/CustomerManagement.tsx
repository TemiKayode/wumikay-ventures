import React, { useState, useEffect } from 'react'
import { supabase, Order } from '../lib/supabase'

interface Customer {
  email: string
  name: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  orders: Order[]
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })

      if (error) throw error

      // Group orders by customer
      const customerMap = new Map<string, Customer>()
      
      orders?.forEach(order => {
        const email = order.customer_email || 'unknown@example.com'
        const name = order.customer_name
        const phone = order.customer_phone

        if (!customerMap.has(email)) {
          customerMap.set(email, {
            email,
            name,
            phone,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.order_date,
            orders: []
          })
        }

        const customer = customerMap.get(email)!
        customer.totalOrders += 1
        customer.totalSpent += order.total_amount
        customer.orders.push(order)
        
        // Update last order date if this order is more recent
        if (new Date(order.order_date) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.order_date
        }
      })

      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent))
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    )
  }

  return (
    <div className="customer-management">
      <div className="page-header">
        <h1>Customer Management</h1>
        <div className="customer-stats">
          <span className="stat-item">Total Customers: {customers.length}</span>
        </div>
      </div>

      <div className="customers-grid">
        {customers.map((customer) => (
          <div key={customer.email} className="customer-card">
            <div className="customer-header">
              <div className="customer-avatar">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="customer-info">
                <h3>{customer.name}</h3>
                <p>{customer.email}</p>
                {customer.phone && <p>{customer.phone}</p>}
              </div>
            </div>
            
            <div className="customer-stats">
              <div className="stat">
                <span className="stat-label">Orders</span>
                <span className="stat-value">{customer.totalOrders}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Spent</span>
                <span className="stat-value">{formatPrice(customer.totalSpent)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Last Order</span>
                <span className="stat-value">{formatDate(customer.lastOrderDate)}</span>
              </div>
            </div>

            <div className="customer-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setSelectedCustomer(customer)}
              >
                View Orders
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCustomer.name}'s Orders</h3>
              <button className="modal-close" onClick={() => setSelectedCustomer(null)}>×</button>
            </div>
            
            <div className="customer-orders">
              <div className="customer-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Orders:</span>
                  <span className="summary-value">{selectedCustomer.totalOrders}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Spent:</span>
                  <span className="summary-value">{formatPrice(selectedCustomer.totalSpent)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Average Order:</span>
                  <span className="summary-value">
                    {formatPrice(selectedCustomer.totalSpent / selectedCustomer.totalOrders)}
                  </span>
                </div>
              </div>

              <div className="orders-list">
                {selectedCustomer.orders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <span className="order-number">#{order.order_number}</span>
                      <span className="order-date">{formatDate(order.order_date)}</span>
                      <span className={`order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-amount">{formatPrice(order.total_amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerManagement
