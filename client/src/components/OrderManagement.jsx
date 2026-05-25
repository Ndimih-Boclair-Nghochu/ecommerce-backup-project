import React, { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import AgencySelectModal from './AgencySelectModal'

export default function OrderManagement({ orders = [], onOrderUpdate, token, onViewReceipt = () => {}, resetStatus = null }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrders, setSelectedOrders] = useState([])
  const [viewingOrder, setViewingOrder] = useState(null)
  const [bulkAction, setBulkAction] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [agencyModalOpen, setAgencyModalOpen] = useState(false)
  const [orderForAgency, setOrderForAgency] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)

  // Real-time polling for orders - 1 second
  useEffect(() => {
    if (!isRealTimeActive) return

    const refreshOrders = async () => {
      try {
        // Trigger parent component refresh or call API
        if (onOrderUpdate) {
          onOrderUpdate();
        }
        setLastUpdate(new Date())
      } catch (err) {
        console.error('Error refreshing orders:', err)
      }
    }

    // Poll every 1 second for real-time updates
    const intervalId = setInterval(refreshOrders, 1000)
    return () => clearInterval(intervalId)
  }, [isRealTimeActive, onOrderUpdate])

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'yellow', icon: '⏳', label: 'Pending', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
    processing: { color: 'blue', icon: '⚙️', label: 'Processing', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
    shipped: { color: 'purple', icon: '📦', label: 'Shipped', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
    delivered: { color: 'green', icon: '✓', label: 'Delivered', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
    cancelled: { color: 'red', icon: '✕', label: 'Cancelled', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' }
  }

  // Calculate order age
  const getOrderAge = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    
    let result = [...orders]

    // Status filter
    if (activeFilter && activeFilter !== 'all') {
      result = result.filter(o => o.status === activeFilter)
    }

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(o =>
        (o.buyer?.name && o.buyer.name.toLowerCase().includes(query)) ||
        (o.buyer?.email && o.buyer.email.toLowerCase().includes(query)) ||
        (o.buyer?.phone && o.buyer.phone.toLowerCase().includes(query)) ||
        (o.id && o.id.toLowerCase().includes(query))
      )
    }

    // Sort
    if (sortBy) {
      switch (sortBy) {
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'oldest':
          result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          break
        case 'highest':
          result.sort((a, b) => (b.totals?.total || 0) - (a.totals?.total || 0))
          break
        case 'lowest':
          result.sort((a, b) => (a.totals?.total || 0) - (b.totals?.total || 0))
          break
        default:
          break
      }
    }

    return result
  }, [orders, activeFilter, searchQuery, sortBy])

  // Order statistics
  const stats = useMemo(() => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
      averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0) / orders.length) : 0,
      newOrders: orders.filter(o => {
        const created = new Date(o.createdAt)
        const now = new Date()
        return (now - created) < 24 * 60 * 60 * 1000 // Last 24 hours
      }).length,
      totalItems: orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)
    }
    return stats
  }, [orders])

  // Handle status update
  const handleStatusChange = async (orderId, newStatus, order) => {
    console.debug('🔍 handleStatusChange called', { 
      orderId, 
      newStatus, 
      currentStatus: order.status,
      hasAgencies: order.buyer?.agencies?.length || 0,
      agencies: order.buyer?.agencies
    })
    
    // If changing FROM pending TO another status, show agency selection modal
    if (order.status === 'pending' && newStatus !== 'pending') {
      console.debug('✅ Showing agency modal for pending order')
      setOrderForAgency(order)
      setPendingStatusChange({ orderId, newStatus })
      setAgencyModalOpen(true)
      return
    }

    console.debug('⏭️ Proceeding with direct status change')
    // Otherwise, proceed with the status change directly
    await completeStatusChange(orderId, newStatus, order)
  }

  // Complete the status change (either directly or after agency selection)
  const completeStatusChange = async (orderId, newStatus, order, selectedAgency = null) => {
    try {
      console.debug('🔄 Status change initiated')
      console.debug('Updating order:', { orderId, newStatus, token: !!token, agency: selectedAgency })
      console.debug('📝 Order object:', order)
      
      const updateData = {
        status: newStatus,
        deliveryAgency: selectedAgency || order.deliveryAgency || ''
      }
      
      const resp = await axios.put(`/api/admin/orders/${orderId}`, 
        updateData, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.debug('Status update response:', resp.data)
      console.debug('✅ Response received, calling onOrderUpdate')
      onOrderUpdate(orderId, resp.data, false)
    } catch (err) {
      console.error('❌ Status update error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error message:', err.message)
      showMessage('error', err.response?.data?.error || 'Failed to update order status')
    }
  }

  // Handle payment status update
  const handlePaymentStatusUpdate = async (orderId, isPaid, paidAmount) => {
    try {
      console.debug('💳 Payment status update initiated', { orderId, isPaid, paidAmount })
      
      const updateData = {
        isPaid,
        paidAmount: isPaid ? (paidAmount || 0) : 0
      }
      
      const resp = await axios.put(`/api/admin/orders/${orderId}`, 
        updateData, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.debug('Payment update response:', resp.data)
      onOrderUpdate(orderId, resp.data, false)
      showMessage('success', `Payment status updated to ${isPaid ? 'Paid' : 'Pending'}`)
    } catch (err) {
      console.error('❌ Payment update error:', err)
      showMessage('error', err.response?.data?.error || 'Failed to update payment status')
    }
  }

  // Handle agency selection from modal
  const handleAgencySelect = async (agencyIndex) => {
    if (!pendingStatusChange || !orderForAgency) return

    let agencyName = ''
    const agencies = orderForAgency.buyer?.agencies || []
    
    if (agencies[agencyIndex]) {
      const selectedAgency = agencies[agencyIndex]
      // Handle both string and object formats
      if (typeof selectedAgency === 'string') {
        agencyName = selectedAgency
      } else if (typeof selectedAgency === 'object' && selectedAgency.name) {
        agencyName = selectedAgency.name
      } else {
        agencyName = `Agency ${agencyIndex + 1}`
      }
    }

    await completeStatusChange(
      pendingStatusChange.orderId,
      pendingStatusChange.newStatus,
      orderForAgency,
      agencyName
    )

    // Close modal and reset
    setAgencyModalOpen(false)
    setOrderForAgency(null)
    setPendingStatusChange(null)
  }

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return
    try {
      console.debug('Bulk updating orders:', { count: selectedOrders.length, newStatus: bulkAction })
      const responses = []
      for (const orderId of selectedOrders) {
        const resp = await axios.put(`/api/admin/orders/${orderId}`, 
          { status: bulkAction }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        responses.push(resp.data)
      }
      console.debug('Bulk update completed:', responses.length, 'orders')
      setSelectedOrders([])
      setBulkAction('')
      onOrderUpdate(null, null, false)
    } catch (err) {
      console.error('Bulk update error:', err.response?.data || err.message)
      showMessage('error', err.response?.data?.error || 'Failed to perform bulk action')
    }
  }

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return
    try {
      console.debug('Deleting order:', orderId)
      await axios.delete(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.debug('Order deleted successfully')
      onOrderUpdate(orderId, null, true)
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message)
      showMessage('error', err.response?.data?.error || 'Failed to delete order')
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    // Auto-hide after 1.5 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 1500)
  }

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Agency Selection Modal */}
      <AgencySelectModal
        isOpen={agencyModalOpen}
        order={orderForAgency}
        onClose={() => {
          setAgencyModalOpen(false)
          setOrderForAgency(null)
          setPendingStatusChange(null)
        }}
        onSelectAgency={handleAgencySelect}
      />

      {/* Platform Reset Notice */}
      {resetStatus?.isReset && (
        <div className="bg-orange-100 border-l-4 border-orange-600 p-4 rounded-lg">
          <p className="font-bold text-orange-900">🔄 Platform Reset Active</p>
          <p className="text-sm text-orange-800 mt-1">All orders are temporarily hidden. Restore your data to display them again.</p>
        </div>
      )}

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

      {/* Live Status Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-semibold text-gray-700">
            {isRealTimeActive ? '🟢 Live Orders' : '⊙ Paused'}
          </span>
          <span className="text-xs text-gray-500">Updated: {lastUpdate.toLocaleTimeString()}</span>
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

      {/* Order Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon="📊"
          color="blue"
          onClick={() => setActiveFilter('all')}
          active={activeFilter === 'all'}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="⏳"
          color="yellow"
          onClick={() => setActiveFilter('pending')}
          active={activeFilter === 'pending'}
        />
        <StatCard
          label="Processing"
          value={stats.processing}
          icon="⚙️"
          color="blue"
          onClick={() => setActiveFilter('processing')}
          active={activeFilter === 'processing'}
        />
        <StatCard
          label="Shipped"
          value={stats.shipped}
          icon="📦"
          color="purple"
          onClick={() => setActiveFilter('shipped')}
          active={activeFilter === 'shipped'}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon="✓"
          color="green"
          onClick={() => setActiveFilter('delivered')}
          active={activeFilter === 'delivered'}
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          icon="✕"
          color="red"
          onClick={() => setActiveFilter('cancelled')}
          active={activeFilter === 'cancelled'}
        />
      </div>

      {/* Revenue & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricBox label="Total Revenue" value={`XAF ${stats.totalRevenue.toLocaleString()}`} color="blue" icon="💰" />
        <MetricBox label="Avg Order Value" value={`XAF ${stats.averageOrderValue.toLocaleString()}`} color="green" icon="💵" />
        <MetricBox label="New Orders (24h)" value={stats.newOrders} color="orange" icon="🆕" highlight={stats.newOrders > 0} />
        <MetricBox label="Total Items" value={stats.totalItems} color="purple" icon="📦" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Search Orders</label>
            <input
              type="text"
              placeholder="Name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Value</option>
              <option value="lowest">Lowest Value</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value || '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bulk Action */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Bulk Update Status</label>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status...</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Apply Bulk Action */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || selectedOrders.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Apply to {selectedOrders.length}
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">{resetStatus?.isReset ? '🔄' : '📭'}</div>
            <p className="text-gray-600 text-lg font-semibold">
              {resetStatus?.isReset ? 'All Orders Temporarily Deleted' : (searchQuery || activeFilter !== 'all' ? 'No orders match your filters' : 'No orders yet')}
            </p>
            {resetStatus?.isReset && (
              <p className="text-sm text-gray-500 mt-2">Your orders will reappear when you restore the platform data.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 text-left font-bold">Order Info</th>
                  <th className="px-4 py-4 text-left font-bold">Buyer</th>
                  <th className="px-4 py-4 text-left font-bold">Items</th>
                  <th className="px-4 py-4 text-left font-bold">Total</th>
                  <th className="px-4 py-4 text-left font-bold">Delivery</th>
                  <th className="px-4 py-4 text-left font-bold">Payment</th>
                  <th className="px-4 py-4 text-left font-bold">Status</th>
                  <th className="px-4 py-4 text-left font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      new Date() - new Date(order.createdAt) < 24 * 60 * 60 * 1000 ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-xs text-gray-600">{order.id.slice(0, 8)}...</div>
                        <div className="text-sm text-gray-600">{order.region}</div>
                        <div className="text-xs text-gray-500">{getOrderAge(order.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{order.buyer?.name}</div>
                        <div className="text-xs text-gray-600">{order.buyer?.phone}</div>
                        <div className="text-xs text-gray-600">{order.buyer?.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {order.items?.length} item(s)
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">XAF {(order.totals?.total || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Shipping: XAF {(order.shippingFee || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                          order.deliveryOption === 'ship' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {order.deliveryOption === 'ship' ? '🚚 Shipping' : '🏪 Pickup'}
                        </span>
                        {order.region && <div className="text-xs text-gray-600 mt-1">{order.region}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                          order.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                        </span>
                        {order.paymentMethod && <div className="text-xs text-gray-600 mt-1">{order.paymentMethod.toUpperCase()}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            console.debug('📌 Status dropdown changed for order', order.id, 'from', order.status, 'to', e.target.value)
                            handleStatusChange(order.id, e.target.value, order)
                          }}
                          className={`px-3 py-2 rounded-lg font-semibold text-sm border-2 ${statusConfig[order.status]?.badge}`}
                        >
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition mr-2 w-20"
                        >
                          {expandedOrderId === order.id ? 'Hide' : 'View'}
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Order Details */}
                    {expandedOrderId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="9" className="px-6 py-6">
                          <div className="space-y-6">
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">Order Details</h4>
                                <p className="text-sm text-gray-600">ID: {order.id}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => onViewReceipt(order)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                                >
                                  🧾 View Receipt
                                </button>
                                <span className="text-3xl">{statusConfig[order.status]?.icon}</span>
                              </div>
                            </div>

                            {/* Buyer Information */}
                            <div className="grid grid-cols-2 gap-6">
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                                <h5 className="font-bold text-blue-900 mb-3 flex items-center gap-2">👤 Buyer Information</h5>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div><span className="font-semibold">Name:</span> {order.buyer?.name}</div>
                                  <div><span className="font-semibold">Email:</span> {order.buyer?.email}</div>
                                  <div><span className="font-semibold">Phone:</span> {order.buyer?.phone}</div>
                                  <div><span className="font-semibold">Address:</span> {order.buyer?.address || 'N/A'}</div>
                                  <div className="pt-2 border-t border-blue-200">
                                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                      📧 {order.buyer?.email ? 'Email Available' : 'No Email'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                <h5 className="font-bold text-green-900 mb-3 flex items-center gap-2">📦 Delivery Information</h5>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">Delivery Method:</span>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                      order.deliveryOption === 'ship' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {order.deliveryOption === 'ship' ? '🚚 Shipping' : '🏪 Pickup in Store'}
                                    </span>
                                  </div>
                                  <div><span className="font-semibold">Region:</span> {order.region}</div>
                                  <div><span className="font-semibold">Shipping Fee:</span> XAF {(order.shippingFee || 0).toLocaleString()}</div>
                                  <div><span className="font-semibold">Date Ordered:</span> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</div>
                                  <div><span className="font-semibold">Agency:</span> {order.deliveryAgency || 'Not yet assigned'}</div>
                                  {order.deliveryOption === 'pickup' && order.buyer?.pickupLocation && (
                                    <div className="pt-2 border-t border-green-200">
                                      <span className="font-semibold">Pickup Location:</span> {order.buyer.pickupLocation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Special Instructions */}
                            {order.specialInstructions && (
                              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4 border-2 border-violet-300">
                                <h5 className="font-bold text-violet-900 mb-3 flex items-center gap-2">📝 Special Instructions</h5>
                                <div className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-violet-200 italic">
                                  {order.specialInstructions}
                                </div>
                              </div>
                            )}

                            {/* Payment & Status Information */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                                <h5 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">💳 Payment Status</h5>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-block w-3 h-3 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="font-bold">{order.isPaid ? '✅ Payment Received' : '⏳ Awaiting Payment'}</span>
                                  </div>
                                  <div><span className="font-semibold">Payment Method:</span> {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'Cash on Delivery'}</div>
                                  {order.paidAmount > 0 && (
                                    <div><span className="font-semibold">Paid Amount:</span> XAF {order.paidAmount.toLocaleString()}</div>
                                  )}
                                  
                                  {/* Payment Update Controls for Pickup Orders */}
                                  {order.deliveryOption === 'pickup' && order.paymentMethod?.toLowerCase() === 'cash' && (
                                    <div className="pt-2 border-t border-yellow-300 space-y-2">
                                      <p className="text-xs text-yellow-900 font-semibold">💰 Update Payment:</p>
                                      {!order.isPaid ? (
                                        <button
                                          onClick={() => handlePaymentStatusUpdate(order.id, true, order.totals?.total || 0)}
                                          className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition"
                                        >
                                          ✅ Mark as Paid
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePaymentStatusUpdate(order.id, false, 0)}
                                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition"
                                        >
                                          ⏳ Mark as Pending
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                                <h5 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">📊 Order Status</h5>
                                <div className="space-y-3 text-sm">
                                  {/* For pickup orders, show payment focus instead of delivery status */}
                                  {order.deliveryOption === 'pickup' ? (
                                    <div>
                                      <div><span className="font-semibold">Order Number:</span> {order.orderNumber || order.id.slice(0, 8)}</div>
                                      <div className="pt-2 mt-2 border-t border-indigo-200">
                                        <p className="text-xs font-semibold text-indigo-700 mb-2">Payment Priority:</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                          order.isPaid
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {order.isPaid ? '✅ PAID' : '🔴 NOT PAID'}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">{statusConfig[order.status]?.icon}</span>
                                        <span className="font-bold text-indigo-900">{statusConfig[order.status]?.label}</span>
                                      </div>
                                      <div><span className="font-semibold">Order Number:</span> {order.orderNumber || order.id.slice(0, 8)}</div>
                                      <div className="pt-1 text-xs text-indigo-700">{getOrderAge(order.createdAt)}</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-200">
                                <h5 className="font-bold text-rose-900 mb-3 flex items-center gap-2">💰 Financial Summary</h5>
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-semibold">Subtotal:</span> XAF {(order.totals?.subtotal || 0).toLocaleString()}</div>
                                  {order.totals?.discount > 0 && (
                                    <div className="text-green-700"><span className="font-semibold">Discount:</span> -XAF {(order.totals?.discount || 0).toLocaleString()}</div>
                                  )}
                                  <div className="border-t border-rose-200 pt-2 font-bold text-lg text-rose-900">
                                    Total: XAF {(order.totals?.total || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div>
                              <h5 className="font-bold text-gray-900 mb-3">Items Ordered</h5>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Product</th>
                                      <th className="px-4 py-2 text-center">Price</th>
                                      <th className="px-4 py-2 text-center">Qty</th>
                                      <th className="px-4 py-2 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items?.map((item, idx) => (
                                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold text-gray-900">{item.name}</td>
                                        <td className="px-4 py-2 text-center">XAF {(item.price || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-center font-semibold">{item.quantity}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                          XAF {((item.price || 0) * item.quantity).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                              <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-gray-600 font-semibold">Subtotal</div>
                                  <div className="text-lg font-bold text-gray-900">XAF {(order.totals?.subtotal || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 font-semibold">Tax (5%)</div>
                                  <div className="text-lg font-bold text-gray-900">XAF {(order.totals?.tax || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 font-semibold">Shipping</div>
                                  <div className="text-lg font-bold text-gray-900">XAF {(order.shippingFee || 0).toLocaleString()}</div>
                                </div>
                                <div className="bg-white rounded-lg p-2">
                                  <div className="text-xs text-gray-600 font-semibold">TOTAL</div>
                                  <div className="text-2xl font-bold text-green-600">XAF {(order.totals?.total || 0).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-600 font-semibold">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color, onClick, active }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
  }

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition ${colors[color]} ${active ? 'ring-2 ring-offset-2 ring-current' : ''}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-semibold">{label}</div>
    </button>
  )
}

// Metric Box Component
function MetricBox({ label, value, color, icon, highlight }) {
  const colors = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-blue-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-900 border-green-200',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900 border-orange-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-900 border-purple-200'
  }

  return (
    <div className={`p-6 rounded-xl border-2 ${colors[color]} ${highlight ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold opacity-75 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}
