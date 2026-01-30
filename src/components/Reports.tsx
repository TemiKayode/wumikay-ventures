import React, { useState, useEffect, useCallback } from 'react'
import { api, Order, Product } from '../lib/api'

interface ReportData {
  totalRevenue: number
  totalCollected: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
  orderStatusBreakdown: Array<{ status: string; count: number }>
  profitAnalysis: {
    totalCost: number
    totalRevenue: number
    profit: number
    profitMargin: number
    currentInventoryValue: number
  }
  // Payment tracking
  outstandingPayments: {
    totalOutstanding: number
    partialPayments: number
    unpaidOrders: number
    orders: Array<{
      orderNumber: string
      customerName: string
      customerEmail?: string
      customerPhone?: string
      totalAmount: number
      amountPaid: number
      amountDue: number
      orderDate: string
    }>
  }
  // Daily/Weekly breakdown
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
  // Current stock (after reduction when sold)
  currentStock: Array<{ name: string; quantity: number; category: string; brand?: string; price?: number }>
  // Total stock for admin
  totalUnitsInStock: number
  totalProductLines: number
}

interface ReportsProps {
  orders?: Order[]
  onRefresh?: () => void
}

const Reports: React.FC<ReportsProps> = ({ orders: ordersFromApp, onRefresh }) => {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalCollected: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    monthlyRevenue: [],
    orderStatusBreakdown: [],
    profitAnalysis: {
      totalCost: 0,
      totalRevenue: 0,
      profit: 0,
      profitMargin: 0,
      currentInventoryValue: 0
    },
    outstandingPayments: {
      totalOutstanding: 0,
      partialPayments: 0,
      unpaidOrders: 0,
      orders: []
    },
    dailyRevenue: [],
    currentStock: [],
    totalUnitsInStock: 0,
    totalProductLines: 0
  })
  const [reportView, setReportView] = useState<'summary' | 'outstanding' | 'graphical'>('summary')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  // Default: "All time" so Reports always show data that matches Order History
  const getDefaultDateRange = () => {
    const end = new Date()
    return {
      start: '2020-01-01',
      end: end.toISOString().split('T')[0]
    }
  }
  const getLast12MonthsRange = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 12)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }
  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // Get order date as YYYY-MM-DD (local) for consistent filtering; invalid/missing => include order
  const getOrderDateStr = (orderDate: string | undefined): string | null => {
    if (orderDate == null || orderDate === '') return null
    const d = new Date(orderDate)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const loadReportData = useCallback(async () => {
    try {
      // Always fetch from API so desktop app gets data (same source as Order History)
      let allOrders: Order[] = []
      try {
        allOrders = await api.getOrders() || []
      } catch (fetchErr) {
        console.warn('Reports: api.getOrders failed, using orders from App', fetchErr)
        allOrders = Array.isArray(ordersFromApp) ? ordersFromApp : []
      }
      // Filter by date range; include orders with missing/invalid date so we never hide data
      const orders: Order[] = allOrders.filter((order: Order) => {
        const orderDateStr = getOrderDateStr(order.order_date)
        if (orderDateStr == null) return true // include if date missing/invalid
        return orderDateStr >= dateRange.start && orderDateStr <= dateRange.end
      })

      // Helper to get numeric values (API/DB may return strings)
      const num = (v: any) => (v != null && v !== '') ? parseFloat(String(v)) : 0
      const orderTotal = (o: Order) => num((o as any).total_amount ?? o.total_amount)
      const orderPaid = (o: Order) => num((o as any).amount_paid)
      const orderDue = (o: Order) => num((o as any).amount_due)

      // Load products for profit analysis
      const products: Product[] = await api.getProducts() || []

      // Calculate basic stats (for selected date range)
      const totalRevenue = orders?.reduce((sum, order) => sum + orderTotal(order), 0) || 0
      const totalCollected = orders?.reduce((sum, order) => sum + (orderPaid(order) || orderTotal(order)), 0) || 0
      const totalOrders = orders?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate order status breakdown
      const statusCounts = new Map<string, number>()
      orders?.forEach(order => {
        const count = statusCounts.get(order.status) || 0
        statusCounts.set(order.status, count + 1)
      })
      const orderStatusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count
      }))

      // Calculate monthly revenue
      const monthlyRevenue = new Map<string, number>()
      orders?.forEach(order => {
        const month = new Date(order.order_date).toLocaleDateString('en-NG', { 
          year: 'numeric', 
          month: 'short' 
        })
        const revenue = monthlyRevenue.get(month) || 0
        monthlyRevenue.set(month, revenue + orderTotal(order))
      })
      const monthlyRevenueArray = Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
        month,
        revenue
      }))

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
      
      // Convert to array and sort by revenue (descending)
      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10 products

      // Calculate profit analysis from actual sales
      // Calculate cost of goods sold (COGS) from order items
      let totalCostOfGoodsSold = 0
      const productCostMap = new Map<number, number>()
      
      // Create a map of product costs
      products?.forEach(product => {
        if (product.cost_price) {
          productCostMap.set(product.id, product.cost_price)
        }
      })
      
      // Calculate COGS from sold items
      orders?.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            const costPrice = productCostMap.get(item.product_id) || 0
            totalCostOfGoodsSold += costPrice * item.quantity
          })
        }
      })
      
      // Calculate current inventory value
      const currentInventoryValue = products?.reduce((sum, product) => {
        return sum + ((product.cost_price || 0) * product.quantity)
      }, 0) || 0
      
      const profit = totalRevenue - totalCostOfGoodsSold
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      // Outstanding payments: use ALL orders (all time), not date-filtered
      const outstandingOrders = allOrders.filter(order => {
        const status = String((order as any).payment_status || 'paid').toLowerCase()
        const due = orderDue(order)
        return (status === 'partial' || status === 'unpaid') && due > 0
      })
      
      const outstandingPayments = {
        totalOutstanding: outstandingOrders.reduce((sum, order) => sum + orderDue(order), 0),
        partialPayments: outstandingOrders.filter(o => String((o as any).payment_status || '').toLowerCase() === 'partial').length,
        unpaidOrders: outstandingOrders.filter(o => String((o as any).payment_status || '').toLowerCase() === 'unpaid').length,
        orders: outstandingOrders.map(order => ({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          totalAmount: orderTotal(order),
          amountPaid: orderPaid(order),
          amountDue: orderDue(order),
          orderDate: order.order_date
        }))
      }

      // Calculate daily revenue for graphical reports
      const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>()
      orders?.forEach(order => {
        const date = new Date(order.order_date).toISOString().split('T')[0]
        const existing = dailyRevenueMap.get(date) || { revenue: 0, orders: 0 }
        dailyRevenueMap.set(date, {
          revenue: existing.revenue + orderTotal(order),
          orders: existing.orders + 1
        })
      })
      const dailyRevenue = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Current stock (after reduction when sold) - from products API
      const currentStock = (products || []).map((p: Product) => ({
        name: p.name,
        quantity: p.quantity,
        category: p.category || '',
        brand: p.brand,
        price: p.price
      }))

      // Total stock for admin (reduces when sold, increases when product added/quantity updated)
      const totalUnitsInStock = (products || []).reduce((sum, p) => sum + (p.quantity || 0), 0)
      const totalProductLines = (products || []).length

      setReportData({
        totalRevenue,
        totalCollected,
        totalOrders,
        averageOrderValue,
        topProducts,
        monthlyRevenue: monthlyRevenueArray,
        orderStatusBreakdown,
        profitAnalysis: {
          totalCost: totalCostOfGoodsSold,
          totalRevenue,
          profit,
          profitMargin,
          currentInventoryValue
        },
        outstandingPayments,
        dailyRevenue,
        currentStock,
        totalUnitsInStock,
        totalProductLines
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      // Set empty report data on error
      setReportData({
        totalRevenue: 0,
        totalCollected: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topProducts: [],
        monthlyRevenue: [],
        orderStatusBreakdown: [],
        profitAnalysis: {
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          profitMargin: 0,
          currentInventoryValue: 0
        },
        outstandingPayments: {
          totalOutstanding: 0,
          partialPayments: 0,
          unpaidOrders: 0,
          orders: []
        },
        dailyRevenue: [],
        currentStock: [],
        totalUnitsInStock: 0,
        totalProductLines: 0
      })
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [dateRange, ordersFromApp])

  useEffect(() => {
    loadReportData()
    // Retry once after 2s if server was not ready (desktop app)
    const t = setTimeout(() => loadReportData(), 2000)
    return () => clearTimeout(t)
  }, [loadReportData])

  // Refresh reports when component becomes visible (real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      loadReportData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [loadReportData])

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="reports">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1>Reports & Analytics</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const end = new Date().toISOString().split('T')[0]
                  setDateRange({ start: '2020-01-01', end })
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: dateRange.start === '2020-01-01' ? '#667eea' : '#f3f4f6',
                  color: dateRange.start === '2020-01-01' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                All time
              </button>
              <button
                type="button"
                onClick={() => setDateRange(getLast12MonthsRange())}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Last 12 months
              </button>
            </div>
            <div className="date-range-selector">
              <label>From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="form-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="form-input"
              />
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => {
                onRefresh?.() // Reload orders in App; Reports will recalc when orders update
              }}
              disabled={loading}
              title="Refresh reports (reload orders and recalculate)"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
          Last updated: {lastUpdated.toLocaleTimeString()} | Auto-refreshes every 30 seconds
          <span style={{ marginLeft: '1rem' }}>• Summary &amp; charts use the date range above. Outstanding is always all time.</span>
        </div>
      </div>

      {/* Report View Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'summary', label: '📊 Summary', icon: '📊' },
          { id: 'outstanding', label: '⚠️ Outstanding Payments', icon: '⚠️' },
          { id: 'graphical', label: '📈 Graphical Reports', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportView(tab.id as typeof reportView)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: reportView === tab.id ? '#667eea' : '#f3f4f6',
              color: reportView === tab.id ? 'white' : '#374151',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: reportView === tab.id ? '600' : '500',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
        
        {/* Print/Export Button */}
        <button
          onClick={() => window.print()}
          style={{
            marginLeft: 'auto',
            padding: '0.75rem 1.5rem',
            border: '2px solid #667eea',
            background: 'white',
            color: '#667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🖨️ Print Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Revenue (period)</h3>
          <div className="metric-value">{formatPrice(reportData.totalRevenue)}</div>
          <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>In selected date range</small>
        </div>
        <div className="metric-card">
          <h3>Total Collected (period)</h3>
          <div className="metric-value" style={{ color: '#16a34a' }}>{formatPrice(reportData.totalCollected)}</div>
          <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>Amount paid in period</small>
        </div>
        <div className="metric-card">
          <h3>Total Orders</h3>
          <div className="metric-value">{reportData.totalOrders}</div>
          <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>In selected date range</small>
        </div>
        <div className="metric-card">
          <h3>Average Order Value</h3>
          <div className="metric-value">{formatPrice(reportData.averageOrderValue)}</div>
        </div>
        <div className="metric-card">
          <h3>Profit Margin</h3>
          <div className="metric-value">{reportData.profitAnalysis.profitMargin.toFixed(1)}%</div>
        </div>
        <div className="metric-card" style={{ 
          background: reportData.outstandingPayments.totalOutstanding > 0 ? '#fef3c7' : '#f0fdf4', 
          borderColor: reportData.outstandingPayments.totalOutstanding > 0 ? '#fcd34d' : '#86efac' 
        }}>
          <h3 style={{ color: reportData.outstandingPayments.totalOutstanding > 0 ? '#92400e' : '#166534' }}>
            {reportData.outstandingPayments.totalOutstanding > 0 ? '⚠️ Outstanding' : '✓ Outstanding'}
          </h3>
          <div className="metric-value" style={{ color: reportData.outstandingPayments.totalOutstanding > 0 ? '#dc2626' : '#166534' }}>
            {formatPrice(reportData.outstandingPayments.totalOutstanding)}
          </div>
          <small style={{ color: reportData.outstandingPayments.totalOutstanding > 0 ? '#78350f' : '#166534', fontSize: '0.8rem' }}>
            {reportData.outstandingPayments.orders.length} order(s) pending • All time
          </small>
        </div>
        <div className="metric-card" style={{ background: '#eff6ff', borderColor: '#93c5fd' }}>
          <h3 style={{ color: '#1e40af' }}>📦 Total units in stock</h3>
          <div className="metric-value" style={{ color: '#1d4ed8' }}>{reportData.totalUnitsInStock.toLocaleString()}</div>
          <small style={{ color: '#1e40af', fontSize: '0.8rem' }}>Across all products • Reduces when sold</small>
        </div>
        <div className="metric-card" style={{ background: '#eff6ff', borderColor: '#93c5fd' }}>
          <h3 style={{ color: '#1e40af' }}>🏷️ Number of products</h3>
          <div className="metric-value" style={{ color: '#1d4ed8' }}>{reportData.totalProductLines}</div>
          <small style={{ color: '#1e40af', fontSize: '0.8rem' }}>Product lines (SKUs)</small>
        </div>
      </div>

      {/* Stock logic note for admin */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#166534'
      }}>
        <strong>Stock logic:</strong> Stock <strong>reduces</strong> when a product is sold (order placed). Stock <strong>increases</strong> when you add a new product or edit a product and set a higher quantity in Product Management.
      </div>

      {/* Summary View */}
      {reportView === 'summary' && (
        <div className="reports-content">
          <div className="reports-row">
            {/* Top Products */}
            <div className="report-card">
              <h3>Top Selling Products</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Quantity sold reduces stock for each product when orders are placed.
              </p>
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                          No products sold in this date range
                        </td>
                      </tr>
                    ) : (
                      reportData.topProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.name}</td>
                          <td>{product.quantity}</td>
                          <td>{formatPrice(product.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="report-card">
              <h3>Order Status Breakdown</h3>
              <div className="status-chart">
                {reportData.orderStatusBreakdown.map((item) => (
                  <div key={item.status} className="status-item">
                    <div className="status-info">
                      <span className="status-name">{item.status}</span>
                      <span className="status-count">{item.count}</span>
                    </div>
                    <div className="status-bar">
                      <div 
                        className="status-fill"
                        style={{ 
                          width: `${reportData.totalOrders > 0 ? (item.count / reportData.totalOrders) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="report-card">
            <h3>Profit Analysis</h3>
            <div className="profit-analysis">
              <div className="profit-item">
                <span className="profit-label">Cost of Goods Sold (COGS):</span>
                <span className="profit-value">{formatPrice(reportData.profitAnalysis.totalCost)}</span>
              </div>
              <div className="profit-item">
                <span className="profit-label">Total Revenue:</span>
                <span className="profit-value">{formatPrice(reportData.profitAnalysis.totalRevenue)}</span>
              </div>
              <div className="profit-item total">
                <span className="profit-label">Net Profit:</span>
                <span className={`profit-value ${reportData.profitAnalysis.profit >= 0 ? 'positive' : 'negative'}`}>
                  {formatPrice(reportData.profitAnalysis.profit)}
                </span>
              </div>
              <div className="profit-item">
                <span className="profit-label">Profit Margin:</span>
                <span className={`profit-value ${reportData.profitAnalysis.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                  {reportData.profitAnalysis.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="profit-item">
                <span className="profit-label">Current Inventory Value (after sales):</span>
                <span className="profit-value">{formatPrice(reportData.profitAnalysis.currentInventoryValue)}</span>
                <small style={{ display: 'block', color: '#6b7280', marginTop: '2px' }}>Uses reduced stock when products are sold</small>
              </div>
            </div>
          </div>

          {/* Current stock (after reduction when sold) */}
          <div className="report-card">
            <h3>Current stock (reduced when sold)</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Stock values decrease when orders are placed. This table shows current quantities.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Stock (units)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Brand</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.currentStock.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                        No products loaded
                      </td>
                    </tr>
                  ) : (
                    reportData.currentStock.map((p, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{p.price != null ? formatPrice(p.price) : '—'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{p.quantity}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>{p.category || '—'}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>{p.brand || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="report-card">
            <h3>Monthly Revenue Trend</h3>
            <div className="monthly-revenue">
              {reportData.monthlyRevenue.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No revenue data in this date range
                </div>
              ) : (
                reportData.monthlyRevenue.map((item) => {
                  const maxRevenue = Math.max(...reportData.monthlyRevenue.map(m => m.revenue), 1)
                  return (
                    <div key={item.month} className="month-item">
                      <span className="month-name">{item.month}</span>
                      <div className="month-bar">
                        <div 
                          className="month-fill"
                          style={{ 
                            width: `${(item.revenue / maxRevenue) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="month-value">{formatPrice(item.revenue)}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Payments View */}
      {reportView === 'outstanding' && (
        <div className="reports-content">
          <div className="report-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ 
                background: '#fef3c7', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                textAlign: 'center' 
              }}>
                <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Total Outstanding</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {formatPrice(reportData.outstandingPayments.totalOutstanding)}
                </div>
              </div>
              <div style={{ 
                background: '#fef3c7', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                textAlign: 'center' 
              }}>
                <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Partial Payments</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {reportData.outstandingPayments.partialPayments}
                </div>
              </div>
              <div style={{ 
                background: '#fee2e2', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                textAlign: 'center' 
              }}>
                <h4 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Unpaid Orders</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {reportData.outstandingPayments.unpaidOrders}
                </div>
              </div>
            </div>

            <h3 style={{ marginBottom: '0.25rem' }}>Outstanding Orders</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              All time — orders with unpaid or partial balance
            </p>
            {reportData.outstandingPayments.orders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                background: '#f0fdf4', 
                borderRadius: '12px' 
              }}>
                <span style={{ fontSize: '3rem' }}>✅</span>
                <p style={{ marginTop: '1rem', color: '#166534', fontWeight: '600' }}>
                  All payments are up to date!
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Order #</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Contact</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Paid</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Due</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.outstandingPayments.orders.map((order, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{order.orderNumber}</td>
                        <td style={{ padding: '1rem' }}>{order.customerName}</td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {order.customerPhone || order.customerEmail}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#22c55e' }}>
                          {formatPrice(order.amountPaid)}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right', 
                          fontWeight: 'bold', 
                          color: '#dc2626' 
                        }}>
                          {formatPrice(order.amountDue)}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                          {new Date(order.orderDate).toLocaleDateString('en-NG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Graphical Reports View */}
      {reportView === 'graphical' && (
        <div className="reports-content">
          {/* Daily Revenue Chart */}
          <div className="report-card" style={{ marginBottom: '1.5rem' }}>
            <h3>📈 Daily Revenue Chart</h3>
            <div style={{ marginTop: '1rem' }}>
              {reportData.dailyRevenue.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No daily revenue data in this date range
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {reportData.dailyRevenue.slice(-14).map((day) => {
                    const maxRevenue = Math.max(...reportData.dailyRevenue.map(d => d.revenue), 1)
                    const percentage = (day.revenue / maxRevenue) * 100
                    return (
                      <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ minWidth: '100px', fontSize: '0.85rem', color: '#6b7280' }}>
                          {new Date(day.date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div style={{ 
                          flex: 1, 
                          height: '24px', 
                          background: '#e5e7eb', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ minWidth: '100px', textAlign: 'right', fontWeight: '600' }}>
                          {formatPrice(day.revenue)}
                        </span>
                        <span style={{ minWidth: '50px', color: '#6b7280', fontSize: '0.85rem' }}>
                          ({day.orders} orders)
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="report-card" style={{ marginBottom: '1.5rem' }}>
            <h3>📊 Monthly Revenue Comparison</h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: '1rem', 
              height: '250px', 
              padding: '1rem',
              marginTop: '1rem'
            }}>
              {reportData.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...reportData.monthlyRevenue.map(m => m.revenue), 1)
                const heightPercent = (month.revenue / maxRevenue) * 100
                const colors = ['#667eea', '#764ba2', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']
                return (
                  <div 
                    key={month.month}
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      marginBottom: '0.5rem' 
                    }}>
                      {formatPrice(month.revenue)}
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '60px',
                      height: `${Math.max(heightPercent, 5)}%`,
                      background: `linear-gradient(180deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}90)`,
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 0.3s ease'
                    }} />
                    <span style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      {month.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Products Pie-like Chart */}
          <div className="report-card">
            <h3>🥧 Top Products Distribution</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem',
              marginTop: '1rem' 
            }}>
              {reportData.topProducts.slice(0, 6).map((product, index) => {
                const totalRevenue = reportData.topProducts.reduce((sum, p) => sum + p.revenue, 1)
                const percentage = (product.revenue / totalRevenue) * 100
                const colors = ['#667eea', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']
                return (
                  <div key={product.name} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `conic-gradient(${colors[index]} ${percentage}%, #e5e7eb ${percentage}%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{product.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {product.quantity} sold • {formatPrice(product.revenue)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
