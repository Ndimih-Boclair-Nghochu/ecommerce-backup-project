import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/admin/login', { email, password })
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminEmail', response.data.email)
      toast.success('Logged in')
      navigate('/admin-dashboard')
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link to="/" className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
                Back to storefront
              </Link>
              <h1 className="mt-10 text-4xl font-bold leading-tight">Business control center</h1>
              <p className="mt-4 max-w-md text-stone-300">
                Manage products, orders, stock, POS receipts, support messages, locations, and team access from one secure dashboard.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-stone-200">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                Secure JWT authentication for admins and sub-admins.
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                Real business data is protected by environment variables.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-12">
            <div className="mb-8">
              <Link to="/" className="mb-6 inline-flex text-sm font-bold text-amber-700 hover:text-stone-900 lg:hidden">
                Back to storefront
              </Link>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Admin access</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">Sign in securely</h2>
              <p className="mt-3 text-sm text-gray-600">
                Use the admin credentials configured in the server environment.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-100"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-24 text-base shadow-sm focus:border-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 hover:bg-stone-100"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 px-5 py-3.5 font-bold text-white shadow-lg transition hover:from-stone-950 hover:to-stone-900 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
              >
                {loading ? 'Signing in...' : 'Sign in to dashboard'}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              For security, credentials are never displayed in the app. The super admin account is created from the Render environment variables.
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
