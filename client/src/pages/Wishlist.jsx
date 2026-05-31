import React from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ProductCard from '../components/ProductCard'
import { useLanguage } from '../i18n/LanguageContext'

export default function Wishlist({ wishlist, addToCart, toggleWishlist }) {
  const { t } = useLanguage()
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
          <h1 className="text-3xl font-bold text-gray-950">{t('emptyWishlist')}</h1>
          <p className="mt-3 text-gray-600">{t('saveProducts')}</p>
          <Link to="/products" className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
            {t('browseProducts')}
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
            <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">{t('backProducts')}</Link>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-950">{t('wishlist')}</h1>
            <p className="mt-2 text-gray-600">{t('savedItems', { count: wishlist.length, plural: wishlist.length === 1 ? '' : 's' })}</p>
          </div>
          <button type="button" onClick={addAllToCart} className="rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
            {t('addAllStock')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={() => true} />
          ))}
        </div>
      </section>
    </main>
  )
}
