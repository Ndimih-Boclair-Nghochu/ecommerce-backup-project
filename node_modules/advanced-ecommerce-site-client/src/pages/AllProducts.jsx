import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function AllProducts({ addToCart, toggleWishlist, isInWishlist }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)

  useEffect(() => {
    axios.get('/api/products').then(res => {
      setProducts(res.data)
      setFilteredProducts(res.data)
    })
  }, [])

  useEffect(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [selectedCategory, searchTerm, products])

  const categories = ['All', ...new Set(products.map(p => p.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link to="/" className="inline-block mb-3 sm:mb-4 text-orange-300 hover:text-orange-200 transition text-sm sm:text-base">
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">All Products</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-100">Discover our complete collection of amazing products</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Filters Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Search Bar */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Search Products</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition text-sm"
              />
            </div>

            {/* Category Filter - Dropdown */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition text-sm bg-white cursor-pointer"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-bold text-blue-600">{filteredProducts.length}</span> of <span className="font-bold">{products.length}</span> products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="group bg-white rounded-lg sm:rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Image Container with Badges */}
                <div className="relative overflow-hidden h-40 sm:h-48 md:h-56">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {/* Variant thumbnails */}
                  {product.images && product.images.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1 bg-white/70 rounded-lg p-1">
                      {product.images.slice(0,3).map(img => (
                        <img key={img.url} src={img.url} alt={img.color} className="w-5 h-5 sm:w-7 sm:h-7 object-cover rounded border text-xs" />
                      ))}
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-700 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                        🆕 New
                      </span>
                    )}
                    {product.mostOrdered && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                        🔥 Popular
                      </span>
                    )}
                    {product.stock > 0 ? (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                        In Stock
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button onClick={() => { setQuickViewProduct(product); setSelectedVariant(null); }} className="opacity-0 group-hover:opacity-100 bg-white text-blue-700 px-3 sm:px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-700 hover:text-white transition transform scale-90 group-hover:scale-100">
                      👁️ Quick View
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-3 sm:p-4 flex flex-col h-full">
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-blue-600 transition line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-1">{product.description}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400 text-xs sm:text-sm">
                      {'⭐'.repeat(5)}
                    </div>
                    <span className="text-xs text-gray-500">(4.8)</span>
                  </div>

                  {/* Stock Indicator - Compact */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>Stock:</span>
                      <span className="font-bold">{product.stock}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-700 h-1 rounded-full transition-all" 
                        style={{ width: `${Math.min((product.stock / 200) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Price and Wishlist */}
                  <div className="flex justify-between items-start gap-2 mb-2 mt-auto">
                    <div>
                      <span className="text-lg sm:text-2xl font-bold text-blue-700">{product.price.toLocaleString()} XAF</span>
                      <p className="text-xs text-gray-500 hidden sm:block">Free shipping</p>
                    </div>
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className={`p-1.5 sm:p-2 rounded text-lg sm:text-xl transition flex-shrink-0 ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white border border-gray-300 hover:bg-gray-100'
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
                    className={`w-full py-1.5 sm:py-2 px-2 rounded text-sm sm:text-base font-bold transition ${
                      product.stock > 0 
                        ? 'bg-blue-700 text-white hover:bg-blue-800' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? '🛒 Add' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

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
    </div>
  )
}
