import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import Locations from '../components/Locations'
import { formatXAF, getProductImage } from '../utils/format'

function ProductCard({ product, addToCart, toggleWishlist, isInWishlist }) {
  const image = getProductImage(product)

  return (
    <article className="group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          {product.stock <= 0 && (
            <div className="absolute inset-x-0 top-0 bg-red-600 text-white text-center text-xs font-bold py-2">
              Out of Stock
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.isNew && <span className="rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-slate-900">New</span>}
            {product.mostOrdered && <span className="rounded-full bg-blue-700 px-2 py-1 text-xs font-bold text-white">Popular</span>}
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase text-blue-700">{product.category || 'Product'}</p>
          <h3 className="mt-1 font-bold text-slate-950 line-clamp-2">{product.name}</h3>
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-lg font-bold text-blue-800">{formatXAF(product.price)}</span>
            <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}
            </span>
          </div>
          {product.stock > 0 && (
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }} />
            </div>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4 flex gap-2">
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`w-11 rounded-md border text-lg ${isInWishlist(product.id) ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          ♥
        </button>
      </div>
    </article>
  )
}

export default function Home({ products, settings, addToCart, toggleWishlist, isInWishlist, loading }) {
  const [hero, setHero] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([axios.get('/api/hero-section'), axios.get('/api/stats')])
      .then(([heroRes, statsRes]) => {
        if (!active) return
        setHero(heroRes.data)
        setStats(statsRes.data)
      })
      .catch(() => toast.error('Some homepage data could not be loaded'))
    return () => {
      active = false
    }
  }, [])

  const featuredProducts = useMemo(() => {
    const marked = products.filter((product) => product.mostOrdered || product.isNew)
    return (marked.length ? marked : products).slice(0, 8)
  }, [products])

  const heroData = {
    badge: hero?.badge || 'Bamenda based shop',
    title: settings.shopName || 'MyShop',
    description: hero?.description || 'Shop premium electronics and accessories in Cameroon. Your order is received first, then our team contacts you to confirm payment and delivery.',
    backgroundImage: hero?.backgroundImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920'
  }

  return (
    <main>
      <section className="relative min-h-[520px] sm:min-h-[560px] flex items-end overflow-hidden bg-slate-950">
        <img src={heroData.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 pb-16 pt-32">
          <div className="max-w-2xl text-white">
            <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">{heroData.badge}</p>
            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">{heroData.title}</h1>
            <p className="mt-5 text-base sm:text-lg text-slate-100 max-w-xl">{heroData.description}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/products" className="rounded-md bg-orange-500 px-6 py-3 text-center font-bold text-white hover:bg-orange-600">
                Shop Now
              </Link>
              <Link to="/products" className="rounded-md border border-white/70 px-6 py-3 text-center font-bold text-white hover:bg-white/10">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-950">{stats?.totalProducts ?? products.length}</p>
            <p className="text-sm text-slate-600">Products listed</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-950">{stats?.totalInStock ?? 0}</p>
            <p className="text-sm text-slate-600">Items in stock</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-950">{settings.mainShopTown}</p>
            <p className="text-sm text-slate-600">Main shop town</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-950">{formatXAF(settings.freeShippingThreshold)}</p>
            <p className="text-sm text-slate-600">Free shipping threshold</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Fast Cameroon delivery', desc: 'Shipping options for Bamenda, Buea, Douala, Yaoundé and more.' },
            { title: 'Manual payment confirmation', desc: 'Place your order and the shop contacts you before payment and delivery.' },
            { title: 'Real support', desc: `Call ${settings.shopPhone} for order support and product questions.` }
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-700">Featured</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">Products customers should see first</h2>
            </div>
            <Link to="/products" className="hidden sm:inline-flex rounded-md border border-slate-300 px-4 py-2 font-semibold hover:bg-white">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-72 rounded-lg bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-slate-950">No products yet</h3>
              <p className="mt-2 text-slate-600">The owner can add real products from the admin dashboard.</p>
            </div>
          )}
        </div>
      </section>

      <Locations />
    </main>
  )
}
