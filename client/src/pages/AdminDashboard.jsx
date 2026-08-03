import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../lib/api'
import Receipt from '../components/Receipt'
import AdminMessaging from '../components/AdminMessaging'
import RealTimeStatistics from '../components/RealTimeStatistics'
import POSStatistics from '../components/POSStatistics'
import DashboardOverview from '../components/DashboardOverview'
import OrderManagement from '../components/OrderManagement'
import SubAdminManagement from '../components/SubAdminManagement'
import PointOfSale from '../components/PointOfSale'
import { getProductImage, resolveAssetUrl } from '../utils/format'
import { dictionaries } from '../i18n/LanguageContext'

// Groups of editable public-site text keys, in a friendly order. Any dictionary
// key not listed here is collected into an "Other text" group automatically, so
// every string on the public site is editable.
const CONTENT_GROUPS = [
  { title: 'Navigation & buttons', keys: ['home', 'products', 'track', 'wishlist', 'admin', 'cart', 'menu', 'close', 'searchProducts', 'viewAll', 'allCategories', 'language', 'shopNow', 'learnMore', 'addToCart', 'browseProducts'] },
  { title: 'Hero & shop section', keys: ['homeShopCta', 'shopChip', 'productsEquipment', 'productsIntro'] },
  { title: 'Services & Training', keys: ['servicesChip', 'whatWe', 'offer', 'servicesIntro', 'servicesQuote', 'viewAllProductsServices', 'svcResearchTitle', 'svcResearchDesc', 'svcStorageTitle', 'svcStorageDesc', 'svcDrillingTitle', 'svcDrillingDesc', 'svcWeldingTitle', 'svcWeldingDesc', 'svcSolarTitle', 'svcSolarDesc', 'svcWaterworksTitle', 'svcWaterworksDesc', 'svcTrainingTitle', 'svcTrainingDesc'] },
  { title: 'Our Reach (stats)', keys: ['reachTitle', 'statServiceAreas', 'statCountryCoverage', 'statProductsListed', 'statSupport'] },
  { title: 'Partners', keys: ['networkChip', 'partnersTitle', 'partnersIntro', 'partnerScgDesc', 'partnerEmasDesc', 'partnerTadehDesc', 'partnerMetametaDesc'] },
  { title: 'Why choose us', keys: ['whySccChip', 'sccAdvantage', 'advNationwideTitle', 'advNationwideDesc', 'advTrainingTitle', 'advTrainingDesc', 'advAffordableTitle', 'advAffordableDesc'] },
  { title: 'Call to action', keys: ['ctaTitle', 'ctaDesc', 'trackYourOrder'] },
  { title: 'Store locations', keys: ['storeLocationsChip', 'visitOurStore', 'findUsNearYou', 'mainStore', 'branchLocations', 'address', 'phoneLabel', 'emailLabel', 'hoursLabel', 'openInMaps', 'noLocations'] },
  { title: 'Footer', keys: ['footerTagline', 'franchiseOf', 'servicesHeading', 'quickLinks', 'contactHeading', 'myAccount', 'footerAddressLine1', 'footerAddressLine2', 'servingNgosGov', 'contractorsIndividuals', 'rights'] },
  { title: 'Products & catalog', keys: ['productsComingSoon', 'catalogBeingSetUp', 'noProductsFound', 'tryDifferentSearch', 'showingPage', 'description', 'noDescription', 'related', 'noRelated', 'new', 'popular', 'outOfStock', 'inStockCount', 'variant', 'option', 'backProducts', 'productNotFound', 'featured', 'featuredTitle', 'emptyWishlist', 'saveProducts', 'filters', 'clearFilters', 'category', 'priceRange', 'inStockOnly', 'newest'] }
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const [statisticsTab, setStatisticsTab] = useState('platform')
  const [products, setProducts] = useState([])
  const [subAdmins, setSubAdmins] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [showSubAdminForm, setShowSubAdminForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingSubAdminId, setEditingSubAdminId] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [shippingFees, setShippingFees] = useState({})
  const [shippingForm, setShippingForm] = useState({})
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [installmentStats, setInstallmentStats] = useState({})
  const [orderSearch, setOrderSearch] = useState('')
  const [orderSortBy, setOrderSortBy] = useState('newest')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState([])
  const [bulkOrderStatus, setBulkOrderStatus] = useState('')
  const [newTown, setNewTown] = useState('')
  const [newTownFee, setNewTownFee] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [mainShopTown, setMainShopTown] = useState('Douala')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50000)
  const [regionFreeShipping, setRegionFreeShipping] = useState({})
  const [showFreeShippingForm, setShowFreeShippingForm] = useState(false)
  const [locations, setLocations] = useState([])
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState(null)
  const [platformStats, setPlatformStats] = useState({ totalInStock: 0, averageRating: 0, deliveryTime: 'Manual confirmation' })
  const [statsForm, setStatsForm] = useState({ totalInStock: 0, averageRating: 0, deliveryTime: 'Manual confirmation' })
  const [locationForm, setLocationForm] = useState({
    name: '', city: '', address: '', phone: '', email: '', 
    lat: '', lng: '', hours: '', description: '', isMainStore: false
  })
  const [paymentAccounts, setPaymentAccounts] = useState({
    card: { accountName: 'Merchant Account', accountNumber: '', bankName: '', accountHolder: '', isActive: false },
    momo: { mtn: { accountName: 'MTN Mobile Money', phoneNumber: '', accountHolder: '', isActive: false }, orange: { accountName: 'Orange Money', phoneNumber: '', accountHolder: '', isActive: false } },
    cash: { accountName: 'Cash at Pickup', notes: 'Collect cash when customer picks up order', isActive: true }
  })
  const [editingPaymentType, setEditingPaymentType] = useState(null)

  const shippingKeys = Object.keys(shippingForm || {})

  // Order Statistics Calculations
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
    averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0) / orders.length) : 0,
    newOrders: orders.filter(o => {
      const created = new Date(o.createdAt)
      const now = new Date()
      return (now - created) < 24 * 60 * 60 * 1000
    }).length,
    totalItems: orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)
  }

  // Filtered Orders
  const filteredOrders = (() => {
    let result = [...orders]
    if (orderStatusFilter !== 'all') {
      result = result.filter(o => o.status === orderStatusFilter)
    }
    if (orderSearch && orderSearch.trim()) {
      const query = orderSearch.toLowerCase().trim()
      result = result.filter(o =>
        (o.buyer?.name && o.buyer.name.toLowerCase().includes(query)) ||
        (o.buyer?.email && o.buyer.email.toLowerCase().includes(query)) ||
        (o.buyer?.phone && o.buyer.phone.toLowerCase().includes(query)) ||
        (o.id && o.id.toLowerCase().includes(query))
      )
    }
    if (orderSortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (orderSortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (orderSortBy === 'highest') {
      result.sort((a, b) => (b.totals?.total || 0) - (a.totals?.total || 0))
    } else if (orderSortBy === 'lowest') {
      result.sort((a, b) => (a.totals?.total || 0) - (b.totals?.total || 0))
    }
    return result
  })()

  const [productForm, setProductForm] = useState({
    name: '', price: '', description: '', stock: '', 
    category: '', image: '', mostOrdered: false, isNew: false,
    availableRegions: ['ALL'],
    images: [{ color: 'default', url: '' }], sku: '', weight: '', dimensions: '',
    storeAvailability: {}, // { storeId: quantity }
    specifications: [], // [{ key: 'Color', value: 'Black' }, ...]
    warranty: '', barcode: '', tax: 0
  })

  const [productSearch, setProductSearch] = useState('')
  const [productSortBy, setProductSortBy] = useState('name')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Category Management
  // Categories are derived from existing products so a category disappears
  // automatically once its last product is deleted. `extraCategories` only holds
  // brand-new names typed in the product form before the product is saved.
  const [extraCategories, setExtraCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const categories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => { if (p.category && String(p.category).trim()) set.add(String(p.category).trim()) })
    extraCategories.forEach((c) => { if (c && String(c).trim()) set.add(String(c).trim()) })
    if (productForm.category && String(productForm.category).trim()) set.add(String(productForm.category).trim())
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products, extraCategories, productForm.category])

  // Website Text (public content overrides)
  const [contentLang, setContentLang] = useState('en')
  const [contentOverrides, setContentOverrides] = useState({ en: {}, fr: {} })
  const [contentSearch, setContentSearch] = useState('')
  const [contentSaving, setContentSaving] = useState(false)

  // Store Availability & Features
  const [productSpecifications, setProductSpecifications] = useState({ key: '', value: '' })
  const [uploadingImage, setUploadingImage] = useState(false)

  const [subAdminForm, setSubAdminForm] = useState({
    name: '', email: '', password: '', permissions: ['products']
  })

  const [settingsForm, setSettingsForm] = useState({
    email: '', currentPassword: '', newPassword: '', platformName: '',
    shopPhone: '', shopEmail: '', contactAddress: '',
    contactWebsiteUrl: '', contactWebsiteLabel: '',
    contactNoteTitle: '', contactNoteSubtitle: ''
  })

  const [heroForm, setHeroForm] = useState({
    badge: '',
    title: '',
    description: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    backgroundImage: ''
  })

  const [platformName, setPlatformName] = useState('MyShop')

  const [resetStatus, setResetStatus] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const token = localStorage.getItem('adminToken')

  const readUploadUrl = (payload) => payload?.imageUrl || payload?.url || ''

  const applyMainProductImage = (imageUrl) => {
    setProductForm((current) => {
      const images = Array.isArray(current.images) && current.images.length ? [...current.images] : [{ color: 'default', url: '' }]
      if (!images[0]?.url) images[0] = { ...images[0], color: images[0]?.color || 'default', url: imageUrl }
      return { ...current, image: imageUrl, images }
    })
  }

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }
    setAdminEmail(localStorage.getItem('adminEmail') || '')
    fetchProducts()
    fetchSubAdmins()
    fetchShippingFees()
    fetchOrders()
    fetchLocations()
    fetchStats()
    fetchResetStatus()
    fetchMainShopTown()
    fetchFreeShippingSettings()
    fetchPlatformName()
    fetchContactInfo()
    fetchHeroSection()
    fetchPaymentAccounts()
    fetchCustomersWithInstallments()
    fetchInstallmentStats()
    fetchSiteContent()
  }, [token, navigate])

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStats()
    }
  }, [activeTab])

  const fetchPlatformName = async () => {
    try {
      const response = await axios.get('/api/platform-name')
      setPlatformName(response.data.platformName || 'MyShop')
      setSettingsForm(prev => ({ ...prev, platformName: response.data.platformName || 'MyShop' }))
    } catch (err) {
      console.error('Failed to fetch platform name:', err)
    }
  }

  const fetchContactInfo = async () => {
    try {
      const { data } = await axios.get('/api/settings')
      setSettingsForm(prev => ({
        ...prev,
        shopPhone: data.shopPhone || '',
        shopEmail: data.shopEmail || '',
        contactAddress: data.contactAddress || '',
        contactWebsiteUrl: data.contactWebsiteUrl || '',
        contactWebsiteLabel: data.contactWebsiteLabel || '',
        contactNoteTitle: data.contactNoteTitle || '',
        contactNoteSubtitle: data.contactNoteSubtitle || ''
      }))
    } catch (err) {
      console.error('Failed to fetch contact info:', err)
    }
  }

  const fetchHeroSection = async () => {
    try {
      const response = await axios.get('/api/hero-section')
      setHeroForm(response.data)
    } catch (err) {
      console.error('Failed to fetch hero section:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin')
      }
    }
  }

  const fetchSubAdmins = async () => {
    try {
      const response = await axios.get('/api/admin/sub-admins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubAdmins(response.data)
    } catch (err) {
      console.error('Failed to fetch sub-admins:', err)
    }
  }

  const fetchShippingFees = async () => {
    try {
      const response = await axios.get('/api/admin/shipping-fees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShippingFees(response.data)
      setShippingForm(response.data)
    } catch (err) {
      console.error('Failed to fetch shipping fees:', err)
    }
  }

  const fetchMainShopTown = async () => {
    try {
      const response = await axios.get('/api/admin/main-shop-town', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMainShopTown(response.data.mainShopTown)
    } catch (err) {
      console.error('Failed to fetch main shop town:', err)
    }
  }

  const saveMainShopTown = async (town) => {
    try {
      await axios.put('/api/admin/main-shop-town', { mainShopTown: town }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMainShopTown(town)
    } catch (err) {
      console.error('Failed to save main shop town:', err)
    }
  }

  const fetchFreeShippingSettings = async () => {
    try {
      const response = await axios.get('/api/admin/free-shipping', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFreeShippingThreshold(response.data.platformThreshold || 50000)
      setRegionFreeShipping(response.data.regionThresholds || {})
    } catch (err) {
      console.error('Failed to fetch free shipping settings:', err)
    }
  }

  const saveFreeShippingSettings = async () => {
    try {
      await axios.put('/api/admin/free-shipping', {
        platformThreshold: freeShippingThreshold,
        regionThresholds: regionFreeShipping
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Free shipping settings saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      console.error('Failed to save free shipping settings:', err)
      setMessage({ type: 'error', text: 'Failed to save free shipping settings' })
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const fetchCustomersWithInstallments = async () => {
    try {
      const response = await axios.get('/api/admin/customers-with-installments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(response.data.customers || [])
    } catch (err) {
      console.error('Failed to fetch customers with installments:', err)
    }
  }

  const fetchInstallmentStats = async () => {
    try {
      const response = await axios.get('/api/admin/installment-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInstallmentStats(response.data.stats || {})
    } catch (err) {
      console.error('Failed to fetch installment stats:', err)
    }
  }

  const handleBulkOrderUpdate = async () => {
    if (!bulkOrderStatus || selectedOrders.length === 0) {
      setMessage({ type: 'error', text: 'Please select orders and a status' })
      return
    }
    try {
      for (const orderId of selectedOrders) {
        await axios.put(`/api/admin/orders/${orderId}`, 
          { status: bulkOrderStatus }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      setMessage({ type: 'success', text: ` Updated ${selectedOrders.length} order(s) to ${bulkOrderStatus}` })
      setSelectedOrders([])
      setBulkOrderStatus('')
      fetchOrders()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update orders' })
      console.error('Bulk update error:', err)
    }
  }

  const handleStatusChange = async (order, newStatus) => {
    try {
      await axios.put(`/api/admin/orders/${order.id}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setOrders(orders.map(o => o.id === order.id ? {...o, status: newStatus} : o))
      setMessage({ type: 'success', text: ` Order status updated to ${newStatus}` })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' })
    }
  }


  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/admin/locations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLocations(response.data)
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    }
  }

  const fetchPaymentAccounts = async () => {
    try {
      const response = await axios.get('/api/payment-accounts')
      setPaymentAccounts(response.data)
    } catch (err) {
      console.error('Failed to fetch payment accounts:', err)
    }
  }

  const savePaymentAccount = async (type, provider = null, accountData) => {
    try {
      setLoading(true)
      const payload = { type, provider, ...accountData }
      const response = await axios.post('/api/admin/payment-accounts', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPaymentAccounts(response.data.paymentAccounts)
      setMessage({ type: 'success', text: `${accountData.accountName} updated successfully` })
      setEditingPaymentType(null)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save payment account' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats')
      setPlatformStats(response.data)
      setStatsForm({
        totalInStock: response.data.totalInStock || 0,
        averageRating: response.data.averageRating || 0,
        deliveryTime: response.data.deliveryTime || '24-48h'
      })
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that an image has been provided
    if (!productForm.image) {
      setMessage({ type: 'error', text: 'Please upload or provide an image URL' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }
    
    setLoading(true)
    try {
      if (editingProductId) {
        await axios.put(`/api/admin/products/${editingProductId}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Product updated successfully' })
      } else {
        await axios.post('/api/admin/products', productForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Product created successfully' })
      }
      setProductForm({ name: '', price: '', description: '', stock: '', category: '', image: '', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: '' }], sku: '', weight: '', dimensions: '', storeAvailability: {}, specifications: [], warranty: '', barcode: '', tax: 0 })
      setEditingProductId(null)
      setShowProductForm(false)
      fetchProducts()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save product' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleSubAdminSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingSubAdminId) {
        await axios.put(`/api/admin/sub-admins/${editingSubAdminId}`, 
          { name: subAdminForm.name, permissions: subAdminForm.permissions },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMessage({ type: 'success', text: 'Sub-admin updated successfully' })
      } else {
        await axios.post('/api/admin/sub-admins', subAdminForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Sub-admin created successfully' })
      }
      setSubAdminForm({ name: '', email: '', password: '', permissions: ['products'] })
      setEditingSubAdminId(null)
      setShowSubAdminForm(false)
      fetchSubAdmins()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save sub-admin' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Product deleted successfully' })
      fetchProducts()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete product' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDeleteSubAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return
    try {
      await axios.delete(`/api/admin/sub-admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Sub-admin deleted successfully' })
      fetchSubAdmins()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete sub-admin' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      stock: product.stock || '',
      category: product.category || '',
      image: product.image || '',
      mostOrdered: !!product.mostOrdered,
      isNew: !!product.isNew,
      availableRegions: product.availableRegions && product.availableRegions.length ? product.availableRegions : ['ALL'],
      images: product.images && product.images.length ? product.images : [{ color: 'default', url: product.image || '' }],
      sku: product.sku || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      storeAvailability: product.storeAvailability || {},
      specifications: product.specifications || [],
      warranty: product.warranty || '',
      barcode: product.barcode || '',
      tax: product.tax || 0
    })
    setEditingProductId(product.id)
    setShowProductForm(true)
  }

  const handleEditSubAdmin = (subAdmin) => {
    setSubAdminForm({ name: subAdmin.name, email: subAdmin.email, password: '', permissions: subAdmin.permissions })
    setEditingSubAdminId(subAdmin.id)
    setShowSubAdminForm(true)
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.put('/api/admin/settings',
        {
          email: settingsForm.email || undefined,
          password: settingsForm.newPassword || undefined,
          platformName: settingsForm.platformName || undefined,
          shopPhone: settingsForm.shopPhone,
          shopEmail: settingsForm.shopEmail,
          contactAddress: settingsForm.contactAddress,
          contactWebsiteUrl: settingsForm.contactWebsiteUrl,
          contactWebsiteLabel: settingsForm.contactWebsiteLabel,
          contactNoteTitle: settingsForm.contactNoteTitle,
          contactNoteSubtitle: settingsForm.contactNoteSubtitle
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const updatedEmail = data?.admin?.email || data?.email || settingsForm.email
      if (updatedEmail) {
        localStorage.setItem('adminEmail', updatedEmail)
        setAdminEmail(updatedEmail)
      }
      if (data?.token) {
        localStorage.setItem('adminToken', data.token)
      }
      if (settingsForm.platformName) {
        setPlatformName(settingsForm.platformName)
      }
      // Update the cached public settings so the storefront shows the new
      // contact details immediately (App reads this cache on next load).
      try {
        const cached = JSON.parse(localStorage.getItem('shopSettingsCache') || '{}')
        localStorage.setItem('shopSettingsCache', JSON.stringify({
          ...cached,
          shopPhone: settingsForm.shopPhone,
          shopEmail: settingsForm.shopEmail,
          contactAddress: settingsForm.contactAddress,
          contactWebsiteUrl: settingsForm.contactWebsiteUrl,
          contactWebsiteLabel: settingsForm.contactWebsiteLabel,
          contactNoteTitle: settingsForm.contactNoteTitle,
          contactNoteSubtitle: settingsForm.contactNoteSubtitle,
          ...(settingsForm.platformName ? { shopName: settingsForm.platformName } : {})
        }))
      } catch {}
      setMessage({ type: 'success', text: 'Settings updated successfully' })
      // Clear only the credential fields; keep platform name and contact
      // details visible so the admin can see the saved values.
      setSettingsForm(prev => ({ ...prev, email: '', currentPassword: '', newPassword: '' }))
      // Pull the authoritative saved values back into the form.
      fetchContactInfo()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update settings' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleHeroSectionUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put('/api/admin/hero-section', heroForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Hero section updated successfully' })
      fetchHeroSection()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update hero section' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const fetchResetStatus = async () => {
    try {
      const response = await axios.get('/api/admin/reset-status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResetStatus(response.data)
    } catch (err) {
      console.error('Failed to fetch reset status:', err)
    }
  }

  const fetchSiteContent = async () => {
    try {
      const response = await axios.get('/api/site-content')
      const data = response.data && typeof response.data === 'object' ? response.data : {}
      setContentOverrides({ en: { ...(data.en || {}) }, fr: { ...(data.fr || {}) } })
    } catch (err) {
      console.error('Failed to fetch site content:', err)
    }
  }

  const handleContentChange = (lang, key, value) => {
    setContentOverrides((current) => ({
      ...current,
      [lang]: { ...(current[lang] || {}), [key]: value }
    }))
  }

  const handleSaveSiteContent = async () => {
    setContentSaving(true)
    try {
      // Drop empty overrides so those strings fall back to the built-in default.
      const payload = {}
      for (const lang of Object.keys(contentOverrides)) {
        const langMap = {}
        for (const [key, value] of Object.entries(contentOverrides[lang] || {})) {
          if (typeof value === 'string' && value.trim()) langMap[key] = value.trim()
        }
        payload[lang] = langMap
      }
      await axios.put('/api/admin/site-content', payload, { headers: { Authorization: `Bearer ${token}` } })
      setContentOverrides({ en: { ...(payload.en || {}) }, fr: { ...(payload.fr || {}) } })
      try { localStorage.setItem('siteContentCache', JSON.stringify(payload)) } catch {}
      setMessage({ type: 'success', text: 'Website text saved. Public pages will show the new text.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save website text' })
    } finally {
      setContentSaving(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3500)
    }
  }

  const handlePlatformReset = async () => {
    setResetLoading(true)
    try {
      const response = await axios.post('/api/admin/reset-platform', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Platform reset initiated! Data will be permanently deleted in 48 hours.' })
      setShowResetConfirm(false)
      // Clear all data immediately on frontend
      setProducts([])
      setOrders([])
      setUsers([])
      setExtraCategories([])
      setSubAdmins([])
      // Notify all other pages/tabs about reset
      sessionStorage.setItem('platformReset', JSON.stringify({ timestamp: Date.now(), isReset: true }))
      // Dispatch custom event for pages listening
      window.dispatchEvent(new Event('platformReset'))
      await fetchResetStatus()
      // Force page reload after 1 second to ensure all changes are visible
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to reset platform'
      console.error('Reset platform error:', errorMsg)
      setMessage({ type: 'error', text: ` Reset failed: ${errorMsg}` })
      setResetLoading(false)
    }
  }

  const handleExtendRecoveryWindow = async () => {
    if (!window.confirm('Extend recovery window by 48 more hours? This will allow you more time to restore your data.')) {
      return
    }
    try {
      const response = await axios.post('/api/admin/extend-recovery-window', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Recovery window extended by 48 hours!' })
      fetchResetStatus()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to extend recovery window'
      console.error('Extend recovery error:', errorMsg)
      setMessage({ type: 'error', text: ` Extension failed: ${errorMsg}` })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
  }

  const handleRestorePlatform = async () => {
    if (!window.confirm('Are you sure you want to restore all your data from the reset backup? This cannot be undone.')) {
      return
    }
    try {
      const response = await axios.post('/api/admin/restore-platform', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Platform restored successfully! Refreshing data...' })
      // Notify all other pages about restore
      sessionStorage.removeItem('platformReset')
      window.dispatchEvent(new Event('platformRestored'))
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to restore platform'
      console.error('Restore platform error:', errorMsg)
      setMessage({ type: 'error', text: ` ${errorMsg}` })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
  }

  const handlePermanentlyDeleteData = async () => {
    if (!window.confirm('FINAL WARNING: This will PERMANENTLY delete all your data. The 48-hour recovery window will expire. Are you absolutely certain? Type CONFIRM in the next step to proceed.')) {
      return
    }
    const confirmation = window.prompt('Type "CONFIRM" to permanently delete all data:')
    if (confirmation === 'CONFIRM') {
      try {
        // Just clear the reset status - data is already gone
        setResetStatus(null)
        setMessage({ type: 'success', text: 'All data has been permanently deleted.' })
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to complete deletion' })
      }
    } else {
      setMessage({ type: 'error', text: 'Permanent deletion cancelled' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleLocationSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingLocationId) {
        await axios.put(`/api/admin/locations/${editingLocationId}`, locationForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Location updated successfully' })
      } else {
        await axios.post('/api/admin/locations', locationForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Location added successfully' })
      }
      setLocationForm({ name: '', city: '', address: '', phone: '', email: '', lat: '', lng: '', hours: '', description: '', isMainStore: false })
      setEditingLocationId(null)
      setShowLocationForm(false)
      fetchLocations()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save location' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return
    try {
      await axios.delete(`/api/admin/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Location deleted successfully' })
      fetchLocations()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete location' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleEditLocation = (location) => {
    setLocationForm({
      name: location.name || '',
      city: location.city || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      lat: location.lat || '',
      lng: location.lng || '',
      hours: location.hours || '',
      description: location.description || '',
      isMainStore: location.isMainStore || false
    })
    setEditingLocationId(location.id)
    setShowLocationForm(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    navigate('/admin')
  }

  const handleViewReceipt = (order) => {
    setReceiptOrder(order)
  }

  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    electronics: products.filter(p => p.category === 'Electronics').length,
    accessories: products.filter(p => p.category === 'Accessories').length,
    totalSubAdmins: subAdmins.length
  }

  const adminTabs = [
    { key: 'overview', label: 'Overview', icon: '' },
    { key: 'products', label: 'Products', icon: '' },
    { key: 'pos', label: 'POS', icon: '' },
    { key: 'orders', label: 'Orders', icon: '' },
    { key: 'sub-admins', label: 'Team', icon: '' },
    { key: 'locations', label: 'Locations', icon: '' },
    { key: 'statistics', label: 'Stats', icon: '' },
    { key: 'chat', label: 'Chat', icon: '' },
    { key: 'content', label: 'Website Text', icon: '' },
    { key: 'settings', label: 'Settings', icon: '' }
  ]
  const mobilePrimaryTabs = adminTabs.slice(0, 4)
  const mobileMoreTabs = adminTabs.slice(4)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Manage your e-commerce platform</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-blue-100">Logged in as</p>
              <p className="font-semibold text-sm sm:text-base truncate">{adminEmail}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition shadow-md">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 sm:gap-8 min-w-max sm:min-w-0">
            {adminTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 sm:py-4 px-2 sm:px-3 font-semibold border-b-2 transition text-xs sm:text-sm md:text-base whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
        <div className="grid grid-cols-5">
          {mobilePrimaryTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setMobileMoreOpen(false)
              }}
              className={`py-2 text-xs font-semibold flex flex-col items-center gap-1 ${activeTab === tab.key ? 'text-blue-700' : 'text-gray-600'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMobileMoreOpen(true)}
            className="py-2 text-xs font-semibold flex flex-col items-center gap-1 text-gray-600"
          >
            <span className="text-xl">⋯</span>
            <span>More</span>
          </button>
        </div>
      </div>

      <div className={`md:hidden fixed inset-0 z-50 ${mobileMoreOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close more admin navigation"
          onClick={() => setMobileMoreOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileMoreOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300 ${mobileMoreOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">More</h2>
            <button type="button" onClick={() => setMobileMoreOpen(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-xl leading-none">×</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mobileMoreTabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setMobileMoreOpen(false)
                }}
                className={`rounded-lg border p-4 text-left font-semibold ${activeTab === tab.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'}`}
              >
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg font-semibold text-sm sm:text-base border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-300' 
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Platform Reset Banner */}
      {resetStatus?.isReset && (
        <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-4 sm:p-6 rounded-lg border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-lg sm:text-xl font-bold text-orange-900">Platform in Reset Mode</p>
              <p className="text-sm text-orange-800 mt-1">All data has been temporarily deleted. You have <span className={`font-bold ${resetStatus.isExpired ? 'text-red-600' : 'text-green-600'}`}>{resetStatus.isExpired ? '0 hours' : `${resetStatus.hoursRemaining} hours`}</span> to restore your data.</p>
            </div>
            {!resetStatus.isExpired && (
              <button
                onClick={handleRestorePlatform}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition shadow-md whitespace-nowrap"
              >
                ✓ Restore Data Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <DashboardOverview 
            token={token}
            products={products}
            orders={orders}
            subAdmins={subAdmins}
            customers={customers}
            installmentStats={installmentStats}
            resetStatus={resetStatus}
            onAddProduct={() => setActiveTab('products')}
            onViewAnalytics={() => setActiveTab('statistics')}
            onManageTeam={() => setActiveTab('sub-admins')}
            onSettings={() => setActiveTab('settings')}
          />
        )}

        {/* POS TAB */}
        {activeTab === 'pos' && (
          <PointOfSale token={localStorage.getItem('adminToken')} />
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h2>
              {!showProductForm && (
                <button onClick={() => { setShowProductForm(true); setEditingProductId(null); setProductForm({ name: '', price: '', description: '', stock: '', category: '', image: '', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: '' }], sku: '', weight: '', dimensions: '', storeAvailability: {}, specifications: [], warranty: '', barcode: '', tax: 0 }); }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition shadow-md">
Add Product
                </button>
              )}
            </div>

            {showProductForm && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                  <div className="text-sm text-gray-500">
                    {editingProductId ? 'Updating existing product' : 'Creating new product'}
                  </div>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-6 sm:space-y-8">
                  {/* SECTION 1: Basic Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                    <h4 className="text-base font-bold text-blue-900 mb-4 flex items-center gap-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                        <input type="text" placeholder="e.g., Samsung Galaxy S24" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">Enter a descriptive product name</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                        <div className="flex gap-2">
                          <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition">
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setShowCategoryForm(!showCategoryForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition">

                          </button>
                        </div>
                        {showCategoryForm && (
                          <div className="mt-2 flex gap-2">
                            <input type="text" placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" />
                            <button type="button" onClick={() => {
                              const name = newCategory.trim()
                              if (name && !categories.includes(name)) {
                                setExtraCategories((prev) => [...prev, name])
                                setProductForm({...productForm, category: name})
                                setNewCategory('')
                                setShowCategoryForm(false)
                              }
                            }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-semibold text-sm">Add</button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Choose or add new category</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                        <input type="text" placeholder="e.g., PROD-001" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">Unique product identifier for inventory</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 mt-4">Description *</label>
                      <textarea placeholder="Enter detailed product description, features, and specifications..." value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} required rows="4" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition"></textarea>
                      <p className="text-xs text-gray-500 mt-1">Help customers understand your product</p>
                    </div>
                  </div>

                  {/* SECTION 2: Pricing & Inventory */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6 border border-green-200">
                    <h4 className="text-base font-bold text-green-900 mb-4 flex items-center gap-2">Pricing & Inventory</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Price (XAF) *</label>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="0" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} required className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                          <span className="font-bold text-gray-700">XAF</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Selling price in CFA francs</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Quantity *</label>
                        <input type="number" placeholder="0" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} required className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">Available units (warns if ≤10)</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Weight</label>
                        <input type="text" placeholder="e.g., 500g, 1.2kg" value={productForm.weight} onChange={(e) => setProductForm({...productForm, weight: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">For shipping calculations</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Dimensions</label>
                        <input type="text" placeholder="e.g., 10x20x30cm" value={productForm.dimensions} onChange={(e) => setProductForm({...productForm, dimensions: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">Length × Width × Height</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Visibility & Features */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-purple-200">
                    <h4 className="text-base font-bold text-purple-900 mb-4 flex items-center gap-2">Visibility & Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition">
                        <input type="checkbox" checked={productForm.mostOrdered} onChange={(e) => setProductForm({...productForm, mostOrdered: e.target.checked})} className="w-6 h-6 cursor-pointer" />
                        <div>
                          <div className="font-semibold text-gray-900">Most Ordered</div>
                          <div className="text-xs text-gray-600">Highlight as popular item</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition">
                        <input type="checkbox" checked={productForm.isNew} onChange={(e) => setProductForm({...productForm, isNew: e.target.checked})} className="w-6 h-6 cursor-pointer" />
                        <div>
                          <div className="font-semibold text-gray-900">New Product</div>
                          <div className="text-xs text-gray-600">Show new product badge</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* SECTION 5: Product Images */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-indigo-200">
                    <h4 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">Product Images</h4>
                    
                    {/* Main Product Image */}
                    <div className="mb-6 p-4 bg-white rounded-lg border-2 border-indigo-300">
                      <label className="block text-xs font-semibold text-gray-700 mb-3">Main Product Image *</label>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-2">Upload or paste URL:</label>
                            <input type="text" placeholder="https://example.com/product.jpg or /uploads/product.jpg" value={productForm.image} onChange={(e) => setProductForm({...productForm, image: e.target.value})} required={!productForm.image} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm transition" />
                            <p className="text-xs text-gray-500 mt-1">High-quality image for product listing</p>
                          </div>
                          {productForm.image && (
                            <img src={resolveAssetUrl(productForm.image)} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-indigo-300" onError={() => {}} />
                          )}
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <label className="block bg-indigo-50 px-4 py-3 rounded-lg font-semibold cursor-pointer border-2 border-dashed border-indigo-300 hover:bg-indigo-100 transition text-center">
Choose File to Upload
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setUploadingImage(true)
                              try {
                                const formData = new FormData()
                                formData.append('image', file)
                                const resp = await axios.post('/api/admin/upload', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
                                applyMainProductImage(readUploadUrl(resp.data))
                                setMessage({ type: 'success', text: 'Image uploaded successfully' })
                                setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                              } catch (err) {
                                setMessage({ type: 'error', text: 'Image upload failed' })
                                setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                              } finally {
                                setUploadingImage(false)
                              }
                            }} disabled={uploadingImage} />
                          </label>
                          <p className="text-xs text-gray-500 mt-2 text-center">{uploadingImage ? 'Uploading...' : 'JPG, PNG up to 5MB'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Color Variants */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-700">Color Variants (Optional)</label>
                        <button type="button" onClick={() => setProductForm({ ...productForm, images: [...productForm.images, { color: '', url: '' }] })} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-semibold transition">
                          + Add Variant
                        </button>
                      </div>
                      
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-200">
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Color Name</label>
                              <input type="text" placeholder="e.g., Black, Silver" value={img.color} onChange={(e) => {
                                const arr = [...productForm.images]; arr[idx] = { ...arr[idx], color: e.target.value }; setProductForm({ ...productForm, images: arr })
                              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm" />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL or File</label>
                              <input type="text" placeholder="https://example.com/image.jpg or choose file" value={img.url} onChange={(e) => {
                                const arr = [...productForm.images]; arr[idx] = { ...arr[idx], url: e.target.value }; setProductForm({ ...productForm, images: arr })
                              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm" />
                            </div>
                            <div className="flex gap-2">
                              <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold cursor-pointer text-sm transition">

                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    const formData = new FormData()
                                    formData.append('image', file)
                                    const resp = await axios.post('/api/admin/upload', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
                                    const imageUrl = readUploadUrl(resp.data)
                                    const arr = [...productForm.images]; arr[idx] = { ...arr[idx], url: imageUrl }; setProductForm({ ...productForm, image: productForm.image || imageUrl, images: arr })
                                    setMessage({ type: 'success', text: 'Image uploaded' })
                                    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                                  } catch (err) {
                                    setMessage({ type: 'error', text: 'Upload failed' })
                                    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                                  }
                                }} />
                              </label>
                              {productForm.images.length > 1 && (
                                <button type="button" onClick={() => {
                                  const arr = [...productForm.images]; arr.splice(idx, 1); setProductForm({ ...productForm, images: arr })
                                }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition"></button>
                              )}
                            </div>
                          </div>
                          {img.url && (
                            <div className="mt-2">
                              <img src={resolveAssetUrl(img.url)} alt={img.color || 'variant'} className="h-16 object-cover rounded border border-indigo-200" onError={() => {}} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 6: Advanced Product Details */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-cyan-200">
                    <h4 className="text-base font-bold text-cyan-900 mb-4 flex items-center gap-2">Advanced Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Barcode/EAN</label>
                        <input type="text" placeholder="e.g., 5901234123457" value={productForm.barcode} onChange={(e) => setProductForm({...productForm, barcode: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">For inventory tracking</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Warranty</label>
                        <input type="text" placeholder="e.g., 2 Years, 12 Months" value={productForm.warranty} onChange={(e) => setProductForm({...productForm, warranty: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">Product warranty period</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                        <input type="number" placeholder="0" min="0" max="100" step="0.1" value={productForm.tax} onChange={(e) => setProductForm({...productForm, tax: e.target.value})} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-sm transition" />
                        <p className="text-xs text-gray-500 mt-1">VAT/Tax percentage</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 7: Product Specifications */}
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-rose-200">
                    <h4 className="text-base font-bold text-rose-900 mb-4 flex items-center gap-2">Specifications</h4>
                    <div className="space-y-3">
                      {productForm.specifications && productForm.specifications.length > 0 && (
                        <div className="space-y-2">
                          {productForm.specifications.map((spec, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg border border-rose-200">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input type="text" placeholder="e.g., Color" value={spec.key} onChange={(e) => {
                                  const arr = [...productForm.specifications]; arr[idx].key = e.target.value; setProductForm({...productForm, specifications: arr})
                                }} className="px-2 py-1 border border-gray-300 rounded text-sm" />
                                <input type="text" placeholder="e.g., Black" value={spec.value} onChange={(e) => {
                                  const arr = [...productForm.specifications]; arr[idx].value = e.target.value; setProductForm({...productForm, specifications: arr})
                                }} className="px-2 py-1 border border-gray-300 rounded text-sm" />
                              </div>
                              <button type="button" onClick={() => {
                                const arr = productForm.specifications.filter((_, i) => i !== idx); setProductForm({...productForm, specifications: arr})
                              }} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => {
                        setProductForm({...productForm, specifications: [...(productForm.specifications || []), { key: '', value: '' }]})
                      }} className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">
                        + Add Specification
                      </button>
                      <p className="text-xs text-gray-600">Examples: Color, Material, Processor, RAM, Storage, etc.</p>
                    </div>
                  </div>

                  {/* SECTION 8: Store Availability */}
                  {locations && locations.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 sm:p-6 border border-yellow-200">
                      <h4 className="text-base font-bold text-yellow-900 mb-4 flex items-center gap-2">Store Availability</h4>
                      <p className="text-xs text-gray-600 mb-3">Set product quantity available at each store (customers can pick up from their preferred location)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locations.map(location => (
                          <div key={location.id} className="bg-white p-3 rounded-lg border border-yellow-200">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">{location.name} {location.isMainStore ? '' : ''}</label>
                            <input type="number" placeholder="0" min="0" value={productForm.storeAvailability[location.id] || 0} onChange={(e) => {
                              setProductForm({...productForm, storeAvailability: {...productForm.storeAvailability, [location.id]: parseInt(e.target.value) || 0}})
                            }} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                            <p className="text-xs text-gray-500 mt-1">{location.city} - {location.address}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                    <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 shadow-md text-base">
                      {editingProductId ? 'Update Product' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => { setShowProductForm(false); setEditingProductId(null); }} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition shadow-md text-base">
Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Search & Filter Controls */}
            {!showProductForm && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <input 
                      type="text" 
                      placeholder="Search by name or SKU..." 
                      value={productSearch} 
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                    <select 
                      value={productSortBy} 
                      onChange={(e) => setProductSortBy(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="price-low">Price (Low to High)</option>
                      <option value="price-high">Price (High to Low)</option>
                      <option value="stock-low">Stock (Low First)</option>
                      <option value="stock-high">Stock (High First)</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showLowStockOnly} 
                        onChange={(e) => setShowLowStockOnly(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-semibold text-gray-700">Low Stock Only</span>
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 flex items-end">
                    Total: <span className="text-blue-600 ml-2">{products.length} products</span>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {!showProductForm && (
              <div>
                {resetStatus?.isReset && (
                  <div className="bg-orange-100 border-l-4 border-orange-600 p-4 rounded-lg mb-6">
                    <p className="font-bold text-orange-900">Platform Reset Active</p>
                    <p className="text-sm text-orange-800 mt-1">All products are temporarily hidden. Restore your data to display them again.</p>
                  </div>
                )}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${products.length === 0 && resetStatus?.isReset ? 'opacity-50' : ''}`}>
                  {(() => {
                    let filtered = products
                  
                  // Apply search filter
                  if (productSearch) {
                    filtered = filtered.filter(p =>
                      (p.name?.toLowerCase().includes(productSearch.toLowerCase())) ||
                      (p.sku?.toLowerCase().includes(productSearch.toLowerCase())) ||
                      (p.description?.toLowerCase().includes(productSearch.toLowerCase()))
                    )
                  }

                  // Apply low stock filter
                  if (showLowStockOnly) {
                    filtered = filtered.filter(p => parseInt(p.stock) <= 10)
                  }

                  // Apply sorting
                  if (productSortBy === 'price-low') {
                    filtered.sort((a, b) => a.price - b.price)
                  } else if (productSortBy === 'price-high') {
                    filtered.sort((a, b) => b.price - a.price)
                  } else if (productSortBy === 'stock-low') {
                    filtered.sort((a, b) => parseInt(a.stock) - parseInt(b.stock))
                  } else if (productSortBy === 'stock-high') {
                    filtered.sort((a, b) => parseInt(b.stock) - parseInt(a.stock))
                  } else if (productSortBy === 'newest') {
                    filtered.sort((a, b) => (b.id > a.id ? 1 : -1))
                  } else {
                    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  }

                  return filtered.map(product => (
                    <div key={product.id} className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition ${parseInt(product.stock) <= 10 ? 'border-2 border-orange-300' : ''}`}>
                      <div className="relative">
                        <img src={getProductImage(product)} alt={product.name} className="w-full h-48 object-cover" />
                        <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 text-sm font-bold text-yellow-500">{product.rating || 4.5}</div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {product.mostOrdered && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">Popular</span>}
                          {product.isNew && <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">New</span>}
                          {parseInt(product.stock) <= 10 && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Low</span>}
                          {product.warranty && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{product.warranty}</span>}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                        {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                        {product.barcode && <p className="text-xs text-gray-500">{product.barcode}</p>}
                        <p className="text-xs text-gray-600 truncate">{product.description}</p>
                        <p className="text-lg font-bold text-blue-600 mt-2">XAF {(product.price || 0).toLocaleString()}</p>
                        
                        {/* Specs Preview */}
                        {product.specifications && product.specifications.length > 0 && (
                          <div className="text-xs text-gray-600 mt-2 py-2 border-t">
                            {product.specifications.slice(0, 2).map((spec, idx) => (
                              <div key={idx}>{spec.key}: <span className="font-semibold">{spec.value}</span></div>
                            ))}
                            {product.specifications.length > 2 && <div className="text-gray-500">+{product.specifications.length - 2} more specs</div>}
                          </div>
                        )}

                        {/* Store Availability */}
                        {product.storeAvailability && Object.keys(product.storeAvailability).length > 0 && (
                          <div className="text-xs text-gray-600 mt-2 py-2 border-t border-b">
Available at {Object.values(product.storeAvailability).filter(v => v > 0).length} location(s)
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2 py-2 border-b">
                          <div>Stock: <span className={parseInt(product.stock) <= 10 ? 'text-red-600 font-bold' : ''}>{product.stock}</span></div>
                          <div>{product.category}</div>
                          {product.weight && <div>{product.weight}</div>}
                          {product.dimensions && <div>{product.dimensions}</div>}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleEditProduct(product)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition">
Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">
Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                })()}
                {products.length === 0 && resetStatus?.isReset && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">

                    <p className="text-lg font-bold text-gray-600">All Products Temporarily Deleted</p>
                    <p className="text-sm text-gray-500 mt-2">Your products will reappear when you restore the platform data.</p>
                  </div>
                )}
                {products.length === 0 && !resetStatus?.isReset && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">

                    <p className="text-lg font-bold text-gray-600">No Products Yet</p>
                    <p className="text-sm text-gray-500 mt-2">Start by adding your first product to the catalog.</p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}


        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <OrderManagement 
            orders={orders}
            token={localStorage.getItem('adminToken')}
            resetStatus={resetStatus}
            onOrderUpdate={(orderId, updatedOrder, deleted) => {
              if (!orderId) {
                fetchOrders()
                return
              }
              if (deleted) {
                setOrders(current => current.filter(o => o.id !== orderId))
              } else {
                setOrders(current => current.map(o => o.id === orderId ? updatedOrder : o))
              }
            }}
            onViewReceipt={(order) => setReceiptOrder(order)}
          />
        )}

        {/* Receipt Modal */}
        {receiptOrder && (
          <Receipt 
            order={receiptOrder} 
            onClose={() => setReceiptOrder(null)}
          />
        )}


        {/* Order Detail Modal - DEPRECATED - Kept for compatibility */}
        {viewOrder && false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative">
              <button onClick={() => setViewOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Buyer</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> {viewOrder.buyer?.name}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {viewOrder.buyer?.email}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {viewOrder.buyer?.phone}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Address:</span> {viewOrder.buyer?.address}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Region:</span> {viewOrder.region}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Subtotal:</span> XAF {(viewOrder.totals?.subtotal || 0).toLocaleString()}</p>

                  <p className="text-sm text-gray-700"><span className="font-semibold">Shipping:</span> XAF {(viewOrder.shippingFee || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Total:</span> XAF {(viewOrder.totals?.total || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {viewOrder.status}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3">Items</h4>
                <div className="space-y-3">
                  {viewOrder.items?.map(it => (
                    <div key={`${it.id}-${it.selectedImageUrl}`} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                      <img src={getProductImage({ ...it, image: it.selectedImageUrl || it.image })} alt={it.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{it.name}</div>
                        <div className="text-sm text-gray-600">Variant: {it.selectedVariant || 'default'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{it.price.toLocaleString()} XAF × {it.quantity}</div>
                        <div className="font-bold text-gray-900">XAF {(it.price * it.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ADMINS TAB */}
        {activeTab === 'sub-admins' && (
          <SubAdminManagement token={token} />
        )}

        {/* LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Store Locations</h2>
              <button
                onClick={() => {
                  setShowLocationForm(true)
                  setEditingLocationId(null)
                  setLocationForm({ name: '', city: '', address: '', phone: '', email: '', lat: '', lng: '', hours: '', description: '', isMainStore: false })
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                + Add Location
              </button>
            </div>

            {showLocationForm && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{editingLocationId ? 'Edit Location' : 'Add New Location'}</h3>
                <form onSubmit={handleLocationSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Location Name *</label>
                    <input type="text" placeholder="e.g., Main Store - Douala" value={locationForm.name} onChange={(e) => setLocationForm({...locationForm, name: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">City *</label>
                    <input type="text" placeholder="e.g., Douala" value={locationForm.city} onChange={(e) => setLocationForm({...locationForm, city: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">Address *</label>
                    <input type="text" placeholder="Full address" value={locationForm.address} onChange={(e) => setLocationForm({...locationForm, address: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Phone</label>
                    <input type="tel" placeholder="+237 6 XX XXX XXX" value={locationForm.phone} onChange={(e) => setLocationForm({...locationForm, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" placeholder="store@email.com" value={locationForm.email} onChange={(e) => setLocationForm({...locationForm, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Hours</label>
                    <input type="text" placeholder="Mon-Sun: 8AM-8PM" value={locationForm.hours} onChange={(e) => setLocationForm({...locationForm, hours: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Latitude</label>
                    <input type="number" step="0.0001" placeholder="4.0511" value={locationForm.lat} onChange={(e) => setLocationForm({...locationForm, lat: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Longitude</label>
                    <input type="number" step="0.0001" placeholder="9.7679" value={locationForm.lng} onChange={(e) => setLocationForm({...locationForm, lng: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">Description</label>
                    <textarea placeholder="Brief description about this location" value={locationForm.description} onChange={(e) => setLocationForm({...locationForm, description: e.target.value})} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={locationForm.isMainStore} onChange={(e) => setLocationForm({...locationForm, isMainStore: e.target.checked})} className="w-5 h-5 rounded" />
                      <span className="font-semibold text-gray-700">Mark as Main Store</span>
                    </label>
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
                      {editingLocationId ? 'Update Location' : 'Add Location'}
                    </button>
                    <button type="button" onClick={() => {setShowLocationForm(false); setEditingLocationId(null)}} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-3 rounded-lg font-semibold transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Locations List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(location => (
                <div key={location.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{location.name}</h4>
                        <p className="text-blue-100 text-sm">{location.city}</p>
                      </div>
                      {location.isMainStore && <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">Main Store</span>}
                    </div>
                  </div>
                  <div className="p-4 space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold"></span> {location.address}</p>
                    {location.phone && <p><span className="font-semibold"></span> {location.phone}</p>}
                    {location.email && <p><span className="font-semibold"></span> {location.email}</p>}
                    {location.hours && <p><span className="font-semibold"></span> {location.hours}</p>}
                    {location.description && <p className="italic text-gray-600">{location.description}</p>}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 flex gap-2">
                    <button onClick={() => handleEditLocation(location)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteLocation(location.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {locations.length === 0 && !showLocationForm && (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500 text-lg mb-4">No locations added yet</p>
                <button onClick={() => setShowLocationForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Add First Location
                </button>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Payment Account Configuration</h2>
            <p className="text-gray-600 mb-8">Configure your payment receiving accounts for each payment method customers can use</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD PAYMENT CONFIG */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-3">Card Payment</h3>
                  <p className="text-blue-100 text-sm mt-2">Visa & Mastercard</p>
                </div>
                <div className="p-6">
                  {editingPaymentType === 'card' ? (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      savePaymentAccount('card', null, {
                        accountName: paymentAccounts.card.accountName,
                        accountNumber: document.getElementById('cardNumber').value,
                        bankName: document.getElementById('bankName').value,
                        accountHolder: document.getElementById('cardHolder').value,
                        isActive: document.getElementById('cardActive').checked
                      })
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                        <input type="text" id="cardHolder" placeholder="Business Name" defaultValue={paymentAccounts.card.accountHolder} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
                        <input type="text" id="cardNumber" placeholder="0123456789" defaultValue={paymentAccounts.card.accountNumber} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                        <input type="text" id="bankName" placeholder="e.g., SGBC, UBA" defaultValue={paymentAccounts.card.bankName} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="cardActive" defaultChecked={paymentAccounts.card.isActive} className="w-5 h-5 rounded" />
                        <label htmlFor="cardActive" className="text-sm font-semibold text-gray-700">Active (Customers can pay with card)</label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingPaymentType(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-lg font-semibold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Account Holder</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.card.accountHolder || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Account Number</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.card.accountNumber ? '••••' + paymentAccounts.card.accountNumber.slice(-4) : 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Bank Name</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.card.bankName || 'Not configured'}</p>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentAccounts.card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {paymentAccounts.card.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                      <button onClick={() => setEditingPaymentType('card')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition">Edit</button>
                    </div>
                  )}
                </div>
              </div>

              {/* MTN MOBILE MONEY CONFIG */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-yellow-300">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-3">MTN Mobile Money</h3>
                  <p className="text-yellow-100 text-sm mt-2">MTN Payment Account</p>
                </div>
                <div className="p-6">
                  {editingPaymentType === 'mtn' ? (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      savePaymentAccount('momo', 'mtn', {
                        accountName: paymentAccounts.momo.mtn.accountName,
                        phoneNumber: document.getElementById('mtnPhone').value,
                        accountHolder: document.getElementById('mtnHolder').value,
                        isActive: document.getElementById('mtnActive').checked
                      })
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                        <input type="text" id="mtnHolder" placeholder="Business Name" defaultValue={paymentAccounts.momo.mtn.accountHolder} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">MTN Phone Number (Cameroon)</label>
                        <input type="tel" id="mtnPhone" placeholder="697123456 or 670123456" defaultValue={paymentAccounts.momo.mtn.phoneNumber} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600" />
                        <p className="text-xs text-gray-500 mt-1">9-digit Cameroon MTN number (670-676, 680, 683-689)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="mtnActive" defaultChecked={paymentAccounts.momo.mtn.isActive} className="w-5 h-5 rounded" />
                        <label htmlFor="mtnActive" className="text-sm font-semibold text-gray-700">Active (Customers can pay with MTN)</label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingPaymentType(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-lg font-semibold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Account Holder</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.momo.mtn.accountHolder || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Phone Number</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.momo.mtn.phoneNumber || 'Not configured'}</p>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentAccounts.momo.mtn.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {paymentAccounts.momo.mtn.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                      <button onClick={() => setEditingPaymentType('mtn')} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold transition">Edit</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORANGE MONEY CONFIG */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-orange-300">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-3">Orange Money</h3>
                  <p className="text-orange-100 text-sm mt-2">Orange Payment Account</p>
                </div>
                <div className="p-6">
                  {editingPaymentType === 'orange' ? (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      savePaymentAccount('momo', 'orange', {
                        accountName: paymentAccounts.momo.orange.accountName,
                        phoneNumber: document.getElementById('orangePhone').value,
                        accountHolder: document.getElementById('orangeHolder').value,
                        isActive: document.getElementById('orangeActive').checked
                      })
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                        <input type="text" id="orangeHolder" placeholder="Business Name" defaultValue={paymentAccounts.momo.orange.accountHolder} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Orange Phone Number (Cameroon)</label>
                        <input type="tel" id="orangePhone" placeholder="699123456 or 690123456" defaultValue={paymentAccounts.momo.orange.phoneNumber} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600" />
                        <p className="text-xs text-gray-500 mt-1">9-digit Cameroon Orange number (690, 691, 696, 699)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="orangeActive" defaultChecked={paymentAccounts.momo.orange.isActive} className="w-5 h-5 rounded" />
                        <label htmlFor="orangeActive" className="text-sm font-semibold text-gray-700">Active (Customers can pay with Orange)</label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingPaymentType(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-lg font-semibold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Account Holder</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.momo.orange.accountHolder || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Phone Number</p>
                        <p className="font-bold text-gray-900">{paymentAccounts.momo.orange.phoneNumber || 'Not configured'}</p>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentAccounts.momo.orange.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {paymentAccounts.momo.orange.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                      <button onClick={() => setEditingPaymentType('orange')} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition">Edit</button>
                    </div>
                  )}
                </div>
              </div>

              {/* CASH PAYMENT CONFIG */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-green-300">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-3">Cash at Pickup</h3>
                  <p className="text-green-100 text-sm mt-2">Collect cash when customer picks up order</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Cash payments are automatically handled during pickup. No additional configuration needed.</p>
                    <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                      <p className="text-sm text-green-900">✓ This payment method is always active and ready for use</p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">✓ Always Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Account Instructions */}
            <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">How Payment Accounts Work</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Configure your payment receiving accounts for each payment method</li>
                <li>✓ Only active payment methods will be available to customers during checkout</li>
                <li>✓ All customer payments will be directed to these accounts</li>
                <li>✓ Ensure account details are correct to avoid payment issues</li>
                <li>✓ Cash payments are handled directly at the pickup location</li>
              </ul>
            </div>
          </div>
        )}

        {/* STATISTICS TAB */}

        {activeTab === 'statistics' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Real-Time Analytics Dashboard</h2>
            
            {/* Statistics Sub-tabs */}
            <div className="mb-6 border-b border-gray-300">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatisticsTab('platform')}
                  className={`px-4 py-2 font-bold transition ${
                    statisticsTab === 'platform'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
Platform Analytics
                </button>
                <button
                  onClick={() => setStatisticsTab('pos')}
                  className={`px-4 py-2 font-bold transition ${
                    statisticsTab === 'pos'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
POS Sales Analytics
                </button>
              </div>
            </div>

            {statisticsTab === 'platform' && <RealTimeStatistics token={token} />}
            {statisticsTab === 'pos' && <POSStatistics token={token} />}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Customer Messages</h2>
            <AdminMessaging token={token} />
          </div>
        )}

        {/* WEBSITE TEXT TAB */}
        {activeTab === 'content' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Website Text</h2>
                <p className="text-sm text-gray-600 mt-1">Edit every heading, label and paragraph shown on the public website. Leave a field blank to use the built-in default.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select value={contentLang} onChange={(e) => setContentLang(e.target.value)} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
                <button onClick={handleSaveSiteContent} disabled={contentSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 shadow-sm">
                  {contentSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-900">
              Tip: placeholders like <span className="font-mono">{'{count}'}</span> or <span className="font-mono">{'{phone}'}</span> are filled in automatically — keep them in your text.
            </div>

            <input
              type="search"
              value={contentSearch}
              onChange={(e) => setContentSearch(e.target.value)}
              placeholder="Search the text you want to edit…"
              className="w-full mb-6 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {(() => {
              const dict = dictionaries[contentLang] || dictionaries.en
              const grouped = new Set()
              CONTENT_GROUPS.forEach((g) => g.keys.forEach((k) => grouped.add(k)))
              const otherKeys = Object.keys(dict).filter((k) => !grouped.has(k))
              const groups = otherKeys.length ? [...CONTENT_GROUPS, { title: 'Other text', keys: otherKeys }] : CONTENT_GROUPS
              const q = contentSearch.trim().toLowerCase()
              const matches = (key) => {
                if (!q) return true
                const def = String(dict[key] || '')
                const val = String(contentOverrides[contentLang]?.[key] || '')
                return key.toLowerCase().includes(q) || def.toLowerCase().includes(q) || val.toLowerCase().includes(q)
              }
              let visible = 0
              const rendered = groups.map((group) => {
                const keys = group.keys.filter((k) => dict[k] !== undefined && matches(k))
                if (!keys.length) return null
                visible += keys.length
                return (
                  <div key={group.title} className="mb-6 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">{group.title}
                      <span className="text-xs font-semibold text-gray-400">({keys.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {keys.map((key) => {
                        const def = String(dict[key] || '')
                        const val = contentOverrides[contentLang]?.[key] ?? ''
                        const long = def.length > 60
                        return (
                          <div key={key} className="grid gap-1">
                            <label className="text-sm font-semibold text-gray-800">{def || key}</label>
                            {long ? (
                              <textarea value={val} placeholder={def} onChange={(e) => handleContentChange(contentLang, key, e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                            ) : (
                              <input value={val} placeholder={def} onChange={(e) => handleContentChange(contentLang, key, e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
              return (
                <>
                  {rendered}
                  {visible === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">No text matches “{contentSearch}”.</div>
                  )}
                </>
              )
            })()}

            <div className="flex justify-end sticky bottom-4">
              <button onClick={handleSaveSiteContent} disabled={contentSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50 shadow-lg">
                {contentSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Settings & Configuration</h2>
            
            <div className="space-y-8">
              {/* SECTION 1: Account Credentials */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">Account Credentials</h3>
                <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Email</label>
                    <input type="email" value={adminEmail} disabled className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Your current login email</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Email (Optional)</label>
                    <input type="email" placeholder="Leave empty to keep current email" value={settingsForm.email} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Enter to change your login email</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (Optional)</label>
                    <input type="password" placeholder="Leave empty to keep current password" value={settingsForm.newPassword} onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Must be at least 6 characters long</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                    <input type="text" placeholder="e.g., MyShop, TechStore, etc." value={settingsForm.platformName} onChange={(e) => setSettingsForm({...settingsForm, platformName: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Change your store's name (appears in header, receipts, and emails)</p>
                  </div>

                  {/* Footer Contact Information — shown in the website footer */}
                  <div className="md:col-span-2 mt-2 pt-5 border-t-2 border-blue-100">
                    <h4 className="text-base font-bold text-blue-900 flex items-center gap-2 mb-1">Contact Information</h4>
                    <p className="text-xs text-gray-600 mb-4">These details appear in the website footer for all visitors.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea rows="2" placeholder="e.g., Cameroon (Nationwide)&#10;Regional representatives across all regions" value={settingsForm.contactAddress} onChange={(e) => setSettingsForm({...settingsForm, contactAddress: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Each new line shows as a separate line in the footer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input type="text" placeholder="e.g., +237 6 52 882 753" value={settingsForm.shopPhone} onChange={(e) => setSettingsForm({...settingsForm, shopPhone: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" placeholder="e.g., info@yourshop.com" value={settingsForm.shopEmail} onChange={(e) => setSettingsForm({...settingsForm, shopEmail: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website Link Text</label>
                    <input type="text" placeholder="e.g., smartcentrecameroon.com" value={settingsForm.contactWebsiteLabel} onChange={(e) => setSettingsForm({...settingsForm, contactWebsiteLabel: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Leave empty to hide the website line</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                    <input type="url" placeholder="e.g., https://www.smartcentrecameroon.com" value={settingsForm.contactWebsiteUrl} onChange={(e) => setSettingsForm({...settingsForm, contactWebsiteUrl: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Where the website link points to</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Highlight Title</label>
                    <input type="text" placeholder="e.g., Serving NGOs, Government" value={settingsForm.contactNoteTitle} onChange={(e) => setSettingsForm({...settingsForm, contactNoteTitle: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Green highlight box in the footer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Highlight Subtitle</label>
                    <input type="text" placeholder="e.g., Contractors & Individuals worldwide" value={settingsForm.contactNoteSubtitle} onChange={(e) => setSettingsForm({...settingsForm, contactNoteSubtitle: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Leave both empty to hide the box</p>
                  </div>

                  <button type="submit" disabled={loading} className="md:col-span-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 shadow-md">
                    ✓ Save Settings & Contact Info
                  </button>
                </form>
              </div>

              {/* SECTION 1.5: Hero Section Editor */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-amber-200">
                <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">Hero Section Content</h3>
                <form onSubmit={handleHeroSectionUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Badge Text</label>
                    <input type="text" placeholder="e.g., Special Offers This Season" value={heroForm.badge} onChange={(e) => setHeroForm({...heroForm, badge: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Small badge/tagline above the main title</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Main Title</label>
                    <input type="text" placeholder="e.g., Shop the Best Products Online" value={heroForm.title} onChange={(e) => setHeroForm({...heroForm, title: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Main headline of your hero section</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea placeholder="Describe your offer, e.g., Discover thousands of quality products..." value={heroForm.description} onChange={(e) => setHeroForm({...heroForm, description: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" rows="3" />
                    <p className="text-xs text-gray-600 mt-1">Detailed description text</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Button Text</label>
                      <input type="text" placeholder="e.g., Shop Now →" value={heroForm.primaryButtonText} onChange={(e) => setHeroForm({...heroForm, primaryButtonText: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Button Text</label>
                      <input type="text" placeholder="e.g., Learn More" value={heroForm.secondaryButtonText} onChange={(e) => setHeroForm({...heroForm, secondaryButtonText: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Background Image URL</label>
                    <input type="url" placeholder="https://images.unsplash.com/..." value={heroForm.backgroundImage} onChange={(e) => setHeroForm({...heroForm, backgroundImage: e.target.value})} className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Background image for hero section</p>
                    {heroForm.backgroundImage && (
                      <div className="mt-3 rounded-lg overflow-hidden border-2 border-amber-300">
                        <img src={resolveAssetUrl(heroForm.backgroundImage)} alt="Preview" className="w-full h-24 object-cover" onError={() => {}} />
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 shadow-md">
                    ✓ Save Hero Section Changes
                  </button>
                </form>
              </div>

              {/* SECTION 2: Security & Access Control */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">Security & Access Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                    <p className="text-sm font-bold text-gray-800 mb-3">Your Account Status</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">

                        <span className="text-gray-700"><span className="font-semibold">Email:</span> {adminEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">

                        <span className="text-gray-700"><span className="font-semibold">Role:</span> Super Admin</span>
                      </div>
                      <div className="flex items-center gap-2">

                        <span className="text-gray-700"><span className="font-semibold">Access Level:</span> Full</span>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                        <p className="text-xs font-semibold text-blue-900">As Super Admin, you have unrestricted access to all platform features including financial data, settings, and team management.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-yellow-200">
                    <p className="text-sm font-bold text-gray-800 mb-3">Sub-Admin Restrictions</p>
                    <div className="space-y-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Cannot access financial data or revenue reports</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Cannot modify admin settings or passwords</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Cannot create or manage other sub-admins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Cannot access system logs or backups</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Can manage products and inventory</span>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-600">
                        <p className="text-xs font-semibold text-yellow-900">Sub-admins have limited access for operational management only.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Store Configuration */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">Store Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 text-center">
                    <p className="text-3xl mb-2"></p>
                    <p className="text-sm font-bold text-gray-800">Total Products</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalProducts}</p>
                    <p className="text-xs text-gray-600 mt-1">Active items in catalog</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 text-center">
                    <p className="text-3xl mb-2"></p>
                    <p className="text-sm font-bold text-gray-800">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-green-600">XAF {(stats.totalValue).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-1">Stock × Price total</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 text-center">
                    <p className="text-3xl mb-2"></p>
                    <p className="text-sm font-bold text-gray-800">Sub-Admins</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalSubAdmins}</p>
                    <p className="text-xs text-gray-600 mt-1">Team members</p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Platform Features Status */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-orange-200">
                <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">Active Platform Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Real-Time Analytics</p>
                      <p className="text-xs text-gray-600">Live dashboard with period-based statistics</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Chat Management</p>
                      <p className="text-xs text-gray-600">Manage customer conversations & support</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Order Management</p>
                      <p className="text-xs text-gray-600">Track orders, manage shipments</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Shipping Management</p>
                      <p className="text-xs text-gray-600">Regional rates & free shipping thresholds</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Multi-Location Support</p>
                      <p className="text-xs text-gray-600">Manage multiple store locations</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-start gap-3">

                    <div>
                      <p className="font-bold text-gray-800">Team Management</p>
                      <p className="text-xs text-gray-600">Create and manage sub-admin accounts</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: System Information */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Platform Name</p>
                    <p className="text-lg font-bold text-gray-900">{platformName}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Admin Dashboard Version</p>
                    <p className="text-lg font-bold text-gray-900">2.0.0</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Database Type</p>
                    <p className="text-lg font-bold text-gray-900">JSON</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2">Last Updated</p>
                    <p className="text-lg font-bold text-gray-900">Today</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                  <p className="text-sm font-semibold text-blue-900">Need Help?</p>
                  <p className="text-xs text-blue-800 mt-2">For technical support or to report issues, contact the development team. All platform features are designed for optimal performance and security.</p>
                </div>
              </div>

              {/* SECTION 5.5: Platform Reset & Recovery */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-red-200">
                <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">Reset Platform & Data Recovery</h3>
                
                {!resetStatus?.isReset ? (
                  <div>
                    <p className="text-gray-700 mb-4">Reset your entire platform to start fresh. Perfect when changing business direction or reselling the platform.</p>
                    <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded mb-4">
                      <p className="text-sm font-bold text-red-900">IMPORTANT NOTICE:</p>
                      <ul className="text-xs text-red-800 mt-2 space-y-1">
                        <li>✓ All products, orders, chat messages, and history will be cleared</li>
                        <li>✓ Data will be recoverable for 48 hours after reset</li>
                        <li>✓ After 48 hours, data is permanently deleted and cannot be recovered</li>
                        <li>✓ Your account credentials remain unchanged</li>
                        <li>✓ All activity is logged for security</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      disabled={resetLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                    >
Reset Platform Now
                    </button>

                    {showResetConfirm && (
                      <div className="mt-4 p-4 bg-white border-2 border-red-400 rounded-lg">
                        <p className="font-bold text-red-900 mb-3">Final Confirmation Required</p>
                        <p className="text-sm text-gray-700 mb-4">This action will delete all platform data. You have 48 hours to restore it using the backup.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePlatformReset}
                            disabled={resetLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold transition disabled:opacity-50"
                          >
                            {resetLoading ? 'Resetting...' : '✓ Yes, Reset Platform'}
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded font-bold transition"
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="bg-orange-100 border-l-4 border-orange-600 p-4 rounded mb-4">
                      <p className="font-bold text-orange-900">Platform Reset Active - Recovery Window Open</p>
                      <p className="text-sm text-orange-800 mt-2">Your data is backed up and can be restored within the recovery window below.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded border-2 border-orange-300">
                        <p className="text-xs text-gray-600 font-bold mb-1">Reset Time</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(resetStatus.resetTime).toLocaleString()}
                        </p>
                      </div>
                      <div className={`bg-white p-4 rounded border-2 ${resetStatus.isExpired ? 'border-red-300' : 'border-green-300'}`}>
                        <p className="text-xs text-gray-600 font-bold mb-1">Recovery Time Remaining</p>
                        <p className={`text-lg font-bold ${resetStatus.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                          {resetStatus.isExpired ? 'EXPIRED' : `${resetStatus.hoursRemaining}h remaining`}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded border-2 border-orange-300 mb-4">
                      <p className="text-sm font-bold text-gray-800 mb-3">Data Available in Backup:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{resetStatus.itemsInBackup.products}</p>
                          <p className="text-xs text-gray-600">Products</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{resetStatus.itemsInBackup.orders}</p>
                          <p className="text-xs text-gray-600">Orders</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{resetStatus.itemsInBackup.users}</p>
                          <p className="text-xs text-gray-600">Users</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{resetStatus.itemsInBackup.receipts}</p>
                          <p className="text-xs text-gray-600">Receipts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{resetStatus.itemsInBackup.chatMessages}</p>
                          <p className="text-xs text-gray-600">Messages</p>
                        </div>
                      </div>
                    </div>

                    {!resetStatus.isExpired && (
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={handleRestorePlatform}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition"
                        >
                          ✓ Restore All Data Now
                        </button>
                        <button
                          onClick={handleExtendRecoveryWindow}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
                        >
Extend 48 Hours
                        </button>
                      </div>
                    )}

                    {resetStatus.isExpired && (
                      <div>
                        <div className="p-4 bg-red-100 border-2 border-red-400 rounded mb-2">
                          <p className="text-sm font-bold text-red-900">Recovery Window Expired</p>
                          <p className="text-xs text-red-800 mt-1">Your data backup has expired. However, you can extend the recovery window below to restore your data.</p>
                        </div>
                        <button
                          onClick={handleExtendRecoveryWindow}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition mb-2"
                        >
Extend Recovery Window (+48 Hours)
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handlePermanentlyDeleteData}
                      disabled={!resetStatus.isExpired}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold transition disabled:opacity-50"
                    >
Permanently Delete Data
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 6: Quick Actions */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 lg:p-8 border-2 border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('products')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
Manage Products
                  </button>
                  <button onClick={() => setActiveTab('orders')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
View Orders
                  </button>
                  <button onClick={() => setActiveTab('chat')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
Customer Messages
                  </button>
                  <button onClick={() => setActiveTab('statistics')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
Analytics Dashboard
                  </button>
                  <button onClick={() => setActiveTab('shipping')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
Shipping Settings
                  </button>
                  <button onClick={() => setActiveTab('locations')} className="bg-white hover:bg-blue-50 border-2 border-indigo-300 rounded-lg p-4 text-left transition font-semibold text-gray-900">
Store Locations
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  }
  return (
    <div className={`border-2 ${colors[color]} rounded-xl p-4 sm:p-6`}>
      <p className="text-2xl sm:text-3xl mb-2">{icon}</p>
      <p className="text-gray-700 text-xs sm:text-sm font-semibold">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}
