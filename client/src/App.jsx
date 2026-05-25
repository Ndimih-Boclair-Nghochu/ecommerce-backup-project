import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import axios from './lib/api'
import Home from './pages/Home'
import AllProducts from './pages/AllProducts'
import ProductDetail from './pages/ProductDetail'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import OrderTracking from './pages/OrderTracking'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CustomerSignup from './pages/CustomerSignup'
import CustomerLogin from './pages/CustomerLogin'
import CustomerDashboard from './pages/CustomerDashboard'
import NotFound from './pages/NotFound'
import ChatWidget from './components/ChatWidget'
import ErrorBoundary from './components/ErrorBoundary'
import { formatXAF } from './utils/format'

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

export default function App() {
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState({
    shopName: 'MyShop',
    mainShopTown: 'Bamenda',
    freeShippingThreshold: 100000,
    shopPhone: '+237 6 52 882 753',
    shopEmail: 'ndimihboclair4@gmail.com'
  })
  const [cart, setCart] = useLocalStorageState('cart', [])
  const [wishlist, setWishlist] = useLocalStorageState('wishlist', [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const drawerRef = useRef(null)

  useEffect(() => {
    let active = true
    async function loadInitialData() {
      setLoading(true)
      try {
        const [settingsRes, productsRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/products')
        ])
        if (!active) return
        setSettings((prev) => ({ ...prev, ...settingsRes.data }))
        setProducts(productsRes.data || [])
      } catch {
        if (active) toast.error('Unable to connect to the shop server')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadInitialData()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const shopName = settings.shopName || 'MyShop'
    const path = location.pathname
    if (path === '/') document.title = `${shopName} - Premium Electronics & Accessories Cameroon`
    else if (path === '/products') document.title = `All Products - ${shopName}`
    else if (path === '/cart') document.title = `Shopping Cart - ${shopName}`
    else if (path === '/track-order') document.title = `Track Your Order - ${shopName}`
    else if (path.startsWith('/products/')) {
      const id = path.split('/').pop()
      const product = products.find((item) => item.id === id)
      document.title = product ? `${product.name} - ${shopName}` : `Product - ${shopName}`
    } else document.title = shopName
  }, [location.pathname, products, settings.shopName])

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
    toast.success('Added to cart')
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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'All Products' },
    { to: '/track-order', label: 'Track Order' },
    { to: '/wishlist', label: `Wishlist (${wishlist.length})` }
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="h-16 flex items-center justify-between gap-3">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-800 truncate">
                {settings.shopName}
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-slate-700 hover:text-blue-800">
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  to="/cart"
                  className="inline-flex items-center rounded-md bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
                >
                  Cart ({cartCount}) <span className="hidden sm:inline">&nbsp;- {formatXAF(subtotal)}</span>
                </Link>
                <Link to="/admin" className="hidden md:inline-flex text-sm font-semibold text-slate-700 hover:text-blue-800">
                  Admin
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden rounded-md border border-slate-300 px-3 py-2 text-xl leading-none"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  ☰
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
            className={`absolute inset-0 bg-slate-950/50 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="font-bold text-blue-800">{settings.shopName}</span>
              <button type="button" onClick={closeMobileMenu} className="rounded-md border border-slate-300 px-3 py-2 text-xl leading-none" aria-label="Close navigation menu">
                ×
              </button>
            </div>
            <nav className="p-5 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-slate-800 hover:bg-blue-50">
                  {link.label}
                </Link>
              ))}
              <Link to="/cart" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-lg font-semibold text-slate-800 hover:bg-blue-50">
                Cart ({cartCount}) - {formatXAF(subtotal)}
              </Link>
              <Link to="/admin" onClick={closeMobileMenu} className="block rounded-md px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50">
                Admin
              </Link>
            </nav>
          </aside>
        </div>

        {loading && (
          <div className="bg-blue-50 border-b border-blue-100">
            <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-medium text-blue-800">Loading shop data...</div>
          </div>
        )}

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

        <footer className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xl font-bold text-blue-800">{settings.shopName}</p>
              <p className="mt-2 text-sm text-slate-600">Premium electronics and accessories in Cameroon.</p>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>mile 4, Bamenda, Cameroon</p>
              <p>{settings.shopPhone}</p>
              <p>{settings.shopEmail}</p>
            </div>
            <div className="flex flex-wrap md:justify-end gap-4 text-sm font-semibold">
              <Link to="/" className="text-slate-700 hover:text-blue-800">Home</Link>
              <Link to="/products" className="text-slate-700 hover:text-blue-800">Products</Link>
              <Link to="/track-order" className="text-slate-700 hover:text-blue-800">Track Order</Link>
              <Link to="/wishlist" className="text-slate-700 hover:text-blue-800">Wishlist</Link>
            </div>
          </div>
          <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {settings.shopName}. All Rights Reserved.
          </div>
        </footer>

        <ChatWidget />
      </div>
    </ErrorBoundary>
  )
}
