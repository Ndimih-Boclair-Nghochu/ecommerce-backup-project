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
  shopName: 'MyShop',
  mainShopTown: 'Bamenda',
  freeShippingThreshold: 100000,
  shopPhone: '+237 6 52 882 753',
  shopEmail: 'ndimihboclair4@gmail.com'
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
    if (path === '/') document.title = `${shopName} - Premium Electronics & Accessories Cameroon`
    else if (path === '/products') document.title = `All Products - ${shopName}`
    else if (path === '/cart') document.title = `Shopping Cart - ${shopName}`
    else if (path === '/track-order') document.title = `Track Your Order - ${shopName}`
    else if (path.startsWith('/products/')) document.title = `Product - ${shopName}`
    else document.title = shopName
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

        <header className="sticky top-0 z-40 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="h-16 flex items-center justify-between gap-3">
              <Link to="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-700 to-yellow-900 bg-clip-text text-transparent hover:from-stone-950 hover:to-stone-900 transition truncate">
                {settings.shopName}
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-gray-700 hover:text-amber-700 transition">
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
                    className="max-w-[4.6rem] bg-transparent text-sm font-bold text-amber-700 focus:outline-none sm:max-w-none"
                    aria-label={t('language')}
                  >
                    {languages.map((item) => (
                      <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <Link
                  to="/cart"
                  className="inline-flex items-center rounded-lg bg-amber-700 px-3 py-2 text-sm font-bold text-white hover:bg-amber-800 transition"
                >
                  {t('cart')} ({cartCount}) <span className="hidden sm:inline">&nbsp;- {formatXAF(subtotal)}</span>
                </Link>
                <Link to="/admin" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-amber-700 transition">
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
              <span className="font-bold bg-gradient-to-r from-amber-700 to-yellow-900 bg-clip-text text-transparent">{settings.shopName}</span>
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
                  className="bg-transparent text-sm font-bold text-amber-700 focus:outline-none"
                  aria-label={t('language')}
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-stone-100">
                  {link.label}
                </Link>
              ))}
              <Link to="/cart" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-stone-100">
                {t('cart')} ({cartCount}) - {formatXAF(subtotal)}
              </Link>
              <Link to="/admin" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                {t('admin')}
              </Link>
            </nav>
          </aside>
        </div>

        {loading && (
          <div className="bg-stone-100 border-b-2 border-amber-700 text-stone-900">
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

        <footer className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-900 bg-clip-text text-transparent">{settings.shopName}</p>
              <p className="mt-2 text-sm text-gray-500">{t('footerTagline')}</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>mile 4, Bamenda, Cameroon</p>
              <p>{settings.shopPhone}</p>
              <p>{settings.shopEmail}</p>
            </div>
            <div className="flex flex-wrap md:justify-end gap-4 text-sm font-semibold">
              <Link to="/" className="text-gray-600 hover:text-amber-700 transition">{t('home')}</Link>
              <Link to="/products" className="text-gray-600 hover:text-amber-700 transition">{t('products')}</Link>
              <Link to="/track-order" className="text-gray-600 hover:text-amber-700 transition">{t('track')}</Link>
              <Link to="/wishlist" className="text-gray-600 hover:text-amber-700 transition">{t('wishlist')}</Link>
            </div>
          </div>
          <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
            (c) {new Date().getFullYear()} {settings.shopName}. {t('rights')}
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
