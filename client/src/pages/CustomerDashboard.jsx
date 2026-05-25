import React, { useState, useEffect } from 'react'import toast from 'react-hot-toast'

import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState(null)
  const [orders, setOrders] = useState([])
  const [installmentPlans, setInstallmentPlans] = useState([])
  const [addresses, setAddresses] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({ street: '', city: '', phone: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    const email = localStorage.getItem('customerEmail')
    const name = localStorage.getItem('customerName')
    const isSubAdmin = localStorage.getItem('isSubAdmin') === 'true'

    if (!token) {
      navigate('/customer-signup')
      return
    }

    // If sub-admin logged in, redirect to admin dashboard
    if (isSubAdmin) {
      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminEmail', email)
      navigate('/admin-dashboard')
      return
    }

    setCustomerData({
      name: name || 'Customer',
      email: email || 'user@example.com',
      joinedDate: new Date().toLocaleDateString(),
      loyaltyPoints: 1250,
      memberTier: 'Silver'
    })

    axios
      .get('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setOrders(res.data || []))
      .catch(err => console.error('Failed to load orders:', err))

    axios
      .get('/api/customer/installment-plans', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setInstallmentPlans(res.data || []))
      .catch(err => console.error('Failed to load plans:', err))

    const saved = localStorage.getItem('customerAddresses')
    if (saved) setAddresses(JSON.parse(saved))

    setLoading(false)
  }, [navigate])

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.phone) {
      toast('Please fill all fields')
      return
    }
    const updated = [...addresses, { ...newAddress, id: Date.now() }]
    setAddresses(updated)
    localStorage.setItem('customerAddresses', JSON.stringify(updated))
    setNewAddress({ street: '', city: '', phone: '' })
    setShowAddressForm(false)
  }

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id)
    setAddresses(updated)
    localStorage.setItem('customerAddresses', JSON.stringify(updated))
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerEmail')
    localStorage.removeItem('customerName')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">👤 My Dashboard</h1>
              <p className="text-gray-600">Welcome back, <span className="font-bold text-blue-600">{customerData?.name}</span>!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              Logout
            </button>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2 rounded-full font-bold">
              ⭐ {customerData?.memberTier} Member
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
              🎁 {customerData?.loyaltyPoints} Loyalty Points
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 flex-wrap">
          {['overview', 'orders', 'installments', 'addresses', 'profile', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'orders' && '📦 Orders'}
              {tab === 'installments' && '💳 Installments'}
              {tab === 'addresses' && '📍 Addresses'}
              {tab === 'profile' && '👤 Profile'}
              {tab === 'settings' && '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-blue-100">Total Orders</p>
                <p className="text-5xl font-bold mt-2">{orders.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-100">Completed Orders</p>
                <p className="text-5xl font-bold mt-2">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg p-6">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-orange-100">Total Spent</p>
                <p className="text-5xl font-bold mt-2">{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} XAF</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-purple-100">Active Plans</p>
                <p className="text-5xl font-bold mt-2">{installmentPlans.filter(p => p.status === 'active').length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/products" className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center transition">
                  <div className="text-4xl mb-2">🛍️</div>
                  <p className="font-bold text-gray-800">Continue Shopping</p>
                </Link>
                <Link to="/cart" className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-300 rounded-lg p-4 text-center transition">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="font-bold text-gray-800">View Cart</p>
                </Link>
                <Link to="/track-order" className="bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center transition">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="font-bold text-gray-800">Track Orders</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Your Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg">No orders yet</p>
                <p className="text-gray-500 mt-2">Start shopping to create your first order</p>
                <Link to="/products" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Order ID</p>
                        <p className="font-bold text-gray-800">{order.id?.substring(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Date</p>
                        <p className="font-bold text-gray-800">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Items</p>
                        <p className="font-bold text-gray-800">{order.items?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Total</p>
                        <p className="font-bold text-blue-600">{order.total?.toLocaleString() || '0'} XAF</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Status</p>
                        <p className={`font-bold ${
                          order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'processing' ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {order.status?.toUpperCase() || 'PENDING'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Installment Plans Tab */}
        {activeTab === 'installments' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💳 Installment Plans</h2>
            {installmentPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600 text-lg">No active installment plans</p>
                <p className="text-gray-500 mt-2">Buy items in installments when you checkout</p>
                <Link to="/products" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                  Shop with Installments
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {installmentPlans.map(plan => (
                  <div key={plan.id} className="border-l-4 border-blue-600 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Plan ID</p>
                        <p className="font-bold text-gray-800">{plan.id?.substring(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Total Amount</p>
                        <p className="font-bold text-gray-800">{plan.totalAmount?.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Monthly Payment</p>
                        <p className="font-bold text-blue-600">{plan.monthlyPayment?.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Duration</p>
                        <p className="font-bold text-gray-800">{plan.duration} months</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Paid</p>
                        <p className="font-bold text-green-600">{plan.paid?.toLocaleString() || '0'} XAF</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Status</p>
                        <p className={`font-bold ${
                          plan.status === 'active' ? 'text-orange-600' :
                          plan.status === 'completed' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {plan.status?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                <strong>💡 Installment Tips:</strong> Spread payments over 3, 6, or 12 months. First month is 1.5x, others are equal.
              </p>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📍 Delivery Addresses</h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition"
              >
                + Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddAddress}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition"
                  >
                    Save Address
                  </button>
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg">No saved addresses</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <p className="font-bold text-gray-800 mb-2">📍 {addr.city}</p>
                    <p className="text-gray-600 text-sm mb-2">{addr.street}</p>
                    <p className="text-gray-600 text-sm mb-4">📞 {addr.phone}</p>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded font-bold text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Profile Information</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Name</p>
                <p className="text-lg font-bold text-gray-800">{customerData?.name}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Email</p>
                <p className="text-lg font-bold text-gray-800">{customerData?.email}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Member Since</p>
                <p className="text-lg font-bold text-gray-800">{customerData?.joinedDate}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Member Tier</p>
                <p className="text-lg font-bold text-amber-600">⭐ {customerData?.memberTier}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-700">
                  <strong>🎯 Next Tier:</strong> Gold tier unlocks at 5000 points with exclusive discounts and priority support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Account Settings</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive order updates and promotions</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>
              </div>
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Get SMS updates on deliveries</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>
              </div>
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">Newsletter</p>
                    <p className="text-sm text-gray-600">Subscribe to deals and new products</p>
                  </div>
                  <input type="checkbox" className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4">
                <button className="bg-red-100 hover:bg-red-200 text-red-600 px-6 py-2 rounded-lg font-bold transition">
                  🔒 Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
