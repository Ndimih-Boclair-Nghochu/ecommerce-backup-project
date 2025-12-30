import React, { useState, useMemo } from 'react'
import axios from 'axios'

export default function OrderManagement({ orders = [], onOrderUpdate, token, onViewReceipt = () => {} }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrders, setSelectedOrders] = useState([])
  const [viewingOrder, setViewingOrder] = useState(null)
  const [bulkAction, setBulkAction] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

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
    try {
      console.log('🔄 Status change initiated')
      console.log('Updating order:', { orderId, newStatus, token: !!token })
      console.log('📝 Order object:', order)
      const resp = await axios.put(`/api/admin/orders/${orderId}`, 
        { status: newStatus, deliveryAgency: order.deliveryAgency || '' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Status update response:', resp.data)
      console.log('✅ Response received, calling onOrderUpdate')
      onOrderUpdate(orderId, resp.data, false)
      showMessage('success', 'Order status updated ✓')
    } catch (err) {
      console.error('❌ Status update error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error message:', err.message)
      showMessage('error', err.response?.data?.error || 'Failed to update order status')
    }
  }

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return
    try {
      console.log('Bulk updating orders:', { count: selectedOrders.length, newStatus: bulkAction })
      const responses = []
      for (const orderId of selectedOrders) {
        const resp = await axios.put(`/api/admin/orders/${orderId}`, 
          { status: bulkAction }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        responses.push(resp.data)
      }
      console.log('Bulk update completed:', responses.length, 'orders')
      setSelectedOrders([])
      setBulkAction('')
      onOrderUpdate(null, null, false)
      showMessage('success', `✓ Updated ${selectedOrders.length} order(s) successfully`)
    } catch (err) {
      console.error('Bulk update error:', err.response?.data || err.message)
      showMessage('error', err.response?.data?.error || 'Failed to perform bulk action')
    }
  }

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return
    try {
      console.log('Deleting order:', orderId)
      await axios.delete(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Order deleted successfully')
      onOrderUpdate(orderId, null, true)
      showMessage('success', 'Order deleted successfully ✓')
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message)
      showMessage('error', err.response?.data?.error || 'Failed to delete order')
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
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
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg font-semibold">
              {searchQuery || activeFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
            </p>
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
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value, order)}
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
                        <td colSpan="7" className="px-6 py-6">
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
                              <div>
                                <h5 className="font-bold text-gray-900 mb-3">Buyer Information</h5>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div><span className="font-semibold">Name:</span> {order.buyer?.name}</div>
                                  <div><span className="font-semibold">Email:</span> {order.buyer?.email}</div>
                                  <div><span className="font-semibold">Phone:</span> {order.buyer?.phone}</div>
                                  <div><span className="font-semibold">Address:</span> {order.buyer?.address}</div>
                                </div>
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900 mb-3">Delivery Information</h5>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div><span className="font-semibold">Region:</span> {order.region}</div>
                                  <div><span className="font-semibold">Shipping Fee:</span> XAF {(order.shippingFee || 0).toLocaleString()}</div>
                                  <div><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</div>
                                  <div><span className="font-semibold">Agency:</span> {order.deliveryAgency || 'Not selected'}</div>
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
