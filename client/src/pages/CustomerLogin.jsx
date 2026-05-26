import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/customer/login', { email, password })
      const customer = response.data.customer || {}
      localStorage.setItem('customerToken', response.data.token)
      localStorage.setItem('customerEmail', customer.email || email)
      localStorage.setItem('customerName', customer.name || 'Customer')
      
      // Check if user is a sub-admin
      if (response.data.isSubAdmin) {
        localStorage.setItem('isSubAdmin', 'true')
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminEmail', customer.email || email)
        navigate('/admin-dashboard')
      } else {
        localStorage.setItem('isSubAdmin', 'false')
        navigate('/customer-dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Login</h1>
          <p className="text-gray-600 mt-2">Access your dashboard and orders</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">Don't have an account?</p>
          <Link to="/customer-signup" className="text-blue-600 hover:text-blue-700 font-bold">
            Create one here
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-800 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
