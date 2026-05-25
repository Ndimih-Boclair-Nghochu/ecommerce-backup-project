import React, { useState, useEffect } from 'react'import toast from 'react-hot-toast'

import axios from 'axios'

const DashboardOverview = ({ token, products, orders, subAdmins, customers, installmentStats, resetStatus, onAddProduct, onViewAnalytics, onManageTeam, onSettings }) => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [deletedItems, setDeletedItems] = useState([])
  const [dataMgmtStats, setDataMgmtStats] = useState(null)
  const [showDataMgmt, setShowDataMgmt] = useState(false)
  const [selectedRestoreItems, setSelectedRestoreItems] = useState(new Set())

  useEffect(() => {
    fetchDashboardStats()
    fetchDeletedItems()
    fetchDataMgmtStats()
    
    // Real-time polling - 5 seconds on dashboard
    const interval = setInterval(() => {
      if (isRealTimeActive) {
        fetchDashboardStats()
        fetchDeletedItems()
        fetchDataMgmtStats()
        setLastUpdate(new Date())
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isRealTimeActive])

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`/api/admin/real-time-stats?period=month&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.debug('📊 Dashboard Stats Fetched:', response.data)
      setDashboardStats(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setLoading(false)
    }
  }

  const fetchDeletedItems = async () => {
    try {
      const response = await axios.get('/api/admin/data-management/deleted', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeletedItems(response.data)
    } catch (err) {
      console.error('Failed to fetch deleted items:', err)
    }
  }

  const fetchDataMgmtStats = async () => {
    try {
      const response = await axios.get('/api/admin/data-management/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDataMgmtStats(response.data)
    } catch (err) {
      console.error('Failed to fetch data management stats:', err)
    }
  }

  const handleRestoreItem = async (deleteId) => {
    try {
      await axios.post(`/api/admin/data-management/restore/${deleteId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDeletedItems()
      fetchDataMgmtStats()
      toast('Item restored successfully!')
    } catch (err) {
      toast('Failed to restore item: ' + err.response?.data?.error)
    }
  }

  const handlePermanentDelete = async (deleteId) => {
    if (!window.confirm('Permanently delete this item? This action cannot be undone.')) return
    try {
      await axios.post(`/api/admin/data-management/permanent-delete/${deleteId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDeletedItems()
      fetchDataMgmtStats()
      toast('Item permanently deleted!')
    } catch (err) {
      toast('Failed to permanently delete: ' + err.response?.data?.error)
    }
  }

  const handleClearPeriodData = async (type, period) => {
    if (!window.confirm(`Clear all ${type} from the last ${period}? This will soft-delete them for 48 hours.`)) return
    try {
      const response = await axios.post(
        `/api/admin/data-management/clear-period/${type}/${period}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast(`Cleared ${response.data.deletedCount} items!`)
      fetchDeletedItems()
      fetchDataMgmtStats()
      fetchDashboardStats()
    } catch (err) {
      toast('Failed to clear data: ' + err.response?.data?.error)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedRestoreItems.size === 0) {
      toast('Please select items to restore')
      return
    }
    if (!window.confirm(`Restore ${selectedRestoreItems.size} selected items?`)) return

    try {
      let successCount = 0
      let failedCount = 0
      for (const deleteId of selectedRestoreItems) {
        try {
          await axios.post(`/api/admin/data-management/restore/${deleteId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          successCount++
        } catch (err) {
          failedCount++
          console.error(`Failed to restore ${deleteId}:`, err)
        }
      }
      toast(`Restored ${successCount} items${failedCount > 0 ? `, failed: ${failedCount}` : ''}!`)
      setSelectedRestoreItems(new Set())
      fetchDeletedItems()
      fetchDataMgmtStats()
    } catch (err) {
      toast('Error during bulk restore: ' + err.message)
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedRestoreItems.size === 0) {
      toast('Please select items to delete')
      return
    }
    if (!window.confirm(`Permanently delete ${selectedRestoreItems.size} items? This cannot be undone.`)) return

    try {
      let successCount = 0
      for (const deleteId of selectedRestoreItems) {
        try {
          await axios.post(`/api/admin/data-management/permanent-delete/${deleteId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          successCount++
        } catch (err) {
          console.error(`Failed to delete ${deleteId}:`, err)
        }
      }
      toast(`Permanently deleted ${successCount} items!`)
      setSelectedRestoreItems(new Set())
      fetchDeletedItems()
      fetchDataMgmtStats()
    } catch (err) {
      toast('Error during bulk delete: ' + err.message)
    }
  }

  const toggleSelectItem = (deleteId) => {
    const newSelected = new Set(selectedRestoreItems)
    if (newSelected.has(deleteId)) {
      newSelected.delete(deleteId)
    } else {
      newSelected.add(deleteId)
    }
    setSelectedRestoreItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRestoreItems.size === deletedItems.length) {
      setSelectedRestoreItems(new Set())
    } else {
      setSelectedRestoreItems(new Set(deletedItems.map(item => item.id)))
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
      {/* Platform Reset Notice */}
      {resetStatus?.isReset && (
        <div className="bg-orange-100 border-l-4 border-orange-600 p-4 rounded-lg">
          <p className="font-bold text-orange-900">🔄 Platform Reset Active</p>
          <p className="text-sm text-orange-800 mt-1">All data is temporarily hidden. Statistics, products, and orders will reappear when you restore the platform data.</p>
        </div>
      )}

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

      {/* Live Status Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-semibold text-gray-700">
            {isRealTimeActive ? '🟢 Live Updates Active' : '⊙ Live Updates Paused'}
          </span>
          <span className="text-xs text-gray-500">Last update: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <button
          onClick={() => setIsRealTimeActive(!isRealTimeActive)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isRealTimeActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isRealTimeActive ? '⏸ Pause' : '▶ Live'}
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Key Performance Indicators</h3>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
            <span>📅 THIS MONTH</span>
            <span className="text-xs text-blue-600">({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            icon="💰"
            label="Total Revenue"
            value={resetStatus?.isReset ? formatCurrency(0) : formatCurrency(stats.totalRevenue)}
            subtext={resetStatus?.isReset ? '0 orders' : `${stats.totalOrders} orders • This Month`}
            color="green"
            trend={resetStatus?.isReset ? 0 : stats.revenueTrend}
          />
          <MetricCard
            icon="📦"
            label="Orders"
            value={resetStatus?.isReset ? formatNumber(0) : formatNumber(stats.totalOrders)}
            subtext={resetStatus?.isReset ? '0 items sold' : `${formatNumber(stats.totalItemsSold)} items • This Month`}
            color="blue"
            trend={resetStatus?.isReset ? 0 : stats.ordersTrend}
          />
          <MetricCard
            icon="💵"
            label="Avg Order Value"
            value={resetStatus?.isReset ? formatCurrency(0) : formatCurrency(stats.averageOrderValue)}
            subtext="Per transaction"
            color="purple"
          />
          <MetricCard
            icon="👥"
            label="Sub-Admins"
            value={resetStatus?.isReset ? 0 : subAdmins.length}
            subtext="Active managers"
            color="orange"
          />
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Customer Analytics</h3>
          <div className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
            <span>👥 REGISTERED USERS</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            icon="👥"
            label="Total Customers"
            value={resetStatus?.isReset ? formatNumber(0) : formatNumber(customers?.length || 0)}
            subtext={`Registered on platform`}
            color="pink"
          />
          <MetricCard
            icon="💳"
            label="Active Installments"
            value={resetStatus?.isReset ? formatNumber(0) : formatNumber(installmentStats?.activeInstallments || 0)}
            subtext={`Payment plans in progress`}
            color="purple"
          />
          <MetricCard
            icon="💰"
            label="Total Installment Value"
            value={resetStatus?.isReset ? formatCurrency(0) : formatCurrency(installmentStats?.totalInstallmentAmount || 0)}
            subtext={`Combined plan amounts`}
            color="green"
          />
          <MetricCard
            icon="📊"
            label="Installment Conversion"
            value={resetStatus?.isReset ? '0%' : `${installmentStats?.conversionRate || 0}%`}
            subtext={`Of customers using plans`}
            color="indigo"
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
            value={resetStatus?.isReset ? formatNumber(0) : formatNumber(products.length)}
            subtext={resetStatus?.isReset ? '0 items in stock' : `${formatNumber(totalStock)} items in stock`}
            color="indigo"
          />
          <MetricCard
            icon="💎"
            label="Inventory Value"
            value={resetStatus?.isReset ? formatCurrency(0) : formatCurrency(totalInventoryValue)}
            subtext="Total stock value"
            color="cyan"
          />
          <MetricCard
            icon="⚠️"
            label="Low Stock"
            value={resetStatus?.isReset ? 0 : lowStockProducts}
            subtext={`Less than 10 units`}
            color="orange"
          />
          <MetricCard
            icon="🚨"
            label="Out of Stock"
            value={resetStatus?.isReset ? 0 : outOfStockProducts}
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

      {/* Active Installment Plans */}
      {customers && customers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Installment Plans</h3>
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
              💳 {installmentStats?.activeInstallments || 0} Active Plans
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Total Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Paid</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Progress</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers
                    .filter(c => c.activeInstallments > 0)
                    .slice(0, 10)
                    .map((customer) => (
                      customer.installmentPlans
                        .filter(plan => plan.status === 'active')
                        .map((plan, idx) => {
                          const progress = Math.min((plan.paid / plan.totalAmount) * 100, 100)
                          return (
                            <tr
                              key={`${customer.id}-${plan.id}-${idx}`}
                              className="border-b hover:bg-purple-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-semibold text-gray-900">{customer.name}</p>
                                  <p className="text-xs text-gray-500">{customer.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                                  {plan.duration} months
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {formatCurrency(plan.totalAmount)}
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-semibold text-green-600">{formatCurrency(plan.paid)}</p>
                                  <p className="text-xs text-gray-500">Remaining: {formatCurrency(plan.remaining)}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{progress.toFixed(0)}% Paid</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  progress === 100
                                    ? 'bg-green-100 text-green-700'
                                    : progress > 50
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {progress === 100 ? '✅ Complete' : progress > 50 ? '📊 Mid-way' : '⏳ Started'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                    ))}
                </tbody>
              </table>
            </div>
            
            {customers.filter(c => c.activeInstallments > 0).length === 0 && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-gray-600 font-semibold">No active installment plans yet</p>
                <p className="text-sm text-gray-500 mt-1">Installment plans will appear here once customers start using them</p>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Data Management Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🗑️</span> Data Management
          </h3>
          <button
            onClick={() => setShowDataMgmt(!showDataMgmt)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
          >
            {showDataMgmt ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        {dataMgmtStats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Total Deleted Items</p>
              <p className="text-2xl font-bold text-gray-900">{dataMgmtStats.totalDeleted}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 mb-1">Recoverable (48h)</p>
              <p className="text-2xl font-bold text-green-700">{dataMgmtStats.deletedInLast48h}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-orange-600 mb-1">Permanent Delete Ready</p>
              <p className="text-2xl font-bold text-orange-700">{dataMgmtStats.deletedOlderThan48h}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 mb-1">Breakdown</p>
              <p className="text-sm text-gray-600">P:{dataMgmtStats.breakdown.products} O:{dataMgmtStats.breakdown.orders} L:{dataMgmtStats.breakdown.locations}</p>
            </div>
          </div>
        )}

        {showDataMgmt && (
          <div className="space-y-6 border-t pt-6">
            {/* Clear Old Data */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">📅 Clear Old Data</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['week', 'month', 'year'].map(period => (
                  <div key={period} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Last {period === 'year' ? '12 months' : period}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleClearPeriodData('products', period)}
                        className="w-full text-left px-3 py-2 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100 transition"
                      >
                        🗑️ Products
                      </button>
                      <button
                        onClick={() => handleClearPeriodData('orders', period)}
                        className="w-full text-left px-3 py-2 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100 transition"
                      >
                        📦 Orders
                      </button>
                      <button
                        onClick={() => handleClearPeriodData('activities', period)}
                        className="w-full text-left px-3 py-2 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100 transition"
                      >
                        📋 Activities
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recover Deleted Items */}
            {deletedItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">♻️ Recover Deleted Items (48h Window)</h4>
                  <div className="text-sm text-gray-600">
                    {selectedRestoreItems.size > 0 && (
                      <span className="font-semibold text-blue-600">{selectedRestoreItems.size} selected</span>
                    )}
                  </div>
                </div>
                
                {selectedRestoreItems.size > 0 && (
                  <div className="mb-4 flex gap-2 justify-end">
                    <button
                      onClick={handleBulkRestore}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition"
                    >
                      ✓ Restore {selectedRestoreItems.size} Items
                    </button>
                    <button
                      onClick={handleBulkPermanentDelete}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition"
                    >
                      🗑️ Delete {selectedRestoreItems.size} Forever
                    </button>
                    <button
                      onClick={() => setSelectedRestoreItems(new Set())}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-400 transition"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRestoreItems.size === deletedItems.length && deletedItems.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-900">Select All</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {deletedItems.map((item, idx) => {
                    const deleteTime = new Date(item.deletedAt);
                    const now = new Date();
                    const hoursSince = Math.floor((now - deleteTime) / (1000 * 60 * 60));
                    const hoursLeft = 48 - hoursSince;
                    const canRestore = hoursLeft > 0;
                    const isSelected = selectedRestoreItems.has(item.id);

                    return (
                      <div key={idx} className={`rounded-lg p-3 flex items-center gap-3 ${isSelected ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.type.toUpperCase()}: {item.data.name || item.data.id || 'Unnamed'}
                          </p>
                          <p className="text-xs text-gray-600">Deleted by: {item.deletedByName} • {hoursSince}h ago</p>
                          {canRestore && <p className="text-xs text-green-600">✓ Recoverable for {hoursLeft}h</p>}
                          {!canRestore && <p className="text-xs text-red-600">✗ Available for permanent delete only</p>}
                        </div>
                        <div className="flex gap-2">
                          {canRestore && (
                            <button
                              onClick={() => handleRestoreItem(item.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded hover:bg-green-200 transition"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => handlePermanentDelete(item.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded hover:bg-red-200 transition"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {deletedItems.length === 0 && (
              <p className="text-center text-gray-500 py-4">✓ No deleted items - Your data is clean!</p>
            )}
          </div>
        )}
      </div>

      {/* Active Installment Plans */}
      {(installmentStats?.activeInstallments || 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">💳 Active Installment Plans</h3>
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
              {installmentStats?.activeInstallments || 0} Active Plans
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">Customer</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">Duration</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">Total Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">Progress</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers && customers.slice(0, 10).map((customer, idx) => {
                    if (!customer.activeInstallments || customer.activeInstallments === 0) return null;
                    
                    return customer.installmentPlans
                      .filter(plan => plan.status === 'active')
                      .slice(0, 3)
                      .map((plan, planIdx) => {
                        const progress = plan.totalAmount > 0 ? (plan.paid / plan.totalAmount) * 100 : 0;
                        const progressColor = progress < 33 ? 'bg-orange-500' : progress < 66 ? 'bg-yellow-500' : 'bg-green-500';
                        
                        return (
                          <tr key={`${idx}-${planIdx}`} className="hover:bg-gray-50 transition">
                            <td className="px-4 sm:px-6 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.email}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span className="text-sm font-semibold text-gray-900">{plan.duration} months</span>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(plan.totalAmount)}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(plan.paid)} paid</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full ${progressColor} transition-all duration-300`}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                ✓ On Track
                              </span>
                            </td>
                          </tr>
                        );
                      });
                  })}
                </tbody>
              </table>
            </div>
            
            {(!customers || customers.every(c => !c.activeInstallments || c.activeInstallments === 0)) && (
              <div className="p-6 text-center text-gray-500">
                No active installment plans at the moment
              </div>
            )}
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
