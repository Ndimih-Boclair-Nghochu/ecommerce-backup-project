import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import axios from './lib/api'
import ErrorBoundary from './components/ErrorBoundary'
import { formatXAF } from './utils/format'
import { useLanguage } from './i18n/LanguageContext'

const Home = lazy(() => import('./pages/Home'))
const AllProducts = lazy(() => import('./pages/AllProducts'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Cart = lazy(() => import('./pages/Cart'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const CustomerSignup = lazy(() => import('./pages/CustomerSignup'))
const CustomerLogin = lazy(() => import('./pages/CustomerLogin'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ChatWidget = lazy(() => import('./components/ChatWidget'))

const DEFAULT_SETTINGS = {
  shopName: 'SMART Centre Cameroon',
  mainShopTown: 'Yaoundé',
  freeShippingThreshold: 100000,
  shopPhone: '+237 6 00 000 000',
  shopEmail: 'info@smartcentrecameroon.com'
}

function readCachedSettings() {
  try {
    const stored = localStorage.getItem('shopSettingsCache')
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function readCachedProducts() {
  try {
    const stored = localStorage.getItem('shopProductsCache')
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

function PageFallback() {
  return (
    <main className="min-h-[55vh] bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-8 w-56 animate-pulse rounded border border-gray-200 bg-white" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    </main>
  )
}

export default function App() {
  const location = useLocation()
  const { language, setLanguage, languages, t } = useLanguage()
  const [products, setProducts] = useState(readCachedProducts)
  const [settings, setSettings] = useState(readCachedSettings)
  const [cart, setCart] = useLocalStorageState('cart', [])
  const [wishlist, setWishlist] = useLocalStorageState('wishlist', [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(products.length === 0)
  const [chatReady, setChatReady] = useState(false)
  const drawerRef = useRef(null)

  useEffect(() => {
    let active = true
    axios.get('/api/settings')
      .then((settingsRes) => {
        if (!active) return
        const nextSettings = { ...DEFAULT_SETTINGS, ...settingsRes.data }
        setSettings(nextSettings)
        localStorage.setItem('shopSettingsCache', JSON.stringify(nextSettings))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (location.pathname !== '/') return

    let active = true
    setLoading(products.length === 0)
    axios.get('/api/products')
      .then((productsRes) => {
        if (!active) return
        const nextProducts = productsRes.data || []
        setProducts(nextProducts)
        localStorage.setItem('shopProductsCache', JSON.stringify(nextProducts.slice(0, 80)))
      })
      .catch(() => {
        if (active && products.length === 0) toast.error('Unable to connect to the shop server')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [location.pathname])

  useEffect(() => {
    const shopName = settings.shopName || 'MyShop'
    const path = location.pathname
    if (path === '/') document.title = `SMART Centre Cameroon — Water, Sanitation & Energy Solutions`
    else if (path === '/products') document.title = `Products & Services — SMART Centre Cameroon`
    else if (path === '/cart') document.title = `Cart — SMART Centre Cameroon`
    else if (path === '/track-order') document.title = `Track Order — SMART Centre Cameroon`
    else if (path.startsWith('/products/')) document.title = `Product — SMART Centre Cameroon`
    else document.title = `SMART Centre Cameroon`
  }, [location.pathname, settings.shopName])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const focusableSelector = 'a[href], button:not([disabled])'
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll(focusableSelector) || [])
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const timer = setTimeout(() => focusable()[0]?.focus(), 50)
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
    [cart]
  )
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0)

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    if (!product || Number(product.stock || 0) <= 0) {
      toast.error('This product is out of stock')
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      const nextQuantity = Math.min(
        Number(product.stock || 1),
        Number(existing?.quantity || 0) + Number(quantity || 1)
      )

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity, selectedVariant: selectedVariant || item.selectedVariant || null }
            : item
        )
      }

      return [...current, { ...product, quantity: Math.min(Number(quantity || 1), Number(product.stock || 1)), selectedVariant }]
    })
    toast.success(t('addedToCart'))
  }

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId))
    toast.success('Removed from cart')
  }

  const updateQuantity = (productId, newQuantity) => {
    setCart((current) => {
      if (newQuantity <= 0) return current.filter((item) => item.id !== productId)
      return current.map((item) => (item.id === productId ? { ...item, quantity: Number(newQuantity) } : item))
    })
  }

  const clearCart = () => setCart([])

  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const exists = current.some((item) => item.id === product.id)
      toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist')
      return exists ? current.filter((item) => item.id !== product.id) : [...current, product]
    })
  }

  const isInWishlist = (productId) => wishlist.some((item) => item.id === productId)
  const closeMobileMenu = () => setMobileMenuOpen(false)
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdminRoute) return

    const markReady = () => setChatReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(markReady, { timeout: 3500 })
      return () => window.cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(markReady, 2500)
    return () => window.clearTimeout(timer)
  }, [isAdminRoute])

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/products', label: t('products') },
    { to: '/track-order', label: t('track') },
    { to: '/wishlist', label: `${t('wishlist')} (${wishlist.length})` }
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        <header className="sticky top-0 z-40 bg-white shadow-sm" style={{ borderBottom: '3px solid #0057a8' }}>
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="h-16 flex items-center justify-between gap-3">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <img
                  src="/scc-logo.jpeg"
                  alt="SCC Logo"
                  className="h-10 w-auto object-contain"
                  style={{ borderRadius: '6px' }}
                />
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-gray-700 hover:text-blue-700 transition">
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <label className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700">
                  <span aria-hidden="true" className="text-base leading-none">🌐</span>
                  <span className="hidden sm:inline">{t('language')}</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="max-w-[4.6rem] bg-transparent text-sm font-bold text-blue-700 focus:outline-none sm:max-w-none"
                    aria-label={t('language')}
                  >
                    {languages.map((item) => (
                      <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <Link
                  to="/cart"
                  className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-bold text-white hover:opacity-90 transition"
                  style={{ background: '#0057a8' }}
                >
                  {t('cart')} ({cartCount}) <span className="hidden sm:inline">&nbsp;- {formatXAF(subtotal)}</span>
                </Link>
                <Link to="/admin" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-blue-700 transition">
                  {t('admin')}
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {t('menu')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={closeMobileMenu}
            className={`absolute inset-0 bg-gray-950/50 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200">
              <img src="/scc-logo.jpeg" alt="SCC" className="h-9 w-auto object-contain" style={{ borderRadius: '5px' }} />
              <button type="button" onClick={closeMobileMenu} className="rounded-md border border-gray-300 px-3 py-2 text-xl leading-none" aria-label="Close navigation menu">
                x
              </button>
            </div>
            <nav className="p-5 space-y-2">
              <label className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2"><span aria-hidden="true">🌐</span>{t('language')}</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="bg-transparent text-sm font-bold text-blue-700 focus:outline-none"
                  aria-label={t('language')}
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-blue-50">
                  {link.label}
                </Link>
              ))}
              <Link to="/cart" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-blue-50">
                {t('cart')} ({cartCount}) - {formatXAF(subtotal)}
              </Link>
              <Link to="/admin" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                {t('admin')}
              </Link>
            </nav>
          </aside>
        </div>

        {loading && (
          <div className="bg-blue-100 border-b-2 border-blue-500 text-blue-800">
            <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-semibold text-center">{t('loadingShop')}</div>
          </div>
        )}

        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home products={products} settings={settings} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} loading={loading} />} />
            <Route path="/products" element={<AllProducts addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />} />
            <Route path="/products/:id" element={<ProductDetail addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} settings={settings} />} />
            <Route path="/wishlist" element={<Wishlist wishlist={wishlist} addToCart={addToCart} toggleWishlist={toggleWishlist} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} subtotal={subtotal} settings={settings} />} />
            <Route path="/track-order" element={<OrderTracking settings={settings} />} />
            <Route path="/customer-signup" element={<CustomerSignup />} />
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <footer style={{ background: '#0f172a', color: 'white' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/scc-logo.jpeg" alt="SCC" className="h-12 w-auto object-contain" style={{ borderRadius: '6px', filter: 'brightness(0) invert(1)' }} />
              </div>
              <p className="text-sm opacity-60 leading-relaxed mb-4">Simple, Affordable, Repairable Technologies for Water, Sanitation & Sustainable Livelihoods across Cameroon.</p>
              <div className="text-xs opacity-50 font-semibold">Franchise of SMART Centre Group · Netherlands</div>
            </div>

            <div>
              <h4 className="font-black text-sm uppercase tracking-wider mb-4 opacity-60">Services</h4>
              <ul className="space-y-2 text-sm opacity-70">
                {['Research & Groundwater', 'Water Storage', 'Well Drilling', 'Welding & Fabrication', 'Solar Energy', 'General Water Works'].map(s => (
                  <li key={s}><Link to="/products" className="hover:opacity-100 transition">{s}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm uppercase tracking-wider mb-4 opacity-60">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/" className="hover:opacity-100 transition">Home</Link></li>
                <li><Link to="/products" className="hover:opacity-100 transition">All Products</Link></li>
                <li><Link to="/track-order" className="hover:opacity-100 transition">Track Order</Link></li>
                <li><Link to="/wishlist" className="hover:opacity-100 transition">Wishlist</Link></li>
                <li><Link to="/customer-login" className="hover:opacity-100 transition">My Account</Link></li>
                <li><a href="https://smartcentregroup.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition">SMART Centre Group ↗</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm uppercase tracking-wider mb-4 opacity-60">Contact</h4>
              <ul className="space-y-3 text-sm opacity-70">
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span>Cameroon (Nationwide)<br/>Regional representatives across all regions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a href={`tel:${settings.shopPhone}`} className="hover:opacity-100 transition">{settings.shopPhone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a href={`mailto:${settings.shopEmail}`} className="hover:opacity-100 transition">{settings.shopEmail}</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>🌐</span>
                  <a href="https://www.smartcentrecameroon.com" className="hover:opacity-100 transition">smartcentrecameroon.com</a>
                </li>
              </ul>

              <div className="mt-6 p-3 rounded-xl text-xs" style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)' }}>
                <div className="font-bold text-green-400 mb-1">Serving NGOs, Government</div>
                <div className="opacity-70">Contractors & Individuals worldwide</div>
              </div>
            </div>
          </div>

          <div className="border-t py-5 text-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', opacity: 0.5 }}>
            © {new Date().getFullYear()} SMART Centre Cameroon Ltd. All Rights Reserved. · Franchise of{' '}
            <a href="https://smartcentregroup.com" target="_blank" rel="noopener noreferrer" className="underline">SMART Centre Group</a>
          </div>
        </footer>

        {!isAdminRoute && chatReady && (
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  )
}
