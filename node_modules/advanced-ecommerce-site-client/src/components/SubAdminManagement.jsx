import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SubAdminManagement = ({ token }) => {
  const [subAdmins, setSubAdmins] = useState([])
  const [activities, setActivities] = useState([])
  const [adminInfo, setAdminInfo] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeView, setActiveView] = useState('analytics') // 'analytics', 'subadmins' or 'activities'
  const [searchActivity, setSearchActivity] = useState('')
  const [filterSubAdmin, setFilterSubAdmin] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: {
      manageProducts: true,
      manageOrders: false,
      manageLocations: false,
      viewReports: false,
      viewAnalytics: false,
      manageCustomerService: false,
      managePOS: false,
      viewPOSAnalytics: false
    }
  })

  // Available permissions
  const PERMISSIONS = [
    { key: 'manageProducts', label: '📦 Manage Products', description: 'Add, edit, delete products and inventory' },
    { key: 'manageOrders', label: '📋 Manage Orders', description: 'View orders, update status, manage shipments' },
    { key: 'manageLocations', label: '📍 Manage Locations', description: 'Add, edit, delete store locations' },
    { key: 'viewReports', label: '📊 View Reports', description: 'View sales reports and analytics' },
    { key: 'viewAnalytics', label: '📈 View Analytics', description: 'View detailed analytics and insights' },
    { key: 'manageCustomerService', label: '💬 Customer Service', description: 'Handle customer support tickets, inquiries, and issues' },
    { key: 'managePOS', label: '🏪 Manage POS', description: 'Generate receipts and process walk-in sales' },
    { key: 'viewPOSAnalytics', label: '📊 View POS Analytics', description: 'View POS sales, revenue, and transaction reports' }
  ]

  // Fetch subadmins first, then activities
  useEffect(() => {
    const loadData = async () => {
      await fetchSubAdmins()
      await fetchActivities()
    }
    loadData()
  }, [])

  const fetchSubAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/subadmins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubAdmins(res.data)
      
      // Also fetch admin info from settings or use hardcoded values
      setAdminInfo({
        id: 'admin',
        name: '🏪 SHOP OWNER',
        email: 'ndimihboclair4@gmail.com'
      })
    } catch (err) {
      console.error('Failed to fetch subadmins:', err)
      showMessage('error', 'Failed to load sub-admins')
    }
  }

  const fetchActivities = async () => {
    try {
      const res = await axios.get('/api/admin/subadmin-activities', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivities(res.data)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId 
        ? `/api/admin/subadmins/${editingId}`
        : '/api/admin/subadmins'
      
      const method = editingId ? 'put' : 'post'
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (editingId) {
        setSubAdmins(subAdmins.map(s => s.id === editingId ? response.data : s))
        showMessage('success', 'Sub-admin updated successfully ✓')
      } else {
        setSubAdmins([...subAdmins, response.data])
        showMessage('success', 'Sub-admin created successfully ✓')
      }

      resetForm()
      fetchActivities()
    } catch (err) {
      console.error('Error:', err)
      showMessage('error', err.response?.data?.error || 'Failed to save sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (subAdmin) => {
    setEditingId(subAdmin.id)
    setFormData({
      name: subAdmin.name,
      email: subAdmin.email,
      password: '',
      permissions: subAdmin.permissions
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin? All their activities will be logged.')) return

    try {
      await axios.delete(`/api/admin/subadmins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubAdmins(subAdmins.filter(s => s.id !== id))
      showMessage('success', 'Sub-admin deleted successfully ✓')
      fetchActivities()
    } catch (err) {
      console.error('Error:', err)
      showMessage('error', 'Failed to delete sub-admin')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      permissions: {
        manageProducts: true,
        manageOrders: false,
        manageLocations: false,
        viewReports: false,
        viewAnalytics: false,
        manageCustomerService: false
      }
    })
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const togglePermission = (key) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key]
      }
    })
  }

  const getActivityIcon = (action) => {
    const icons = {
      'create_product': '✨',
      'update_product': '📝',
      'delete_product': '🗑️',
      'view_orders': '👁️',
      'update_order': '📋',
      'view_report': '📊',
      'login': '🔐',
      'logout': '🚪',
      'create_location': '📍',
      'update_location': '✏️',
      'delete_location': '❌'
    }
    return icons[action] || '📌'
  }

  const getActivityColor = (action) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800'
    if (action.includes('update')) return 'bg-blue-100 text-blue-800'
    if (action.includes('delete')) return 'bg-red-100 text-red-800'
    if (action.includes('view')) return 'bg-purple-100 text-purple-800'
    if (action.includes('login')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  // ============ ANALYTICS FUNCTIONS ============
  const getActivitiesInTimeRange = (days) => {
    const now = new Date()
    return activities.filter(a => {
      const actDate = new Date(a.timestamp)
      const daysDiff = (now - actDate) / (1000 * 60 * 60 * 24)
      return daysDiff < days
    })
  }

  const getMostActiveSubAdminByPeriod = (days) => {
    const periodActivities = getActivitiesInTimeRange(days)
    const activityCount = {}
    
    periodActivities.forEach(activity => {
      // Normalize null to 'admin' for main admin activities
      const id = activity.subAdminId === null ? 'admin' : activity.subAdminId
      activityCount[id] = (activityCount[id] || 0) + 1
    })

    const sorted = Object.entries(activityCount)
      .map(([subAdminId, count]) => {
        // Normalize ID
        const normalizedId = subAdminId === 'admin' || subAdminId === null ? 'admin' : subAdminId
        
        // First try to find from subAdmins array
        const subAdmin = subAdmins.find(s => s.id === subAdminId)
        
        // If it's the main admin (ID is 'admin' or null), return admin info
        if (normalizedId === 'admin' || subAdminId === null) {
          return {
            subAdminId: 'admin',
            subAdminName: '🏪 SHOP OWNER',
            subAdminEmail: 'ndimihboclair4@gmail.com',
            activities: count
          }
        }
        
        // For sub-admins, try to extract from activities if not found in array
        const fallbackActivity = periodActivities.find(a => {
          const aId = a.subAdminId === null ? 'admin' : a.subAdminId
          return aId === subAdminId
        })
        
        return {
          subAdminId,
          subAdminName: subAdmin?.name || fallbackActivity?.subAdminName || 'Unknown',
          subAdminEmail: subAdmin?.email || fallbackActivity?.subAdminEmail || 'Unknown',
          activities: count
        }
      })
      .sort((a, b) => b.activities - a.activities)

    return sorted
  }

  const getSubAdminStats = () => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Include both admin and all sub-admins
    const allUsers = adminInfo ? [adminInfo, ...subAdmins] : subAdmins

    return allUsers.map(user => {
      const userId = user.id === 'admin' || user.id === null ? null : user.id
      const allActs = activities.filter(a => {
        // Match admin's activities (null subAdminId or 'admin')
        if (user.id === 'admin' || user.id === null) {
          return a.subAdminId === null || a.subAdminId === 'admin'
        }
        return a.subAdminId === userId
      })
      
      const dayActs = allActs.filter(a => {
        const aDate = new Date(a.timestamp)
        return aDate.toDateString() === new Date().toDateString()
      })
      const weekActs = allActs.filter(a => {
        const aDate = new Date(a.timestamp)
        return aDate >= startOfWeek
      })
      const monthActs = allActs.filter(a => {
        const aDate = new Date(a.timestamp)
        return aDate >= startOfMonth
      })
      const yearActs = allActs.filter(a => {
        const aDate = new Date(a.timestamp)
        return aDate >= startOfYear
      })

      // Get latest activity timestamp
      const latestActivity = allActs.length > 0 
        ? allActs.reduce((latest, current) => 
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
          ).timestamp 
        : null

      return {
        ...user,
        stats: {
          today: dayActs.length,
          week: weekActs.length,
          month: monthActs.length,
          year: yearActs.length,
          total: allActs.length,
          lastActivity: latestActivity
        }
      }
    })
  }

  const filteredActivities = activities.filter(activity => {
    const matchSearch = searchActivity === '' || 
      activity.action.toLowerCase().includes(searchActivity.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchActivity.toLowerCase())
    
    const matchFilter = filterSubAdmin === '' || activity.subAdminId === filterSubAdmin

    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg font-semibold ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* View Selector */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-6 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
            activeView === 'analytics'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveView('subadmins')}
          className={`px-6 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
            activeView === 'subadmins'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Sub-Admins
        </button>
        <button
          onClick={() => setActiveView('activities')}
          className={`px-6 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
            activeView === 'activities'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Activity Log
        </button>
      </div>

      {/* ANALYTICS VIEW */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Header with Refresh */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Real-time sub-admin performance tracking</p>
            </div>
            <button
              onClick={() => {
                fetchSubAdmins();
                fetchActivities();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md"
            >
              🔄 Refresh Data
            </button>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-blue-100 text-sm font-semibold">Total Sub-Admins</p>
              <p className="text-4xl font-bold mt-2">{subAdmins.length}</p>
              <p className="text-blue-100 text-xs mt-2">👥 Team Members</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-purple-100 text-sm font-semibold">Total Activities</p>
              <p className="text-4xl font-bold mt-2">{activities.length}</p>
              <p className="text-purple-100 text-xs mt-2">📊 All Time</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-green-100 text-sm font-semibold">Today's Activities</p>
              <p className="text-4xl font-bold mt-2">{getActivitiesInTimeRange(1).length}</p>
              <p className="text-green-100 text-xs mt-2">📈 Current Day</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-orange-100 text-sm font-semibold">This Week</p>
              <p className="text-4xl font-bold mt-2">{getActivitiesInTimeRange(7).length}</p>
              <p className="text-orange-100 text-xs mt-2">📅 7 Days</p>
            </div>
          </div>

          {/* Most Active By Period */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Active Today */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🌅 Most Active Today</h3>
              <div className="space-y-3">
                {getMostActiveSubAdminByPeriod(1).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{idx + 1}. {item.subAdminName}</p>
                      <p className="text-xs text-gray-600">{item.subAdminEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{item.activities}</p>
                      <p className="text-xs text-gray-600">actions</p>
                    </div>
                  </div>
                ))}
                {getMostActiveSubAdminByPeriod(1).length === 0 && (
                  <p className="text-center text-gray-500 py-6">No activities today</p>
                )}
              </div>
            </div>

            {/* Most Active This Week */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Most Active This Week</h3>
              <div className="space-y-3">
                {getMostActiveSubAdminByPeriod(7).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{idx + 1}. {item.subAdminName}</p>
                      <p className="text-xs text-gray-600">{item.subAdminEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{item.activities}</p>
                      <p className="text-xs text-gray-600">actions</p>
                    </div>
                  </div>
                ))}
                {getMostActiveSubAdminByPeriod(7).length === 0 && (
                  <p className="text-center text-gray-500 py-6">No activities this week</p>
                )}
              </div>
            </div>

            {/* Most Active This Month */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Most Active This Month</h3>
              <div className="space-y-3">
                {getMostActiveSubAdminByPeriod(30).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{idx + 1}. {item.subAdminName}</p>
                      <p className="text-xs text-gray-600">{item.subAdminEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{item.activities}</p>
                      <p className="text-xs text-gray-600">actions</p>
                    </div>
                  </div>
                ))}
                {getMostActiveSubAdminByPeriod(30).length === 0 && (
                  <p className="text-center text-gray-500 py-6">No activities this month</p>
                )}
              </div>
            </div>

            {/* Most Active This Year */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Most Active This Year</h3>
              <div className="space-y-3">
                {getMostActiveSubAdminByPeriod(365).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{idx + 1}. {item.subAdminName}</p>
                      <p className="text-xs text-gray-600">{item.subAdminEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-600">{item.activities}</p>
                      <p className="text-xs text-gray-600">actions</p>
                    </div>
                  </div>
                ))}
                {getMostActiveSubAdminByPeriod(365).length === 0 && (
                  <p className="text-center text-gray-500 py-6">No activities this year</p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">📈 Detailed Sub-Admin Statistics</h3>
            </div>
            {getSubAdminStats().length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p>No sub-admins to display</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Sub-Admin Name</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">🌅 Today</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">📅 Week</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">📊 Month</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">🏆 Year</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">💬 Total</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">⏰ Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSubAdminStats()
                      .sort((a, b) => b.stats.total - a.stats.total)
                      .map((subAdmin, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{idx + 1}. {subAdmin.name}</p>
                            <p className="text-sm text-gray-600">{subAdmin.email}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                              {subAdmin.stats.today}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 font-bold rounded-full text-sm">
                              {subAdmin.stats.week}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                              {subAdmin.stats.month}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-700 font-bold rounded-full text-sm">
                              {subAdmin.stats.year}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-10 bg-gray-200 text-gray-800 font-bold rounded-lg text-sm">
                              {subAdmin.stats.total}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {subAdmin.stats.lastActivity 
                              ? new Date(subAdmin.stats.lastActivity).toLocaleString()
                              : 'No activity'
                            }
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

      {/* SUB-ADMINS VIEW */}
      {activeView === 'subadmins' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">👥 Sub-Admin Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage team members, permissions, and monitor their activities</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
              >
                ➕ Add Sub-Admin
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingId ? '✏️ Edit Sub-Admin' : '➕ Add New Sub-Admin'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={editingId}
                      required={!editingId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                {/* Password */}
                {!editingId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Permissions (Sub-admins can only access assigned features)
                  </label>
                  <div className="space-y-3">
                    {PERMISSIONS.map(perm => (
                      <label key={perm.key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.permissions[perm.key]}
                          onChange={() => togglePermission(perm.key)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{perm.label}</p>
                          <p className="text-sm text-gray-600">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Restrictions Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-800">
                    🔒 Restricted Information (Owner Only)
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>✗ Financial data and revenue reports</li>
                    <li>✗ Customer sensitive information</li>
                    <li>✗ Payment details</li>
                    <li>✗ Sub-admin management</li>
                    <li>✗ System settings</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {editingId ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-Admins List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {subAdmins.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p className="text-lg font-semibold mb-2">No sub-admins yet</p>
                <p>Create your first sub-admin to delegate tasks</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Name</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Permissions</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Activities</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAdmins.map(subAdmin => {
                      const subAdminActivities = activities.filter(a => a.subAdminId === subAdmin.id)
                      const enabledPerms = Object.entries(subAdmin.permissions)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => key)

                      return (
                        <tr key={subAdmin.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{subAdmin.name}</p>
                            <p className="text-sm text-gray-600">{subAdmin.email}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{subAdmin.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {enabledPerms.length > 0 ? (
                                enabledPerms.map(perm => (
                                  <span key={perm} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                    {PERMISSIONS.find(p => p.key === perm)?.label.split(' ')[0]}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 text-sm">No permissions</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {subAdminActivities.length} activities
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleEdit(subAdmin)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subAdmin.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITIES VIEW */}
      {activeView === 'activities' && (
        <div className="space-y-6">
          {/* Header & Filters */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📋 Activity Log</h2>
              <p className="text-sm text-gray-600 mt-1">Track all sub-admin activities and actions in the system</p>
            </div>
            <button
              onClick={fetchActivities}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-700 text-xs font-bold">TOTAL ACTIVITIES</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{activities.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-green-700 text-xs font-bold">TODAY</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{getActivitiesInTimeRange(1).length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-purple-700 text-xs font-bold">THIS WEEK</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{getActivitiesInTimeRange(7).length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-orange-700 text-xs font-bold">THIS MONTH</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{getActivitiesInTimeRange(30).length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by action or details..."
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <select
              value={filterSubAdmin}
              onChange={(e) => setFilterSubAdmin(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="">All Users</option>
              {adminInfo && (
                <option value="admin">
                  🏪 SHOP OWNER
                </option>
              )}
              {subAdmins.map(subAdmin => (
                <option key={subAdmin.id} value={subAdmin.id}>
                  {subAdmin.name}
                </option>
              ))}
            </select>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p className="text-lg font-semibold">No activities found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Sub-Admin</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Action</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Details</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Date & Time</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity, idx) => {
                      const subAdmin = subAdmins.find(s => s.id === activity.subAdminId)
                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {subAdmin?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {subAdmin?.email || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getActivityColor(activity.action)}`}>
                              {getActivityIcon(activity.action)} {activity.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                            {activity.details}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(activity.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {activity.ipAddress || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SubAdminManagement
