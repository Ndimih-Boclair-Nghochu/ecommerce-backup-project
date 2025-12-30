import React from 'react'
import { Link } from 'react-router-dom'

export default function Wishlist({ wishlist, addToCart, toggleWishlist }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">❤️ My Wishlist</h1>
          <p className="text-sm sm:text-base md:text-lg text-blue-100">Your favorite products saved for later</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-12">
        {wishlist.length > 0 ? (
          <>
            <div className="mb-6 sm:mb-8 flex justify-between items-center flex-col sm:flex-row gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} in Your Wishlist
              </h2>
              <Link 
                to="/products" 
                className="text-blue-700 hover:text-blue-800 font-semibold transition text-sm sm:text-base whitespace-nowrap"
              >
                Continue Shopping →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {wishlist.map(product => (
                <div key={product.id} className="group bg-white rounded-lg sm:rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                  {/* Remove Button */}
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-red-50 transition"
                    title="Remove from Wishlist"
                  >
                    <span className="text-lg sm:text-2xl">❌</span>
                  </button>

                  {/* Image Container with Badges */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-40 sm:h-48 md:h-56 object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    {/* Category Badge */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                      <span className="bg-blue-700 text-white text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    {/* Status Badges */}
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
                      {product.isNew && (
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          🆕 New
                        </span>
                      )}
                      {product.mostOrdered && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          🔥 Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-blue-700 transition line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-1">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-2">
                      <div className="flex text-yellow-400 text-xs sm:text-sm">
                        {'⭐'.repeat(5)}
                      </div>
                      <span className="text-xs text-gray-500">(4.8)</span>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-2">
                      {product.stock > 0 ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <span className="text-green-600 font-bold">✓ In Stock</span>
                          <span className="text-gray-500 text-xs">({product.stock})</span>
                        </div>
                      ) : (
                        <span className="text-red-600 text-xs sm:text-sm font-bold">✗ Out of Stock</span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3 sm:mb-4">
                      <span className="text-lg sm:text-2xl font-bold text-blue-700">{product.price.toLocaleString()} XAF</span>
                      <p className="text-xs text-gray-500 hidden sm:block">Free shipping</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          addToCart(product)
                          toggleWishlist(product)
                        }}
                        disabled={product.stock === 0}
                        className={`flex-1 py-2 sm:py-2.5 rounded text-sm sm:text-base font-bold transition ${
                          product.stock > 0 
                            ? 'bg-blue-700 text-white hover:bg-blue-800' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.stock > 0 ? '🛒 Add' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-10 sm:mt-12 md:mt-16 bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">Ready to Shop?</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Add all wishlist items to your cart or continue browsing</p>
              <div className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row">
                <button
                  onClick={() => {
                    wishlist.forEach(product => {
                      if (product.stock > 0) {
                        addToCart(product)
                      }
                    })
                    // Clear wishlist after adding to cart
                    wishlist.forEach(product => toggleWishlist(product))
                  }}
                  className="bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-blue-800 transition text-sm sm:text-base"
                >
                  🛒 Add All to Cart
                </button>
                <Link
                  to="/products"
                  className="bg-gray-200 text-gray-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <div className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6">💔</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 mb-2 sm:mb-3 md:mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">Save your favorite items here for easy access later</p>
            <Link 
              to="/products" 
              className="inline-block bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-blue-800 transition shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
