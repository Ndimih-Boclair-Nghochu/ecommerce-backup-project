import React from 'react'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Locations from '../components/Locations'

// Custom hook for scroll animations
const useScrollAnimation = () => {
  const [visibleElements, setVisibleElements] = useState({})
  const elementsRef = useRef({})

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleElements(prev => ({
            ...prev,
            [entry.target.id]: true
          }))
        }
      })
    }, observerOptions)

    // Observe all elements with scroll-animate id
    Object.values(elementsRef.current).forEach(el => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const registerElement = (id, ref) => {
    elementsRef.current[id] = ref
  }

  return { visibleElements, registerElement }
}

export default function Home({ products, addToCart, toggleWishlist, isInWishlist }) {
  const { visibleElements, registerElement } = useScrollAnimation()
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [heroSection, setHeroSection] = useState({
    badge: "✨ Special Offers This Season",
    title: "Shop the Best <span className=\"text-orange-400\">Products</span> Online",
    description: "Discover thousands of quality products at unbeatable prices. Free shipping on orders over 100,000 XAF.",
    primaryButtonText: "Shop Now →",
    secondaryButtonText: "Learn More",
    backgroundImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920"
  })
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInStock: 0,
    totalItemsSold: 0,
    averageRating: 4.8,
    deliveryTime: '24-48h'
  })

  useEffect(() => {
    // Fetch hero section
    axios.get('/api/hero-section')
      .then(res => setHeroSection(res.data))
      .catch(err => console.error('Failed to load hero section:', err))
    
    // Fetch real statistics
    axios.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load stats:', err))
  }, [])

  // Show only 9 featured products (mix of most ordered and new)
  const featuredProducts = products
    .filter(p => p.mostOrdered || p.isNew)
    .slice(0, 9)

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-on-scroll {
          opacity: 0;
        }

        .animate-on-scroll.visible {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-scale {
          opacity: 0;
        }

        .animate-scale.visible {
          animation: fadeInScale 0.8s ease-out forwards;
        }

        .card-animate {
          opacity: 0;
        }

        .card-animate.visible {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .stagger-delay-1 { animation-delay: 0.1s; }
        .stagger-delay-2 { animation-delay: 0.2s; }
        .stagger-delay-3 { animation-delay: 0.3s; }
        .stagger-delay-4 { animation-delay: 0.4s; }
        .stagger-delay-5 { animation-delay: 0.5s; }
        .stagger-delay-6 { animation-delay: 0.6s; }
        .stagger-delay-7 { animation-delay: 0.7s; }
        .stagger-delay-8 { animation-delay: 0.8s; }
        .stagger-delay-9 { animation-delay: 0.9s; }
      `}</style>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroSection.backgroundImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block bg-orange-500 text-white rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6 font-bold text-sm sm:text-base">
            <span>{heroSection.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            {heroSection.title.includes('<span') ? (
              <span dangerouslySetInnerHTML={{ __html: heroSection.title }} />
            ) : (
              heroSection.title
            )}
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto text-gray-100 px-2">
            {heroSection.description}
          </p>
          <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-2">
            <Link to="/products" className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold transition shadow-lg">
              {heroSection.primaryButtonText}
            </Link>
            <button onClick={() => setShowCategoryModal(true)} className="border-2 border-white text-white text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold hover:bg-white/10 transition">
              🏷️ Browse Categories
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-10 sm:mt-16 max-w-3xl mx-auto">
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                {stats.totalInStock.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm">Products Available</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                {stats.totalItemsSold.toLocaleString()}+
              </div>
              <div className="text-xs sm:text-sm">Total Items Sold</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stats.averageRating}⭐</div>
              <div className="text-xs sm:text-sm">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { id: 'feature-fast', icon: '🚚', title: 'Fast Delivery', desc: 'Get your orders delivered within 24-48 hours', gradient: 'from-blue-50', border: 'border-blue-100' },
              { id: 'feature-secure', icon: '💳', title: 'Secure Payment', desc: '100% secure payment methods', gradient: 'from-green-50', border: 'border-green-100' },
              { id: 'feature-returns', icon: '🔄', title: 'Easy Returns', desc: '30-day return policy on all items', gradient: 'from-purple-50', border: 'border-purple-100' },
              { id: 'feature-gifts', icon: '🎁', title: 'Gift Cards', desc: 'Perfect gift for your loved ones', gradient: 'from-orange-50', border: 'border-orange-100' }
            ].map((feature, idx) => (
              <div 
                key={feature.id}
                ref={el => registerElement(feature.id, el)}
                className={`text-center p-6 sm:p-8 rounded-lg hover:shadow-lg transition bg-gradient-to-b ${feature.gradient} to-white border ${feature.border} card-animate stagger-delay-${idx + 1} ${
                  visibleElements[feature.id] ? 'visible' : ''
                }`}
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              ref={el => registerElement('featured-title', el)}
              className={`text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 card-animate ${
                visibleElements['featured-title'] ? 'visible' : ''
              }`}
            >
              Featured Products
            </h2>
            <p 
              ref={el => registerElement('featured-desc', el)}
              className={`text-gray-600 text-sm sm:text-lg card-animate stagger-delay-1 ${
                visibleElements['featured-desc'] ? 'visible' : ''
              }`}
            >
              Curated selection of our best-selling items
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((product, idx) => (
              <div 
                key={product.id} 
                ref={el => registerElement(`product-${product.id}`, el)}
                className={`group bg-white rounded-lg sm:rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden card-animate stagger-delay-${(idx % 6) + 1} ${
                  visibleElements[`product-${product.id}`] ? 'visible' : ''
                }`}
              >
                {/* Image Container with Badges */}
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {/* Variant thumbnails */}
                  {product.images && product.images.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-2 bg-white/70 rounded-lg p-2">
                      {product.images.slice(0,3).map(img => (
                        <img key={img.url} src={img.url} alt={img.color} className="w-8 h-8 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  {/* Status Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {product.isNew && (
                      <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                        🆕 New
                      </span>
                    )}
                    {product.mostOrdered && (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🔥 Popular
                      </span>
                    )}
                    {product.stock > 0 ? (
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        In Stock
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  {/* Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button onClick={() => { setQuickViewProduct(product); setSelectedVariant(null); }} className="opacity-0 group-hover:opacity-100 bg-white text-blue-700 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 hover:text-white transition">
                      👁️ Quick View
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-xl mb-2 group-hover:text-blue-700 transition line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400 text-sm">
                      {'⭐'.repeat(5)}
                    </div>
                    <span className="text-xs text-gray-500">(4.8)</span>
                  </div>

                  {/* Stock Indicator */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Available:</span>
                      <span className="font-bold">{product.stock} units</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-700 to-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <div>
                      <span className="text-lg sm:text-2xl font-bold text-blue-700">{product.price.toLocaleString()} XAF</span>
                      <p className="text-xs text-gray-500">Free shipping</p>
                    </div>
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className={`p-2 rounded-lg transition ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white'
                      }`}
                      title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      {isInWishlist(product.id) ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition ${
                      product.stock > 0 
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white hover:from-blue-800 hover:to-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10 sm:mt-12">
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-lg hover:from-blue-800 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
            >
              View All Products ({products.length}) →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold mb-4">
              Why Choose Us
            </div>
            <h2 
              ref={el => registerElement('support-title', el)}
              className={`text-4xl font-bold mb-4 card-animate ${
                visibleElements['support-title'] ? 'visible' : ''
              }`}
            >
              Experience Shopping Excellence
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { id: 'support-1', icon: '✓', title: 'Premium Quality', desc: 'Only the best products make it to our store', border: 'border-purple-600' },
              { id: 'support-2', icon: '🏆', title: 'Best Prices', desc: 'Competitive pricing guaranteed', border: 'border-indigo-600' },
              { id: 'support-3', icon: '💬', title: 'Customer Support', desc: '24/7 dedicated support team', border: 'border-blue-600' },
              { id: 'support-4', icon: '🔒', title: 'Secure Shopping', desc: 'Your data is always protected', border: 'border-green-600' }
            ].map((item, idx) => (
              <div 
                key={item.id}
                ref={el => registerElement(item.id, el)}
                className={`bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 ${item.border} card-animate stagger-delay-${idx + 1} ${
                  visibleElements[item.id] ? 'visible' : ''
                }`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { id: 'stat-1', value: '1000+', label: 'Quality Products', gradient: 'from-purple-500 to-purple-600', delay: 1 },
              { id: 'stat-2', value: '5000+', label: 'Happy Customers', gradient: 'from-indigo-500 to-indigo-600', delay: 2 },
              { id: 'stat-3', value: '99%', label: 'Satisfaction Rate', gradient: 'from-blue-500 to-blue-600', delay: 3 },
              { id: 'stat-4', value: '24/7', label: 'Expert Support', gradient: 'from-green-500 to-green-600', delay: 4 }
            ].map((stat) => (
              <div 
                key={stat.id}
                ref={el => registerElement(stat.id, el)}
                className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 text-white text-center card-animate stagger-delay-${stat.delay} ${
                  visibleElements[stat.id] ? 'visible' : ''
                }`}
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => { setQuickViewProduct(null); setSelectedVariant(null); }}
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition text-2xl w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div>
                <img 
                  src={selectedVariant?.url || quickViewProduct.image} 
                  alt={quickViewProduct.name}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                />
                {/* Variant Gallery */}
                {quickViewProduct.images && quickViewProduct.images.length > 0 && (
                  <div className="mt-4">
                    <p className="font-bold text-gray-700 mb-3">Available Colors:</p>
                    <div className="flex gap-3 flex-wrap">
                      {quickViewProduct.images.map(variant => (
                        <button
                          key={variant.url}
                          onClick={() => setSelectedVariant(variant)}
                          className={`w-20 h-20 rounded-lg border-3 overflow-hidden transition transform hover:scale-110 ${
                            selectedVariant?.url === variant.url 
                              ? 'border-purple-600 shadow-lg' 
                              : 'border-gray-300'
                          }`}
                        >
                          <img src={variant.url} alt={variant.color} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div>
                {/* Status Badges */}
                <div className="flex gap-2 mb-4">
                  {quickViewProduct.isNew && (
                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                      🆕 New
                    </span>
                  )}
                  {quickViewProduct.mostOrdered && (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      🔥 Popular
                    </span>
                  )}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    quickViewProduct.stock > 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {quickViewProduct.stock > 0 ? '✓ In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{quickViewProduct.name}</h2>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex text-yellow-400 text-xl">
                    {'⭐'.repeat(5)}
                  </div>
                  <span className="text-gray-600 font-semibold">(4.8) · 324 reviews</span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-purple-600">{quickViewProduct.price.toLocaleString()} XAF</span>
                  <p className="text-green-600 font-semibold mt-2">✓ Free Shipping on this item</p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{quickViewProduct.description}</p>
                </div>

                {/* Product Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-bold text-gray-900">{quickViewProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock Available</p>
                    <p className="font-bold text-gray-900">{quickViewProduct.stock} units</p>
                  </div>
                  {quickViewProduct.availableRegions && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Available Regions</p>
                      <div className="flex gap-2 flex-wrap">
                        {Array.isArray(quickViewProduct.availableRegions) ? 
                          quickViewProduct.availableRegions.map(region => (
                            <span key={region} className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                              {region}
                            </span>
                          )) : (
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                              All Regions
                            </span>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Availability</span>
                    <span className="font-bold">{quickViewProduct.stock > 50 ? 'Plenty in stock' : quickViewProduct.stock > 10 ? 'Limited stock' : 'Low in stock'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all" 
                      style={{ width: `${Math.min((quickViewProduct.stock / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    disabled={quickViewProduct.stock === 0}
                    className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${
                      quickViewProduct.stock > 0 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {quickViewProduct.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                  <button 
                    onClick={() => {
                      toggleWishlist(quickViewProduct);
                    }}
                    className={`px-6 py-3 rounded-lg font-bold transition ${
                      isInWishlist(quickViewProduct.id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {isInWishlist(quickViewProduct.id) ? '❤️ Wishlisted' : '🤍 Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Browse Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 flex justify-between items-center sticky top-0">
              <h2 className="text-3xl font-bold">🏷️ Browse Categories</h2>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="bg-white text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition text-2xl w-10 h-10 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Categories Grid */}
            <div className="p-8">
              {/* Get unique categories from products */}
              {products && Array.from(new Set(products.map(p => p.category))).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from(new Set(products.map(p => p.category))).map((category, idx) => {
                    const categoryProducts = products.filter(p => p.category === category);
                    const categoryIcon = ['📱', '👗', '👟', '🎮', '📚', '🏠', '🎧', '⌚', '💻', '🎨'][idx % 10];
                    
                    return (
                      <Link
                        key={category}
                        to={`/products?category=${encodeURIComponent(category)}`}
                        onClick={() => setShowCategoryModal(false)}
                        className="group bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-600 hover:shadow-xl transition duration-300 cursor-pointer"
                      >
                        <div className="text-5xl mb-4 group-hover:scale-110 transition">{categoryIcon}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">{category}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-3 transition">
                          <span>Browse Now</span>
                          <span className="text-2xl">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-600 text-lg">No categories available yet</p>
                </div>
              )}

              {/* View All Products Button */}
              <div className="mt-8 text-center">
                <Link 
                  to="/products" 
                  onClick={() => setShowCategoryModal(false)}
                  className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition"
                >
                  View All Products →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locations Section */}
      <Locations />
    </>
  )
}
