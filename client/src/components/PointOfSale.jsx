import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function PointOfSale({ token }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  })
  const [items, setItems] = useState([])
  const [itemInput, setItemInput] = useState({
    itemName: '',
    price: '',
    quantity: 1
  })
  const [discountPercent, setDiscountPercent] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Product catalog states
  const [activeTab, setActiveTab] = useState('manual')
  const [platformProducts, setPlatformProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformName, setPlatformName] = useState('MyShop')

  // Fetch platform products and name on mount
  useEffect(() => {
    fetchPlatformProducts()
    fetchPlatformName()
  }, [])

  // Fetch products from API
  const fetchPlatformProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await axios.get('/api/products')
      setPlatformProducts(response.data || [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch platform name from API
  const fetchPlatformName = async () => {
    try {
      const response = await axios.get('/api/platform-name')
      if (response.data?.platformName) {
        setPlatformName(response.data.platformName)
      }
    } catch (err) {
      console.error('Failed to fetch platform name:', err)
      // Use default name if fetch fails
      setPlatformName('MyShop')
    }
  }

  // Add product from catalog to cart
  const addProductToCart = (product) => {
    const newItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price,
      quantity: 1,
      properties: []
    }
    setItems([...items, newItem])
    setMessage({ type: 'success', text: `✅ ${product.name} added to cart!` })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Quick add product and print immediately
  const quickAddAndPrint = async (product) => {
    if (!customerInfo.name) {
      setMessage({ type: 'error', text: '❌ Please enter customer name first' })
      return
    }

    // Create receipt with this single product
    const receiptData = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      platformName: platformName,
      createdAt: new Date().toLocaleString(),
      customer: {
        name: customerInfo.name,
        phone: customerInfo.phone
      },
      items: [{
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        properties: []
      }],
      discountPercent: 0,
      totals: {
        subtotal: product.price,
        discount: 0,
        total: product.price
      }
    }

    try {
      // Save order to backend
      await axios.post('/api/orders', {
        buyer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: '',
          address: ''
        },
        items: [{
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }],
        totals: {
          subtotal: product.price,
          discount: 0,
          subtotalAfterDiscount: product.price,
          tax: 0,
          shipping: 0,
          total: product.price
        },
        discountPercent: 0,
        isInStoreSale: true,
        paymentMethod: 'cash',
        isPaid: true,
        status: 'completed'
      })

      setGeneratedReceipt(receiptData)
      
      // Auto-print after a short delay
      setTimeout(() => {
        printReceiptAuto(receiptData)
      }, 500)
    } catch (err) {
      console.error('Failed to save receipt:', err)
      setMessage({ type: 'error', text: '❌ Failed to save receipt' })
    }
  }

  // Add item manually
  const addItem = () => {
    if (!itemInput.itemName || !itemInput.price) {
      setMessage({ type: 'error', text: '❌ Please fill in item name and price' })
      return
    }

    const newItem = {
      id: `manual-${Date.now()}`,
      name: itemInput.itemName,
      price: parseFloat(itemInput.price),
      quantity: parseInt(itemInput.quantity) || 1,
      properties: []
    }

    setItems([...items, newItem])
    setItemInput({ itemName: '', price: '', quantity: 1 })
    setMessage({ type: 'success', text: '✅ Item added to cart!' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Remove item
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const total = subtotal - discountAmount

  // Generate receipt
  const generateReceipt = async () => {
    if (!customerInfo.name) {
      setMessage({ type: 'error', text: '❌ Please enter customer name' })
      return
    }

    if (items.length === 0) {
      setMessage({ type: 'error', text: '❌ Please add items to cart' })
      return
    }

    try {
      setLoading(true)

      const receiptData = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        platformName: platformName,
        createdAt: new Date().toLocaleString(),
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone
        },
        items: items,
        discountPercent: discountPercent,
        paymentMethod: 'cash',
        totals: {
          subtotal: subtotal,
          discount: discountAmount,
          total: total
        }
      }

      // Save POS receipt to backend (not as an order, separate POS sales system)
      await axios.post('/api/pos/save-receipt', {
        receipt: receiptData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setGeneratedReceipt(receiptData)
      setShowReceipt(true)
      setMessage({ type: 'success', text: '✅ Receipt generated and saved!' })
    } catch (err) {
      console.error('Failed to save receipt:', err.response?.data || err.message)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to generate receipt'
      setMessage({ type: 'error', text: `❌ ${errorMsg}` })
    } finally {
      setLoading(false)
    }
  }

  // Reset form after closing receipt
  const resetForm = () => {
    setShowReceipt(false)
    setGeneratedReceipt(null)
    setItems([])
    setCustomerInfo({ name: '', phone: '' })
    setItemInput({ itemName: '', price: '', quantity: 1 })
    setDiscountPercent(0)
    setMessage({ type: '', text: '' })
  }

  // Print receipt
  const printReceipt = () => {
    const printWindow = window.open('', '', 'width=400,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, monospace; padding: 20px; max-width: 400px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 5px 0; font-size: 18px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 15px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals { margin: 15px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .total-amount { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${generatedReceipt.platformName}</h2>
            <p>RECEIPT</p>
            <p>ID: ${generatedReceipt.id}</p>
            <p>${generatedReceipt.createdAt}</p>
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Customer:</strong> ${generatedReceipt.customer.name}</p>
          ${generatedReceipt.customer.phone ? `<p><strong>Phone:</strong> ${generatedReceipt.customer.phone}</p>` : ''}
          
          <div class="divider"></div>
          
          <div class="items">
            <strong>Items:</strong>
            ${generatedReceipt.items.map(item => `
              <div class="item">
                <div>
                  <div>${item.quantity}x ${item.name}</div>
                  ${item.properties && item.properties.length > 0 ? `
                    <div style="font-size: 11px; color: #666; margin-left: 10px;">
                      📋 ${item.properties.map(prop => prop.name + ': ' + prop.value).join(', ')}
                    </div>
                  ` : ''}
                </div>
                <span>XAF ${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>XAF ${generatedReceipt.totals.subtotal.toLocaleString()}</span>
            </div>
            ${generatedReceipt.discountPercent > 0 ? `
              <div class="total-row">
                <span>Discount (${generatedReceipt.discountPercent}%):</span>
                <span>-XAF ${generatedReceipt.totals.discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row total-amount">
              <span>TOTAL:</span>
              <span>XAF ${generatedReceipt.totals.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Auto-print receipt
  const printReceiptAuto = (receipt) => {
    const printWindow = window.open('', '', 'width=400,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, monospace; padding: 20px; max-width: 400px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 5px 0; font-size: 18px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 15px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals { margin: 15px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .total-amount { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${receipt.platformName}</h2>
            <p>RECEIPT</p>
            <p>ID: ${receipt.id}</p>
            <p>${receipt.createdAt}</p>
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Customer:</strong> ${receipt.customer.name}</p>
          ${receipt.customer.phone ? `<p><strong>Phone:</strong> ${receipt.customer.phone}</p>` : ''}
          
          <div class="divider"></div>
          
          <div class="items">
            <strong>Items:</strong>
            ${receipt.items.map(item => `
              <div class="item">
                <div>
                  <div>${item.quantity}x ${item.name}</div>
                  ${item.properties && item.properties.length > 0 ? `
                    <div style="font-size: 11px; color: #666; margin-left: 10px;">
                      📋 ${item.properties.map(prop => prop.name + ': ' + prop.value).join(', ')}
                    </div>
                  ` : ''}
                </div>
                <span>XAF ${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>XAF ${receipt.totals.subtotal.toLocaleString()}</span>
            </div>
            ${receipt.discountPercent > 0 ? `
              <div class="total-row">
                <span>Discount (${receipt.discountPercent}%):</span>
                <span>-XAF ${receipt.totals.discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row total-amount">
              <span>TOTAL:</span>
              <span>XAF ${receipt.totals.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Main render
  if (showReceipt && generatedReceipt) {
    return (
      <div className="space-y-6">
        {message.text && (
          <div className={`p-4 rounded-lg font-semibold text-sm border-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200 max-w-md mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm border border-gray-300 mb-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold">{generatedReceipt.platformName}</h2>
              <p className="font-bold">RECEIPT</p>
              <p className="text-xs">ID: {generatedReceipt.id}</p>
              <p className="text-xs">{generatedReceipt.createdAt}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            <p className="mb-2"><strong>Customer:</strong> {generatedReceipt.customer.name}</p>
            {generatedReceipt.customer.phone && (
              <p className="mb-2"><strong>Phone:</strong> {generatedReceipt.customer.phone}</p>
            )}

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            <div className="mb-3">
              <strong>Items:</strong>
              {generatedReceipt.items.map((item, idx) => (
                <div key={idx} className="text-xs mt-2">
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>XAF {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  {item.properties && item.properties.length > 0 && (
                    <div className="text-xs text-gray-500 ml-2 mt-1">
                      📋 {item.properties.map((prop, i) => `${prop.name}: ${prop.value}`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>XAF {generatedReceipt.totals.subtotal.toLocaleString()}</span>
              </div>
              {generatedReceipt.discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({generatedReceipt.discountPercent}%):</span>
                  <span>-XAF {generatedReceipt.totals.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL:</span>
                <span>XAF {generatedReceipt.totals.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            <div className="text-center text-xs">
              <p>Thank you for your purchase!</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={printReceipt}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition"
            >
              🖨️ Print Receipt
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-bold transition"
            >
              ✓ New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main POS Interface
  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg font-semibold text-sm border-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-300'
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* TAB SELECTOR */}
      <div className="flex gap-2 bg-white rounded-xl shadow-md p-2 border-2 border-purple-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ✏️ Write Manually
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
            activeTab === 'products'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🛍️ Select Products
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Items or Select Products */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MANUAL ENTRY TAB */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ Write Manually</h3>
              <p className="text-xs text-gray-600 mb-4">Enter item details manually for custom receipts</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g., iPhone 15 Pro"
                    value={itemInput.itemName}
                    onChange={(e) => setItemInput({ ...itemInput, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price (XAF)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={itemInput.price}
                      onChange={(e) => setItemInput({ ...itemInput, price: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemInput.quantity}
                      onChange={(e) => setItemInput({ ...itemInput, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={addItem}
                  disabled={!itemInput.itemName || !itemInput.price}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold transition"
                >
                  ➕ Add Item
                </button>
              </div>
            </div>
          )}
          
          {/* PRODUCT SELECTION TAB */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🛍️ Select from Catalog</h3>
              <p className="text-xs text-gray-600 mb-4">Click to add to cart or ⚡ to print immediately</p>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                />
              </div>
              
              {/* Products Grid */}
              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading products...</p>
                </div>
              ) : platformProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {platformProducts
                    .filter(product => 
                      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((product) => (
                      <div key={product.id} className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border-2 border-green-200 hover:border-green-400 transition">
                        <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                        <p className="text-lg font-black text-green-600 mb-2">XAF {product.price?.toLocaleString() || 0}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => addProductToCart(product)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition"
                          >
                            ➕ Add
                          </button>
                          <button
                            onClick={() => quickAddAndPrint(product)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold transition"
                            title="Add and print immediately"
                          >
                            ⚡ Print
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          
          {/* Items in Cart */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🛒 Cart Items ({items.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-purple-50 p-2 rounded border border-purple-200">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.quantity}x XAF {item.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Customer Info & Totals */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">👤 Customer</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+237 6 XX XXX XXX"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-4">💰 Totals</h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white p-4 rounded-lg border-2 border-green-300 space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">XAF {subtotal.toLocaleString()}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-bold">-XAF {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t-2 border-green-300 pt-2 flex justify-between text-lg">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold text-green-600">XAF {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={generateReceipt}
              disabled={loading || items.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition shadow-lg"
            >
              {loading ? '⏳ Generating...' : '✓ Generate Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
