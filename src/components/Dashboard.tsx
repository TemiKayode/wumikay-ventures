import React, { useState, useEffect } from 'react'
import { api, Order, Product } from '../lib/api'
import { printReceipt, generateReceiptData } from '../utils/receiptPrinter'
import Tooltip, { HelpTooltip } from './Tooltip'
import { getPendingCount } from '../services/offlineQueue'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  recentOrders: Order[]
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  lowStockProducts: Product[]
}

interface DashboardProps {
  onViewOrder?: (orderId: number) => void
  onNewSale?: () => void
  onViewOrders?: () => void
  onAddProduct?: () => void
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
    logoUrl?: string
  }
}

const Dashboard: React.FC<DashboardProps> = ({ onViewOrder, onNewSale, onViewOrders, onAddProduct, companyInfo }) => {
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
    topProducts: [],
    lowStockProducts: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
    setOfflineQueueCount(getPendingCount())
    
    // Refresh dashboard data every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadDashboardData()
      setOfflineQueueCount(getPendingCount())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const defaultCompanyInfo: DashboardProps['companyInfo'] = {
    name: 'WumiKay Ventures',
    address: 'Beside Enuogbope Hospital, Kobongbogboe, Osogbo, Osun State',
    phone: '08033683156, 07050509775',
    email: 'Kayodeomowumii@gmail.com'
  }

  const company = companyInfo || defaultCompanyInfo

  const loadDashboardData = async () => {
    try {
      // Load orders
      const orders = await api.getOrders()

      // Load products
      const products = await api.getProducts()

      // Load customers (from orders)
      const uniqueCustomers = new Set(orders?.map(order => order.customer_email).filter(Boolean) || [])
      
      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const lowStockProducts = products?.filter(product => product.quantity <= product.low_stock_threshold) || []

      // Calculate top products from actual order items
      const productSales = new Map<string, { quantity: number; revenue: number }>()
      
      orders?.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            const productName = item.product_name
            const existing = productSales.get(productName) || { quantity: 0, revenue: 0 }
            productSales.set(productName, {
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + item.subtotal
            })
          })
        }
      })
      
      // Convert to array and sort by revenue (descending), take top 4
      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
      
      // If no products sold yet, show empty array
      if (topProducts.length === 0) {
        topProducts.push(
          { name: 'No sales yet', quantity: 0, revenue: 0 }
        )
      }

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalProducts: products?.length || 0,
        totalCustomers: uniqueCustomers.size,
        recentOrders: orders?.slice(0, 5) || [],
        topProducts,
        lowStockProducts
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty stats on error to prevent crashes
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
        recentOrders: [],
        topProducts: [],
        lowStockProducts: []
      })
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOrderClick = async (order: Order) => {
    try {
      // Fetch full order details with items if not already loaded
      let fullOrder = order
      if (!order.items || order.items.length === 0) {
        fullOrder = await api.getOrder(order.id)
      }
      setSelectedOrder(fullOrder)
      setShowOrderModal(true)
    } catch (error) {
      console.error('Error loading order details:', error)
      alert('Failed to load order details')
    }
  }

  const handlePrintReceipt = (order: Order) => {
    try {
      // Convert order items to cart format for receipt generation
      const cartItems = order.items?.map(item => ({
        id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity
      })) || []

      if (cartItems.length === 0) {
        alert('Cannot print receipt: Order has no items')
        return
      }

      const receiptData = generateReceiptData(order, cartItems, company)
      printReceipt(receiptData)
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('Failed to print receipt. Please try again.')
    }
  }

  const handleViewFullDetails = () => {
    if (selectedOrder && onViewOrder) {
      onViewOrder(selectedOrder.id)
      setShowOrderModal(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={company.logoUrl || '/logo.png'} 
              alt="WumiKay Ventures" 
              style={{ 
                width: '60px', 
                height: '60px', 
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <h1>Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome to {company.name} Management System
              </p>
            </div>
          </div>
          <button 
            className="btn btn-outline"
            onClick={() => loadDashboardData()}
            disabled={loading}
            title="Refresh dashboard"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatPrice(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Products</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalCustomers}</h3>
            <p>Customers</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '0'
      }}>
        <button
          onClick={onNewSale}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>🛒</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>New Sale</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Press F1</span>
        </button>

        <button
          onClick={onViewOrders}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>📋</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>View Orders</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{stats.totalOrders} orders</span>
        </button>

        <button
          onClick={onAddProduct}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            minHeight: '120px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>➕</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add Product</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{stats.totalProducts} products</span>
        </button>

        <Tooltip text="View products with low stock levels" position="bottom">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1.5rem',
              background: stats.lowStockProducts.length > 0 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              minHeight: '120px',
              boxShadow: stats.lowStockProducts.length > 0 
                ? '0 4px 15px rgba(239, 68, 68, 0.3)'
                : '0 4px 15px rgba(107, 114, 128, 0.3)'
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>⚠️</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Low Stock</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {stats.lowStockProducts.length} items
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Offline Queue Alert */}
      {offlineQueueCount > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📤</span>
          <div>
            <strong style={{ color: '#92400e' }}>
              {offlineQueueCount} order{offlineQueueCount > 1 ? 's' : ''} pending sync
            </strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#78350f' }}>
              These orders were created while offline and will sync when connected.
            </p>
          </div>
        </div>
      )}

      {/* Charts and Tables */}
      <div className="dashboard-content">
        <div className="dashboard-row">
          {/* Recent Orders */}
          <div className="dashboard-card">
            <h3>Recent Orders</h3>
            <div className="orders-list">
              {stats.recentOrders.length === 0 ? (
                <div className="text-center" style={{ padding: '1rem', color: '#666' }}>
                  No recent orders
                </div>
              ) : (
                stats.recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="order-item clickable-order"
                    onClick={() => handleOrderClick(order)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view details and print receipt"
                  >
                    <div className="order-info">
                      <span className="order-number">#{order.order_number}</span>
                      <span className="order-customer">{order.customer_name}</span>
                    </div>
                    <div className="order-amount">{formatPrice(order.total_amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="dashboard-card">
            <h3>Top Products</h3>
            <div className="products-list">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-quantity">{product.quantity} sold</span>
                  </div>
                  <div className="product-revenue">{formatPrice(product.revenue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockProducts.length > 0 && (
          <div className="dashboard-card alert-card">
            <h3>⚠️ Low Stock Alert</h3>
            <div className="low-stock-list">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="low-stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className="stock-quantity">{product.quantity} left</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.order_number}</h3>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            
            <div className="order-details-content">
              <div className="order-detail-section">
                <h4>Customer Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedOrder.customer_name}</span>
                </div>
                {selectedOrder.customer_email && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedOrder.customer_email}</span>
                  </div>
                )}
                {selectedOrder.customer_phone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedOrder.customer_phone}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(selectedOrder.order_date)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-badge ${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="order-detail-section">
                  <h4>Order Items</h4>
                  <div className="order-items-table">
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatPrice(item.unit_price)}</td>
                            <td>{formatPrice(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="order-detail-section">
                <h4>Order Summary</h4>
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">{formatPrice(selectedOrder.subtotal_amount || 0)}</span>
                </div>
                {selectedOrder.pos_charge > 0 && (
                  <div className="summary-row">
                    <span className="summary-label">POS Charge:</span>
                    <span className="summary-value">{formatPrice(selectedOrder.pos_charge)}</span>
                  </div>
                )}
                <div className="summary-row total-row">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Payment Mode:</span>
                  <span className="summary-value">{selectedOrder.payment_mode?.toUpperCase() || 'CASH'}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="order-detail-section">
                  <h4>Notes</h4>
                  <p style={{ color: '#666', fontStyle: 'italic' }}>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-outline"
                onClick={handleViewFullDetails}
              >
                View Full Details
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handlePrintReceipt(selectedOrder)}
              >
                🖨️ Print Receipt
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
