import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import { formatXAF, getProductImage } from '../utils/format'

export default function ProductDetail({ addToCart, toggleWishlist, isInWishlist, settings }) {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([axios.get(`/api/products/${id}`), axios.get('/api/products')])
      .then(([productRes, productsRes]) => {
        if (!active) return
        const item = productRes.data
        setProduct(item)
        const firstVariant = item.images?.[0] || null
        setSelectedVariant(firstVariant)
        setSelectedImage(firstVariant?.url || getProductImage(item))
        setRelated((productsRes.data || []).filter((entry) => entry.category === item.category && entry.id !== item.id).slice(0, 4))
        document.title = `${item.name} - ${settings?.shopName || 'MyShop'}`
      })
      .catch(() => toast.error('Product could not be loaded'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, settings?.shopName])

  const variants = useMemo(() => product?.images?.filter((image) => image?.url) || [], [product])
  const availableRegions = product?.availableRegions || ['ALL']
  const regionLimited = availableRegions.length > 0 && !availableRegions.includes('ALL')

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-2">
          <div className="aspect-square rounded-lg bg-white border border-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 rounded bg-white border border-gray-200 animate-pulse" />
            <div className="h-6 w-40 rounded bg-white border border-gray-200 animate-pulse" />
            <div className="h-32 rounded bg-white border border-gray-200 animate-pulse" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-950">Product not found</h1>
          <Link to="/products" className="mt-5 inline-flex rounded-md bg-blue-700 px-5 py-3 font-bold text-white">Back to Products</Link>
        </div>
      </main>
    )
  }

  const outOfStock = product.stock <= 0

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Back to Products</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={selectedImage || getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
              {outOfStock && <div className="absolute inset-x-0 top-0 bg-red-600 py-3 text-center font-bold text-white">Out of Stock</div>}
            </div>
            {variants.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                {variants.map((variant) => (
                  <button
                    key={`${variant.color}-${variant.url}`}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(variant)
                      setSelectedImage(variant.url)
                    }}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${selectedVariant?.url === variant.url ? 'border-blue-700' : 'border-gray-200'}`}
                    aria-label={`Select ${variant.color || 'variant'}`}
                  >
                    <img src={variant.url} alt={variant.color || product.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {product.category && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{product.category}</span>}
              {product.isNew && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-gray-900">New</span>}
              {product.mostOrdered && <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">Popular</span>}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-blue-800">{formatXAF(product.price)}</p>

            <div className={`mt-4 rounded-md px-4 py-3 text-sm font-semibold ${outOfStock ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {outOfStock ? 'Out of Stock' : `In Stock: ${product.stock} available`}
            </div>

            {regionLimited && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Available only in: {availableRegions.join(', ')}
              </div>
            )}

            <div className="mt-6">
              <h2 className="font-bold text-gray-950">Description</h2>
              <p className="mt-2 text-gray-600 leading-relaxed">{product.description || 'No description provided yet.'}</p>
            </div>

            {variants.length > 1 && (
              <div className="mt-6">
                <h2 className="font-bold text-gray-950 mb-3">Variant</h2>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={`${variant.color}-button`}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(variant)
                        setSelectedImage(variant.url)
                      }}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${selectedVariant?.url === variant.url ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-gray-300 text-gray-700'}`}
                    >
                      {variant.color || 'Option'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="h-11 w-11 rounded-md border border-gray-300 text-xl font-bold"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={product.stock || 1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock || 1, Number(event.target.value) || 1)))}
                className="h-11 w-20 rounded-md border border-gray-300 text-center font-bold"
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(product.stock || 1, value + 1))}
                className="h-11 w-11 rounded-md border border-gray-300 text-xl font-bold"
              >
                +
              </button>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_56px] gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => addToCart(product, quantity, selectedVariant)}
                className="rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`rounded-md border text-2xl ${isInWishlist(product.id) ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                ♥
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-2xl font-bold text-gray-950 mb-4">Related Products</h2>
        {related.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition">
                <img src={getProductImage(item)} alt={item.name} className="aspect-[4/3] w-full rounded-md object-cover bg-gray-100" />
                <h3 className="mt-3 font-bold text-gray-950 line-clamp-2">{item.name}</h3>
                <p className="mt-1 text-blue-800 font-bold">{formatXAF(item.price)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">No related products yet.</p>
        )}
      </section>
    </main>
  )
}
