import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from '../lib/api'

// Clean, professional analytics view built entirely from real order data.
// Neutral surface + a single blue accent; colour is reserved for meaning
// (green/red trend deltas, muted status badges) so the tab is easy to scan.

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
  { key: 'year', label: '12 months' },
  { key: 'all', label: 'All time' }
]

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
}

const formatXAF = (amount) =>
  'XAF ' + Number(amount || 0).toLocaleString('en-US')

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function Trend({ value }) {
  if (value === null || value === undefined) return null
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}%
      <span className="font-normal text-gray-400">vs prev.</span>
    </span>
  )
}

function StatCard({ label, value, trend, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <div className="mt-1 min-h-[1.25rem]">
        {trend !== undefined && trend !== null ? <Trend value={trend} /> : hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status || 'unknown'}
    </span>
  )
}

const RealTimeStatistics = ({ token }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState('month')
  const [region, setRegion] = useState('all')
  const [updatedAt, setUpdatedAt] = useState(null)
  const requestId = useRef(0)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  // `background` refreshes update the data silently, without blanking the
  // view — that keeps the numbers current without the old per-second flicker.
  const fetchStats = useCallback(async ({ background = false } = {}) => {
    const id = ++requestId.current
    if (background) setRefreshing(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams({ period, region })
      const res = await axios.get(`/api/admin/real-time-stats?${params}`, { headers: authHeaders })
      if (id !== requestId.current) return
      setStats(res.data)
      setUpdatedAt(new Date())
      setError(false)
    } catch (err) {
      if (id !== requestId.current) return
      console.error('Failed to fetch statistics:', err)
      setError(true)
    } finally {
      if (id === requestId.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [period, region, token])

  // Reload when the filters change (visible loading state).
  useEffect(() => {
    fetchStats()
  }, [period, region]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep it current with a quiet 60s background refresh — no flicker.
  useEffect(() => {
    const timer = setInterval(() => fetchStats({ background: true }), 60000)
    return () => clearInterval(timer)
  }, [fetchStats])

  const regions = stats?.availableRegions || []
  const statusEntries = Object.entries(stats?.byStatus || {}).sort((a, b) => b[1] - a[1])

  const downloadReport = () => {
    if (!stats) return
    const periodLabel = PERIODS.find((p) => p.key === period)?.label || period
    const rows = (stats.regionBreakdown || [])
      .map((r) => `<tr><td>${r.name}</td><td style="text-align:right">${formatXAF(r.revenue)}</td><td style="text-align:right">${r.orders}</td><td style="text-align:right">${r.percentage}%</td></tr>`)
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Analytics — ${periodLabel}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:32px}h1{font-size:20px}
table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px}
th{text-align:left;background:#f9fafb}.cards{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
.card{border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;min-width:150px}.card p{margin:0}.card .v{font-size:18px;font-weight:700;margin-top:4px}</style></head>
<body><h1>Analytics report — ${periodLabel}${stats.region !== 'all' ? ' · ' + stats.region : ''}</h1>
<p style="color:#6b7280;font-size:12px">Generated ${new Date().toLocaleString()}</p>
<div class="cards">
<div class="card"><p>Revenue</p><p class="v">${formatXAF(stats.totalRevenue)}</p></div>
<div class="card"><p>Orders</p><p class="v">${stats.totalOrders}</p></div>
<div class="card"><p>Items sold</p><p class="v">${stats.totalItemsSold}</p></div>
<div class="card"><p>Avg order value</p><p class="v">${formatXAF(stats.averageOrderValue)}</p></div>
</div>
<h3 style="font-size:15px">Revenue by region</h3>
<table><thead><tr><th>Region</th><th style="text-align:right">Revenue</th><th style="text-align:right">Orders</th><th style="text-align:right">Share</th></tr></thead>
<tbody>${rows || '<tr><td colspan="4" style="color:#6b7280">No completed sales in this period</td></tr>'}</tbody></table>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !stats) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading statistics…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Platform Analytics</h2>
            <p className="text-xs text-gray-500">
              {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : '—'}
              {refreshing && <span className="ml-2 text-blue-600">refreshing…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats({ background: true })}
              disabled={refreshing}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
            <button
              onClick={downloadReport}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period segmented control */}
          <div className="inline-flex flex-wrap rounded-lg border border-gray-300 bg-gray-50 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  period === p.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Region filter */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not load the latest statistics. Showing the last available data.
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatXAF(stats?.totalRevenue)} trend={stats?.revenueTrend} hint="Completed orders" />
        <StatCard label="Orders" value={(stats?.totalOrders || 0).toLocaleString()} trend={stats?.ordersTrend} hint="All statuses" />
        <StatCard label="Items sold" value={(stats?.totalItemsSold || 0).toLocaleString()} hint="From completed orders" />
        <StatCard label="Avg order value" value={formatXAF(stats?.averageOrderValue)} hint="Completed orders" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue by region */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Revenue by region</h3>
          {(stats?.regionBreakdown || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No completed sales in this period.</p>
          ) : (
            <div className="space-y-3">
              {stats.regionBreakdown.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{r.name}</span>
                    <span className="text-gray-500">{formatXAF(r.revenue)} · {r.orders} order{r.orders !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(r.percentage, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Orders by status</h3>
          {statusEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No orders in this period.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <StatusBadge status={status} />
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-gray-900">Recent orders</h3>
        {(stats?.recentOrders || []).length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No orders in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-2 font-semibold">Customer</th>
                  <th className="px-2 py-2 font-semibold">Region</th>
                  <th className="px-2 py-2 font-semibold text-right">Total</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-2 py-3 font-medium text-gray-900">{order.buyerName || 'Guest'}</td>
                    <td className="px-2 py-3 text-gray-600">{order.region || '—'}</td>
                    <td className="px-2 py-3 text-right font-semibold text-gray-900">{formatXAF(order.total)}</td>
                    <td className="px-2 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-2 py-3 text-gray-500">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeStatistics
