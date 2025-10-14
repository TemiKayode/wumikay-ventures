import React, { useState, useEffect } from 'react'
import { supabase, Order, Product } from '../lib/supabase'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  recentOrders: Order[]
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  lowStockProducts: Product[]
}

const Dashboard: React.FC = () => {
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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })

      if (ordersError) throw ordersError

      // Load products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')

      if (productsError) throw productsError

      // Load customers (from orders)
      const uniqueCustomers = new Set(orders?.map(order => order.customer_email).filter(Boolean) || [])
      
      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const lowStockProducts = products?.filter(product => product.quantity <= product.low_stock_threshold) || []

      // Calculate top products
      const productSales = new Map()
      orders?.forEach(order => {
        // This would need to be calculated from order_items in a real implementation
        // For now, we'll use mock data
      })

      const topProducts = [
        { name: 'Coca-Cola PET Bottle', quantity: 45, revenue: 200250 },
        { name: 'Fanta Orange PET Bottle', quantity: 38, revenue: 169100 },
        { name: 'Pepsi Cola PET Bottle', quantity: 32, revenue: 140800 },
        { name: 'Mr. V Bottled Water', quantity: 28, revenue: 50400 }
      ]

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
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to Wumikay Ventures Management System</p>
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

      {/* Charts and Tables */}
      <div className="dashboard-content">
        <div className="dashboard-row">
          {/* Recent Orders */}
          <div className="dashboard-card">
            <h3>Recent Orders</h3>
            <div className="orders-list">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className="order-number">#{order.order_number}</span>
                    <span className="order-customer">{order.customer_name}</span>
                  </div>
                  <div className="order-amount">{formatPrice(order.total_amount)}</div>
                </div>
              ))}
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
    </div>
  )
}

export default Dashboard
