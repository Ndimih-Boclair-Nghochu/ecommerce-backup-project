import React from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatXAF, getProductImage } from '../utils/format'

export default function Wishlist({ wishlist, addToCart, toggleWishlist }) {
  const inStockItems = wishlist.filter((item) => Number(item.stock || 0) > 0)

  const addAllToCart = () => {
    if (!inStockItems.length) {
      toast.error('No in-stock wishlist items to add')
      return
    }
    inStockItems.forEach((item) => addToCart(item))
    toast.success(`Added ${inStockItems.length} in-stock item${inStockItems.length === 1 ? '' : 's'} to cart`)
  }

  if (!wishlist.length) {
    return (
      <main className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
        <section className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-950">Your wishlist is empty</h1>
          <p className="mt-3 text-gray-600">Save products you want to revisit later.</p>
          <Link to="/products" className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
            Browse Products
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Back to Products</Link>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-950">Wishlist</h1>
            <p className="mt-2 text-gray-600">{wishlist.length} saved item{wishlist.length === 1 ? '' : 's'}</p>
          </div>
          <button
            type="button"
            onClick={addAllToCart}
            className="rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
          >
            Add All In Stock to Cart
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlist.map((product) => (
            <article key={product.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <Link to={`/products/${product.id}`} className="block">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
                  {product.stock <= 0 && <div className="absolute inset-x-0 top-0 bg-red-600 py-2 text-center text-xs font-bold text-white">Out of Stock</div>}
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase text-blue-700">{product.category || 'Product'}</p>
                  <h2 className="mt-1 font-bold text-gray-950 line-clamp-2">{product.name}</h2>
                  <p className="mt-2 font-bold text-blue-800">{formatXAF(product.price)}</p>
                </div>
              </Link>
              <div className="px-4 pb-4 grid grid-cols-[1fr_44px] gap-2">
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="rounded-md border border-red-500 bg-red-500 text-lg text-white"
                  aria-label="Remove from wishlist"
                >
                  ♥
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
