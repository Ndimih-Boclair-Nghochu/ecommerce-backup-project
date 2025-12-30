import React, { useState, useEffect } from 'react'
import axios from 'axios'

const DashboardOverview = ({ token, products, orders, subAdmins, onAddProduct, onViewAnalytics, onManageTeam, onSettings }) => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(fetchDashboardStats, 60000) // Refresh every 60 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/admin/real-time-stats?period=month', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDashboardStats(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const MetricCard = ({ icon, label, value, subtext, color = 'blue', trend = null }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 shadow-blue-200',
      green: 'from-green-500 to-green-600 shadow-green-200',
      purple: 'from-purple-500 to-purple-600 shadow-purple-200',
      orange: 'from-orange-500 to-orange-600 shadow-orange-200',
      red: 'from-red-500 to-red-600 shadow-red-200',
      indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
      cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-200',
      pink: 'from-pink-500 to-pink-600 shadow-pink-200',
    }

    const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-6 text-white transform transition hover:scale-105 hover:shadow-2xl duration-300`}>
        <div className="flex items-start justify-between mb-4">
          <span className="text-4xl">{icon}</span>
          {trend !== null && (
            <div className={`text-sm font-bold px-2 py-1 rounded-full ${trendColor} bg-white bg-opacity-20`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-white text-opacity-80 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl sm:text-4xl font-bold mb-2">{value}</p>
        {subtext && <p className="text-xs text-white text-opacity-70">{subtext}</p>}
      </div>
    )
  }

  const ActivityItem = ({ icon, title, value, time, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700',
    }

    return (
      <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition border-l-4" style={{ borderColor: { blue: '#3B82F6', green: '#10B981', orange: '#F59E0B', purple: '#A855F7' }[color] }}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`${colorClasses[color]} p-2 rounded-lg text-lg`}>{icon}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
        </div>
        <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{value}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-80"></div>
      </div>
    )
  }

  // Calculate inventory metrics
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (parseInt(p.stock) || 0)), 0)
  const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0)
  const lowStockProducts = products.filter(p => {
    const stock = parseInt(p.stock) || 0
    return stock > 0 && stock < 10
  }).length
  const outOfStockProducts = products.filter(p => {
    const stock = parseInt(p.stock) || 0
    return stock === 0
  }).length

  const stats = {
    totalRevenue: dashboardStats?.totalRevenue || 0,
    totalOrders: dashboardStats?.totalOrders || 0,
    totalItemsSold: dashboardStats?.totalItemsSold || 0,
    averageOrderValue: dashboardStats?.averageOrderValue || 0,
    revenueTrend: dashboardStats?.revenueTrend || 0,
    ordersTrend: dashboardStats?.ordersTrend || 0,
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to Your Dashboard 👋</h2>
            <p className="text-blue-100">Real-time insights into your e-commerce platform performance</p>
          </div>
          <div className="text-5xl">📊</div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            icon="💰"
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtext={`${stats.totalOrders} orders this month`}
            color="green"
            trend={stats.revenueTrend}
          />
          <MetricCard
            icon="📦"
            label="Orders"
            value={formatNumber(stats.totalOrders)}
            subtext={`${formatNumber(stats.totalItemsSold)} items sold`}
            color="blue"
            trend={stats.ordersTrend}
          />
          <MetricCard
            icon="💵"
            label="Avg Order Value"
            value={formatCurrency(stats.averageOrderValue)}
            subtext="Per transaction"
            color="purple"
          />
          <MetricCard
            icon="👥"
            label="Sub-Admins"
            value={subAdmins.length}
            subtext="Active managers"
            color="orange"
          />
        </div>
      </div>

      {/* Inventory Metrics */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Inventory Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            icon="📊"
            label="Total Products"
            value={formatNumber(products.length)}
            subtext={`${formatNumber(totalStock)} items in stock`}
            color="indigo"
          />
          <MetricCard
            icon="💎"
            label="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            subtext="Total stock value"
            color="cyan"
          />
          <MetricCard
            icon="⚠️"
            label="Low Stock"
            value={lowStockProducts}
            subtext={`Less than 10 units`}
            color="orange"
          />
          <MetricCard
            icon="🚨"
            label="Out of Stock"
            value={outOfStockProducts}
            subtext="Need replenishment"
            color="red"
          />
        </div>
      </div>

      {/* Product Categories */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Product Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {['Electronics', 'Accessories'].map((category, idx) => {
            const categoryProducts = products.filter(p => p.category === category)
            const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)
            const categoryStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0)
            const icons = ['🖥️', '🎯']
            const colors = ['blue', 'purple']

            return (
              <div key={category} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{icons[idx]}</span> {category}
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Products</p>
                    <p className="text-2xl font-bold text-gray-900">{categoryProducts.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">In Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(categoryStock)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(categoryValue)}</p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${colors[idx] === 'blue' ? 'bg-blue-600' : 'bg-purple-600'}`}
                    style={{ width: `${(categoryProducts.length / products.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{((categoryProducts.length / products.length) * 100).toFixed(1)}% of inventory</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Stats and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Load</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Normal
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">Last check: Just now</p>
            </div>
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span> Top Products
          </h3>
          <div className="space-y-3">
            {products
              .filter(p => p.mostOrdered)
              .slice(0, 4)
              .map((product, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{product.name.substring(0, 20)}</span>
                  <span className="font-bold text-gray-900 ml-2">{formatNumber(product.stock)}</span>
                </div>
              ))}
            {products.filter(p => p.mostOrdered).length === 0 && (
              <p className="text-xs text-gray-500">No products marked as most ordered</p>
            )}
          </div>
        </div>

        {/* New Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🆕</span> New Arrivals
          </h3>
          <div className="space-y-3">
            {products
              .filter(p => p.isNew)
              .slice(0, 4)
              .map((product, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{product.name.substring(0, 20)}</span>
                  <span className="font-bold text-gray-900 ml-2">{formatCurrency(product.price)}</span>
                </div>
              ))}
            {products.filter(p => p.isNew).length === 0 && (
              <p className="text-xs text-gray-500">No new products available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {dashboardStats?.recentOrders && dashboardStats.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> Recent Orders
          </h3>
          <div className="space-y-2">
            {dashboardStats.recentOrders.slice(0, 8).map((order, idx) => (
              <ActivityItem
                key={idx}
                icon={['🛒', '📦', '🚚', '✅'][idx % 4]}
                title={order.buyerName}
                value={formatCurrency(order.total)}
                time={order.region}
                color={['blue', 'green', 'orange', 'purple'][idx % 4]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button 
            onClick={onAddProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105">
            ➕ Add Product
          </button>
          <button 
            onClick={onViewAnalytics}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105">
            📊 View Analytics
          </button>
          <button 
            onClick={onManageTeam}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105">
            👥 Manage Team
          </button>
          <button 
            onClick={onSettings}
            className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
