import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import ProductCard from '../components/ProductCard'
import { formatXAF } from '../utils/format'
import { useLanguage } from '../i18n/LanguageContext'

const Locations = lazy(() => import('../components/Locations'))

const INITIAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920'
const PRODUCTS_PER_ROW_BY_WIDTH = [
  { min: 1280, columns: 4 },
  { min: 768, columns: 3 },
  { min: 0, columns: 2 }
]

function getHomeProductColumns() {
  if (typeof window === 'undefined') return 4
  return PRODUCTS_PER_ROW_BY_WIDTH.find((entry) => window.innerWidth >= entry.min)?.columns || 2
}

export default function Home({ products, settings, addToCart, toggleWishlist, isInWishlist, loading }) {
  const { t } = useLanguage()
  const [hero, setHero] = useState(null)
  const [stats, setStats] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [productPage, setProductPage] = useState(0)
  const [productColumns, setProductColumns] = useState(getHomeProductColumns)
  const [locationsReady, setLocationsReady] = useState(false)

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

  useEffect(() => {
    const onResize = () => setProductColumns(getHomeProductColumns())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const showLocations = () => setLocationsReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(showLocations, { timeout: 5000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(showLocations, 3500)
    return () => window.clearTimeout(timer)
  }, [])

  const orderedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aScore = Number(Boolean(a.mostOrdered)) * 2 + Number(Boolean(a.isNew))
      const bScore = Number(Boolean(b.mostOrdered)) * 2 + Number(Boolean(b.isNew))
      if (bScore !== aScore) return bScore - aScore
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [products])

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))], [products])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    return orderedProducts
      .filter((product) => (selectedCategory === 'All' ? true : product.category === selectedCategory))
      .filter((product) => {
        if (!query) return true
        return `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase().includes(query)
      })
  }, [orderedProducts, productSearch, selectedCategory])

  const productsPerPage = productColumns * 3
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))
  const visibleProducts = filteredProducts.slice(productPage * productsPerPage, (productPage + 1) * productsPerPage)

  useEffect(() => {
    setProductPage(0)
  }, [productSearch, selectedCategory, productsPerPage])

  useEffect(() => {
    if (productPage >= pageCount) setProductPage(pageCount - 1)
  }, [pageCount, productPage])

  const heroData = {
    badge: hero?.badge || 'Special Offers This Season',
    title: settings.shopName || 'MyShop',
    description: hero?.description || t('heroDescription'),
    primaryButtonText: hero?.primaryButtonText || t('shopNow'),
    secondaryButtonText: hero?.secondaryButtonText || t('browseProducts'),
    backgroundImage: hero?.backgroundImage || INITIAL_HERO_IMAGE
  }

  const heroStats = [
    { value: stats?.totalProducts ?? products.length, label: t('productsListed') },
    { value: stats?.totalInStock ?? 0, label: t('itemsInStock') },
    { value: formatXAF(settings.freeShippingThreshold), label: t('freeShippingFrom') }
  ]

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-stone-950 py-12 text-white sm:py-16 md:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <img
            src={heroData.backgroundImage}
            alt=""
            decoding="async"
            fetchPriority="low"
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== INITIAL_HERO_IMAGE) event.currentTarget.src = INITIAL_HERO_IMAGE
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="inline-flex rounded-full bg-amber-700 px-4 py-2 text-sm font-bold text-white shadow-lg sm:px-6 sm:text-base">
            {heroData.badge}
          </div>
          <h1 className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
            {heroData.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl px-2 text-base text-gray-100 sm:mt-6 sm:text-lg md:text-xl">
            {heroData.description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 px-2 sm:mt-8 sm:gap-4">
            <Link to="/products" className="rounded-lg bg-amber-700 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-amber-800 sm:px-8 sm:py-3 sm:text-base md:text-lg">
              {heroData.primaryButtonText}
            </Link>
            <Link to="/products" className="rounded-lg border-2 border-white px-6 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:px-8 sm:py-3 sm:text-base">
              {heroData.secondaryButtonText}
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:mt-16 sm:gap-6">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/15 p-3 backdrop-blur sm:p-6">
                <div className="mb-1 text-xl font-bold sm:mb-2 sm:text-3xl">{stat.value}</div>
                <div className="text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-5 text-center sm:mb-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Why shop with us</p>
          <h2 className="mt-2 text-2xl font-black text-gray-950 sm:text-3xl">A smoother way to buy essentials</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: t('fastDeliveryTitle'), desc: t('fastDeliveryDesc') },
            { title: t('paymentTitle'), desc: t('paymentDesc') },
            { title: t('supportTitle'), desc: t('supportDesc', { phone: settings.shopPhone }) }
          ].map((feature, index) => (
            <div key={feature.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-xs font-black text-stone-900">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <h3 className="text-base font-black leading-tight text-gray-950">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">{t('featured')}</p>
              <h2 className="mt-2 text-2xl font-black text-gray-950 sm:text-4xl">{t('featuredTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                Search the catalog, filter by category, and browse three rows at a time.
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(240px,1fr)_220px_auto] lg:min-w-[680px]">
              <label className="block">
                <span className="sr-only">{t('searchProducts')}</span>
                <input
                  type="search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder={t('searchProducts')}
                  className="h-11 w-full rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 outline-none transition focus:border-amber-700 focus:ring-4 focus:ring-amber-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">{t('category')}</span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm font-bold text-gray-800 outline-none transition focus:border-amber-700 focus:ring-4 focus:ring-amber-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category === 'All' ? 'All categories' : category}</option>
                  ))}
                </select>
              </label>
              <Link to="/products" className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-black text-gray-800 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900">
                {t('viewAll')}
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: productsPerPage }).map((_, index) => (
                <div key={index} className="h-72 rounded-2xl bg-white border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />
                ))}
              </div>
              <div className="mt-7 flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
                <p className="text-sm font-bold text-gray-600">
                  Showing {visibleProducts.length} of {filteredProducts.length} products, page {productPage + 1} of {pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProductPage((page) => Math.max(0, page - 1))}
                    disabled={productPage === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg font-black text-gray-800 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous products"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPage((page) => Math.min(pageCount - 1, page + 1))}
                    disabled={productPage >= pageCount - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-lg font-black text-white transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:bg-gray-300"
                    aria-label="Next products"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-gray-950">{products.length ? t('noProductsFound') : t('noProductsYet')}</h3>
              <p className="mt-2 text-gray-600">{products.length ? t('changeFilters') : t('ownerCanAdd')}</p>
            </div>
          )}
        </div>
      </section>

      {locationsReady && (
        <Suspense fallback={null}>
          <Locations />
        </Suspense>
      )}
    </main>
  )
}
