import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import ProductCard from '../components/ProductCard'
import { useLanguage } from '../i18n/LanguageContext'

function Filters({ categories, filters, setFilters, activeFilterCount, clearFilters }) {
  const { t } = useLanguage()
  const update = (patch) => setFilters((current) => ({ ...current, ...patch }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-950">{t('filters')}</h2>
        {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-blue-700">{t('clearAll')}</button>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">{t('category')}</label>
        <select value={filters.category} onChange={(event) => update({ category: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none">
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">{t('priceRange')}</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="0" placeholder={t('minXaf')} value={filters.minPrice} onChange={(event) => update({ minPrice: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
          <input type="number" min="0" placeholder={t('maxXaf')} value={filters.maxPrice} onChange={(event) => update({ maxPrice: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
        <input type="checkbox" checked={filters.inStockOnly} onChange={(event) => update({ inStockOnly: event.target.checked })} className="h-4 w-4 rounded border-gray-300" />
        {t('inStockOnly')}
      </label>
    </div>
  )
}

const defaultFilters = { category: 'All', minPrice: '', maxPrice: '', inStockOnly: false }

export default function AllProducts({ addToCart, toggleWishlist, isInWishlist }) {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let active = true
    axios.get('/api/products')
      .then((res) => active && setProducts(res.data || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))], [products])
  const activeFilterCount = [filters.category !== 'All', filters.minPrice !== '', filters.maxPrice !== '', filters.inStockOnly].filter(Boolean).length

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const min = filters.minPrice === '' ? 0 : Number(filters.minPrice)
    const max = filters.maxPrice === '' ? Number.POSITIVE_INFINITY : Number(filters.maxPrice)
    return [...products]
      .filter((product) => (filters.category === 'All' ? true : product.category === filters.category))
      .filter((product) => (query ? `${product.name} ${product.description}`.toLowerCase().includes(query) : true))
      .filter((product) => Number(product.price) >= min && Number(product.price) <= max)
      .filter((product) => (filters.inStockOnly ? Number(product.stock) > 0 : true))
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        if (sortBy === 'popular') return Number(b.mostOrdered) - Number(a.mostOrdered)
        if (sortBy === 'in-stock') return Number(b.stock > 0) - Number(a.stock > 0)
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
  }, [products, filters, searchTerm, sortBy])

  const clearFilters = () => {
    setFilters(defaultFilters)
    setSearchTerm('')
    setSortBy('newest')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">{t('backHome')}</Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">{t('products')}</h1>
              <p className="mt-2 text-gray-600">{t('showingProducts', { shown: filteredProducts.length, total: products.length })}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('searchProducts')} className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none">
                <option value="newest">{t('newest')}</option>
                <option value="price-low">{t('priceLow')}</option>
                <option value="price-high">{t('priceHigh')}</option>
                <option value="popular">{t('mostPopular')}</option>
                <option value="in-stock">{t('inStockFirst')}</option>
              </select>
              <button type="button" onClick={() => setFiltersOpen(true)} className="md:hidden rounded-md border border-gray-300 px-4 py-2 font-semibold">
                {t('filters')} {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-blue-700 px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block rounded-lg border border-gray-200 bg-white p-5 h-fit sticky top-24">
            <Filters categories={categories} filters={filters} setFilters={setFilters} activeFilterCount={activeFilterCount} clearFilters={clearFilters} />
          </aside>

          <div>
            {activeFilterCount > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-900">{t('activeFilters', { count: activeFilterCount, plural: activeFilterCount === 1 ? '' : 's' })}</p>
                <button type="button" onClick={clearFilters} className="text-sm font-bold text-blue-800">{t('clearAll')}</button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-80 rounded-2xl bg-white border border-gray-200 animate-pulse" />)}
              </div>
            ) : filteredProducts.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                <h2 className="text-xl font-bold text-gray-950">{t('noProductsFound')}</h2>
                <p className="mt-2 text-gray-600">{t('changeFilters')}</p>
                <button type="button" onClick={clearFilters} className="mt-5 rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">{t('clearFilters')}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className={`fixed inset-0 z-50 md:hidden ${filtersOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className={`absolute inset-0 bg-gray-950/50 transition-opacity ${filtersOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300 ${filtersOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('filters')}</h2>
            <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-xl leading-none">x</button>
          </div>
          <Filters categories={categories} filters={filters} setFilters={setFilters} activeFilterCount={activeFilterCount} clearFilters={clearFilters} />
          <button type="button" onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-md bg-blue-700 px-5 py-3 font-bold text-white">{t('showResults')}</button>
        </div>
      </div>
    </main>
  )
}
