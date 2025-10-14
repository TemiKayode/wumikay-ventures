import React, { useState, useEffect } from 'react'
import { supabase, Order, Product } from '../lib/supabase'

interface ReportData {
  totalRevenue: number
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
  }
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    monthlyRevenue: [],
    orderStatusBreakdown: [],
    profitAnalysis: {
      totalCost: 0,
      totalRevenue: 0,
      profit: 0,
      profitMargin: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      // Load orders within date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('order_date', dateRange.start)
        .lte('order_date', dateRange.end)

      if (ordersError) throw ordersError

      // Load products for profit analysis
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')

      if (productsError) throw productsError

      // Calculate basic stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
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
        monthlyRevenue.set(month, revenue + order.total_amount)
      })
      const monthlyRevenueArray = Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
        month,
        revenue
      }))

      // Mock top products data (in real app, this would come from order_items)
      const topProducts = [
        { name: 'Coca-Cola PET Bottle', quantity: 45, revenue: 200250 },
        { name: 'Fanta Orange PET Bottle', quantity: 38, revenue: 169100 },
        { name: 'Pepsi Cola PET Bottle', quantity: 32, revenue: 140800 },
        { name: 'Mr. V Bottled Water', quantity: 28, revenue: 50400 },
        { name: 'Sprite Lemon-Lime PET Bottle', quantity: 25, revenue: 111250 }
      ]

      // Calculate profit analysis
      const totalCost = products?.reduce((sum, product) => {
        return sum + ((product.cost_price || 0) * product.quantity)
      }, 0) || 0
      
      const profit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      setReportData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        monthlyRevenue: monthlyRevenueArray,
        orderStatusBreakdown,
        profitAnalysis: {
          totalCost,
          totalRevenue,
          profit,
          profitMargin
        }
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <h1>Reports & Analytics</h1>
        <div className="date-range-selector">
          <label>Date Range:</label>
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
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <div className="metric-value">{formatPrice(reportData.totalRevenue)}</div>
        </div>
        <div className="metric-card">
          <h3>Total Orders</h3>
          <div className="metric-value">{reportData.totalOrders}</div>
        </div>
        <div className="metric-card">
          <h3>Average Order Value</h3>
          <div className="metric-value">{formatPrice(reportData.averageOrderValue)}</div>
        </div>
        <div className="metric-card">
          <h3>Profit Margin</h3>
          <div className="metric-value">{reportData.profitAnalysis.profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="reports-content">
        <div className="reports-row">
          {/* Top Products */}
          <div className="report-card">
            <h3>Top Selling Products</h3>
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
                  {reportData.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{formatPrice(product.revenue)}</td>
                    </tr>
                  ))}
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
                        width: `${(item.count / reportData.totalOrders) * 100}%` 
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
              <span className="profit-label">Total Cost of Goods:</span>
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
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="report-card">
          <h3>Monthly Revenue Trend</h3>
          <div className="monthly-revenue">
            {reportData.monthlyRevenue.map((item) => (
              <div key={item.month} className="month-item">
                <span className="month-name">{item.month}</span>
                <div className="month-bar">
                  <div 
                    className="month-fill"
                    style={{ 
                      width: `${(item.revenue / Math.max(...reportData.monthlyRevenue.map(m => m.revenue))) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="month-value">{formatPrice(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
