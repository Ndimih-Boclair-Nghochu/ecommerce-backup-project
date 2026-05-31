import React from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            The page could not load correctly. Please go back home and try again.
          </p>
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-blue-700 px-5 py-3 text-white font-semibold hover:bg-blue-800">
            Go Home
          </Link>
        </div>
      </div>
    )
  }
}
