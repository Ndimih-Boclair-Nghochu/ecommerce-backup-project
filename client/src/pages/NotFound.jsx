import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
      <section className="max-w-lg w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-3">404</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-4">Page not found</h1>
        <p className="text-gray-600 mb-8">
          This page is not available. You can return home or continue shopping from the products page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="rounded-md bg-stone-900 px-5 py-3 text-white font-semibold hover:bg-stone-950">
            Go Home
          </Link>
          <Link to="/products" className="rounded-md border border-gray-300 px-5 py-3 text-gray-800 font-semibold hover:bg-white">
            Browse Products
          </Link>
        </div>
      </section>
    </main>
  )
}
