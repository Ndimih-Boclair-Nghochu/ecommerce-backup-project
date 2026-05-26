import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../lib/api'
import { formatXAF, getProductImage } from '../utils/format'

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState(null)
  const [orders, setOrders] = useState([])
  const [installmentPlans, setInstallmentPlans] = useState([])
  const [productUpdates, setProductUpdates] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [paymentInputs, setPaymentInputs] = useState({})
  const navigate = useNavigate()

  const token = localStorage.getItem('customerToken')

  const loadDashboard = async () => {
    if (!token) {
      navigate('/customer-signup')
      return
    }

    setLoading(true)
    try {
      const [profileRes, ordersRes, plansRes, updatesRes] = await Promise.all([
        axios.get('/api/customer/profile', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/customer/orders', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/customer/installment-plans', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/customer/product-updates', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setCustomerData(profileRes.data)
      setOrders(ordersRes.data || [])
      setInstallmentPlans(plansRes.data || [])
      setProductUpdates(updatesRes.data || [])
      localStorage.setItem('customerEmail', profileRes.data.email)
      localStorage.setItem('customerName', profileRes.data.name)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('customerToken')
        navigate('/customer-login')
        return
      }
      toast.error('Could not load your account dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [token])

  const transactions = useMemo(() => {
    const orderRows = orders.map((order) => ({
      id: order.id,
      type: 'Order',
      title: `Order ${order.id?.slice(0, 8)}`,
      amount: order.totals?.total || order.total || 0,
      status: order.status || 'pending',
      createdAt: order.createdAt
    }))
    const paymentRows = installmentPlans.flatMap((plan) => (plan.payments || []).map((payment) => ({
      id: payment.id,
      type: 'Installment Payment',
      title: plan.productName,
      amount: payment.amount || 0,
      status: plan.status,
      createdAt: payment.createdAt
    })))
    return [...orderRows, ...paymentRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, installmentPlans])

  const totalSpent = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const activePlans = installmentPlans.filter((plan) => ['approved', 'active'].includes(plan.status))

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerEmail')
    localStorage.removeItem('customerName')
    localStorage.removeItem('isSubAdmin')
    navigate('/')
  }

  const submitInstallmentPayment = async (plan) => {
    const amount = Number(paymentInputs[plan.id])
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }
    try {
      const response = await axios.post(
        `/api/customer/installment-plans/${plan.id}/payments`,
        { amount, paymentMethod: 'manual', note: 'Customer deposit submitted' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setInstallmentPlans((current) => current.map((item) => item.id === plan.id ? response.data : item))
      setPaymentInputs((current) => ({ ...current, [plan.id]: '' }))
      toast.success('Payment recorded and sent to the shop')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment could not be recorded')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-900">Loading your dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Customer account</p>
              <h1 className="mt-2 text-3xl font-black text-gray-950">Welcome, {customerData?.name || 'Customer'}</h1>
              <p className="mt-1 text-sm text-gray-600">{customerData?.email}</p>
            </div>
            <button onClick={handleLogout} className="rounded-md bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">
              Logout
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {[
              ['overview', 'Overview'],
              ['transactions', 'Transactions'],
              ['installments', 'Installments'],
              ['updates', 'Product Updates'],
              ['profile', 'Profile']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-black ${activeTab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Orders" value={orders.length} />
            <SummaryCard label="Transactions" value={transactions.length} />
            <SummaryCard label="Active Plans" value={activePlans.length} />
            <SummaryCard label="Total Activity" value={formatXAF(totalSpent)} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <Panel title="All Transactions">
            {transactions.length ? (
              <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div>
                      <p className="font-black text-gray-950">{transaction.title}</p>
                      <p className="text-sm text-gray-500">{transaction.type} - {new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="font-black text-blue-800">{formatXAF(transaction.amount)}</p>
                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase text-gray-700">{transaction.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No transactions yet. Orders and installment payments will appear here." />
            )}
          </Panel>
        )}

        {activeTab === 'installments' && (
          <Panel title="Installment Plans">
            {installmentPlans.length ? (
              <div className="space-y-4">
                {installmentPlans.map((plan) => (
                  <article key={plan.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="grid gap-4 md:grid-cols-[96px_1fr]">
                      <img src={getProductImage({ image: plan.productImage })} alt={plan.productName} className="h-24 w-24 rounded-lg object-cover bg-gray-100" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-gray-950">{plan.productName}</h3>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-800">{plan.status}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-4">
                          <p><span className="font-bold">Total:</span> {formatXAF(plan.totalAmount)}</p>
                          <p><span className="font-bold">Paid:</span> {formatXAF(plan.paidAmount)}</p>
                          <p><span className="font-bold">Remaining:</span> {formatXAF(plan.remainingAmount)}</p>
                          <p><span className="font-bold">Due:</span> {plan.dueDate ? new Date(plan.dueDate).toLocaleDateString() : 'After approval'}</p>
                        </div>
                        {plan.status === 'pending' && <p className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-900">Waiting for admin approval before deposits can start.</p>}
                        {plan.status === 'refunded' && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">Refund due after charges: {formatXAF(plan.refundedAmount)}</p>}
                        {['approved', 'active'].includes(plan.status) && (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <input
                              type="number"
                              min="1"
                              value={paymentInputs[plan.id] || ''}
                              onChange={(event) => setPaymentInputs((current) => ({ ...current, [plan.id]: event.target.value }))}
                              placeholder={`Deposit at least ${formatXAF(plan.depositRequired)}`}
                              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2"
                            />
                            <button onClick={() => submitInstallmentPayment(plan)} className="rounded-md bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800">
                              Record Deposit
                            </button>
                          </div>
                        )}
                        {plan.payments?.length > 0 && (
                          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                            <p className="font-black text-gray-900">Payment records</p>
                            {plan.payments.map((payment) => (
                              <p key={payment.id} className="mt-1 text-gray-700">{formatXAF(payment.amount)} - {new Date(payment.createdAt).toLocaleString()}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No installment plans yet. Eligible products can be requested from their product page." />
            )}
          </Panel>
        )}

        {activeTab === 'updates' && (
          <Panel title="Latest Product Updates">
            {productUpdates.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productUpdates.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`} className="rounded-xl border border-gray-200 p-3 transition hover:border-blue-300 hover:shadow-sm">
                    <img src={getProductImage(product)} alt={product.name} className="h-40 w-full rounded-lg object-cover bg-gray-100" />
                    <p className="mt-3 font-black text-gray-950">{product.name}</p>
                    <p className="mt-1 text-sm font-bold text-blue-800">{formatXAF(product.price)}</p>
                    {product.installmentAvailable && <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Installments available</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="No product updates yet." />
            )}
          </Panel>
        )}

        {activeTab === 'profile' && (
          <Panel title="Profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Name" value={customerData?.name} />
              <Info label="Email" value={customerData?.email} />
              <Info label="Phone" value={customerData?.phone || 'Not set'} />
              <Info label="Address" value={customerData?.address || 'Not set'} />
            </div>
          </Panel>
        )}
      </section>
    </main>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-950">{value}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-gray-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function EmptyState({ text }) {
  return <p className="rounded-lg bg-gray-50 p-6 text-center font-semibold text-gray-600">{text}</p>
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-black uppercase text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-gray-950">{value}</p>
    </div>
  )
}
