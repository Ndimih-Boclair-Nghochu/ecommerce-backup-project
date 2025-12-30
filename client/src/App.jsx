import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import Home from './pages/Home'
import AllProducts from './pages/AllProducts'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import OrderTracking from './pages/OrderTracking'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ChatWidget from './components/ChatWidget'

export default function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [platformName, setPlatformName] = useState('MyShop')
  const [wishlist, setWishlist] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    // Fetch platform name
    axios.get('/api/platform-name')
      .then(res => {
        setPlatformName(res.data.platformName || 'MyShop')
      })
      .catch(err => {
        console.error('Failed to load platform name:', err)
        setPlatformName('MyShop')
      })
    
    // Fetch products
    axios.get('/api/products')
      .then(res => {
        setProducts(res.data || [])
        setError(null)
      })
      .catch(err => {
        console.error('Failed to load products:', err)
        setError('Failed to connect to server. Make sure both client and server are running.')
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const toggleWishlist = (product) => {
    const existing = wishlist.find(item => item.id === product.id)
    if (existing) {
      setWishlist(wishlist.filter(item => item.id !== product.id))
    } else {
      setWishlist([...wishlist, product])
    }
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-b-2 border-red-500 text-red-800 p-4 text-center">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">👉 Try running: <code className="bg-red-200 px-2 py-1 rounded">npm run dev</code> from the project root</p>
        </div>
      )}
      
      {/* Loading Banner */}
      {loading && (
        <div className="bg-blue-100 border-b-2 border-blue-500 text-blue-800 p-4 text-center">
          <p className="font-semibold">⏳ Loading products...</p>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent hover:from-blue-800 hover:to-blue-700 transition">
              {platformName}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-6 xl:gap-8 items-center">
              <Link to="/" className="text-gray-700 hover:text-blue-700 font-semibold text-sm transition">
                Home
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-blue-700 font-semibold text-sm transition">
                Products
              </Link>
              <Link to="/track-order" className="text-gray-700 hover:text-blue-700 font-semibold text-sm transition">
                Track
              </Link>
              <Link to="/wishlist" className="text-gray-700 hover:text-blue-700 font-semibold text-sm transition">
                ❤️ ({wishlist.length})
              </Link>
              <Link to="/admin" className="text-gray-700 hover:text-blue-700 font-semibold text-sm transition">
                Admin
              </Link>
            </nav>

            {/* Right Side - Cart and Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cart Button */}
              <Link to="/cart" className="bg-orange-500 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-orange-600 transition font-semibold text-xs sm:text-sm whitespace-nowrap">
                🛒 <span className="hidden sm:inline">Cart</span> ({cart.length})
              </Link>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-3 pt-4">
                <Link 
                  to="/" 
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-3 rounded-lg transition"
                >
                  Home
                </Link>
                <Link 
                  to="/products"
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-3 rounded-lg transition"
                >
                  All Products
                </Link>
                <Link 
                  to="/track-order"
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-3 rounded-lg transition"
                >
                  Track Order
                </Link>
                <Link 
                  to="/wishlist"
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-3 rounded-lg transition"
                >
                  ❤️ Wishlist ({wishlist.length})
                </Link>
                <Link 
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-3 rounded-lg transition"
                >
                  👤 Admin Login
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/products" element={<AllProducts addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/wishlist" element={<Wishlist wishlist={wishlist} addToCart={addToCart} toggleWishlist={toggleWishlist} />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} subtotal={subtotal} total={total} />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>

      {/* Footer */}
      <footer className="py-8 sm:py-10 text-center text-gray-600 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-4">
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">{platformName}</span>
          </div>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">Your one-stop shop for premium electronics and accessories</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link to="/" className="text-gray-600 hover:text-blue-700 transition text-sm">Home</Link>
            <Link to="/products" className="text-gray-600 hover:text-blue-700 transition text-sm">Products</Link>
            <Link to="/track-order" className="text-gray-600 hover:text-blue-700 transition text-sm">Track Order</Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">© 2025 {platformName}. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}
