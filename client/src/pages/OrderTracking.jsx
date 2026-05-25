import React, { useState } from 'react'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import Receipt from '../components/Receipt'
import { formatXAF, getProductImage } from '../utils/format'

const steps = ['pending', 'processing', 'shipped', 'delivered']

function StatusStepper({ status }) {
  const currentIndex = steps.indexOf(status)
  const cancelled = status === 'cancelled'

  if (cancelled) {
    return <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">This order was cancelled.</div>
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => {
        const active = index <= currentIndex
        return (
          <div key={step} className="text-center">
            <div className={`mx-auto h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {index + 1}
            </div>
            <p className={`mt-2 text-xs font-semibold capitalize ${active ? 'text-blue-800' : 'text-gray-500'}`}>{step}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderTracking({ settings }) {
  const [orders, setOrders] = useState([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!email.trim() && !phone.trim()) {
      toast.error('Enter your email or phone number')
      return
    }

    setLoading(true)
    try {
      const response = await axios.get('/api/orders/search', { params: { email, phone } })
      const sorted = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setOrders(sorted)
      setSearched(true)
    } catch {
      toast.error('Failed to fetch orders')
      setOrders([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {selectedOrder && <Receipt order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">Track Your Order</h1>
          <p className="mt-3 text-gray-600">Search with the email or phone number used at checkout.</p>
        </div>

        <form onSubmit={handleSearch} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Phone</label>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="md:self-end rounded-md bg-blue-700 px-5 py-2 font-bold text-white hover:bg-blue-800 disabled:bg-gray-300">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && (
          <div className="mt-8">
            {orders.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-bold text-gray-950">No orders found</h2>
                <p className="mt-2 text-gray-600">
                  Please check your details or contact support at {settings?.shopPhone || '+237 6 52 882 753'}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-950">Your Orders ({orders.length})</h2>
                {orders.map((order) => (
                  <article key={order.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Order ID</p>
                        <p className="font-mono font-bold text-gray-950">{order.id}</p>
                        <p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-blue-800">{formatXAF(order.totals?.total || order.total)}</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-5">
                      <StatusStepper status={order.status} />
                      <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div><span className="text-gray-500">Region:</span> <span className="font-semibold">{order.region}</span></div>
                        <div><span className="text-gray-500">Status:</span> <span className="font-semibold capitalize">{order.status}</span></div>
                        <div><span className="text-gray-500">Items:</span> <span className="font-semibold">{order.items?.length || 0}</span></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(order.items || []).slice(0, 4).map((item) => (
                          <div key={`${order.id}-${item.id}`} className="rounded-md bg-gray-50 p-2 flex gap-2 items-center">
                            <img src={item.selectedImageUrl || item.image || getProductImage(item)} alt={item.name} className="h-12 w-12 rounded object-cover bg-gray-100" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
                        View Receipt
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
