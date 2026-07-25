const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { pool } = require('./db');
const migrate = require('./migrate');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ndimihboclair4@gmail.com';
// CORS_ORIGIN may hold several comma-separated origins (e.g. apex + www);
// cors() must receive them as an array so it echoes back only the matching one.
const CLIENT_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const REAL_SHIPPING_FEES = {
  Bamenda: 0,
  Douala: 1016,
  'Yaoundé': 3000,
  Bafoussam: 5000,
  Garoua: 8000,
  Maroua: 9000,
  'Ngaoundéré': 7000,
  Bertoua: 6500,
  Buea: 2000,
  Limbe: 2500,
  Bafang: 2001,
  Nkong: 2000
};

const INITIAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920';

const DEFAULT_HERO_SECTION = {
  badge: 'Special Offers This Season',
  title: 'MyShop',
  description: 'Shop premium electronics and accessories with delivery across Cameroon.',
  primaryButtonText: 'Shop Now',
  secondaryButtonText: 'Browse Products',
  backgroundImage: INITIAL_HERO_IMAGE
};

const DEFAULT_PAYMENT_ACCOUNTS = {
  cash: {
    accountName: 'Pay after confirmation',
    notes: 'Your order is received first. The shop will contact you shortly to confirm payment and delivery.',
    isActive: true
  },
  card: { accountName: '', accountNumber: '', bankName: '', accountHolder: '', isActive: false },
  momo: {
    mtn: { accountName: '', phoneNumber: '', accountHolder: '', isActive: false },
    orange: { accountName: '', phoneNumber: '', accountHolder: '', isActive: false }
  }
};

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      'connect-src': ["'self'", 'https:', 'http:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      'media-src': ["'self'", 'data:', 'blob:', 'https:', 'http:']
    }
  }
}));
// Gzip compression for all responses (huge win on slow networks)
app.use(compression({ level: 6, threshold: 1024 }));

app.use(cors({ origin: CLIENT_ORIGINS }));
app.use(express.json({ limit: '2mb' }));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts' });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Uploads are served from both /uploads and /api/uploads, mounted before the
// rate limiter so loading images never consumes a request allowance. The /api
// prefix is what makes uploads work in production: a reverse proxy routes /api
// to this server, while a bare /uploads request can be answered by the static
// site and return index.html instead of the image.
const serveUploadedFiles = express.static(uploadDir, {
  maxAge: '7d',
  etag: true,
  lastModified: true
});
app.use('/uploads', serveUploadedFiles);
app.use('/api/uploads', serveUploadedFiles);
// A missing upload must fail loudly rather than fall through to the SPA
// catch-all, which would answer an <img> request with HTML.
const uploadNotFound = (req, res) => res.status(404).json({ error: 'File not found' });
app.use('/uploads', uploadNotFound);
app.use('/api/uploads', uploadNotFound);

app.use('/api/', generalLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/sub-admin/login', authLimiter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Unsupported file type'), allowed.includes(file.mimetype));
  }
});

const adminProductUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

function getUploadedFile(req) {
  return req.file || req.files?.image?.[0] || req.files?.file?.[0] || null;
}

function sendUploadResponse(req, res) {
  const file = getUploadedFile(req);
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/api/uploads/${file.filename}`;
  return res.json({ imageUrl, url: imageUrl });
}

function requireJwtSecret() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    const err = new Error('JWT_SECRET must be configured in the server environment before admin login can issue secure tokens.');
    err.status = 503;
    err.expose = true;
    throw err;
  }
}

function isBcryptHash(value = '') {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function verifyStoredPassword(password, admin) {
  const stored = admin.password_hash || '';
  if (isBcryptHash(stored)) return bcrypt.compare(password, stored);
  if (stored && password === stored) {
    const upgradedHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2', [upgradedHash, admin.id]);
    return true;
  }
  return false;
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({
          errors: result.array().map((error) => ({
            field: error.path || error.param,
            message: error.msg
          }))
        });
      }
      next();
    }
  ];
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeArray(value, fallback = []) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return fallback;
}

function setPublicCache(res, seconds = 60) {
  res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
}

function productFromRow(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images : [];
  const image = row.image_url || images[0]?.url || '';
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    category: row.category || '',
    isNew: Boolean(row.is_new),
    mostOrdered: Boolean(row.most_ordered),
    availableRegions: row.available_regions || ['ALL'],
    image,
    imageUrl: image,
    image_url: image,
    images,
    storeAvailability: row.store_availability && typeof row.store_availability === 'object' ? row.store_availability : {},
    store_availability: row.store_availability && typeof row.store_availability === 'object' ? row.store_availability : {},
    translations: row.translations && typeof row.translations === 'object' ? row.translations : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function productReviewFromRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    customerName: row.customer_name || 'Customer',
    rating: Number(row.rating || 0),
    comment: row.comment || '',
    createdAt: row.created_at
  };
}

function orderFromRow(row) {
  if (!row) return null;
  const items = Array.isArray(row.items) ? row.items : [];
  const paidAmount = Number(row.paid_amount || 0);
  const total = Number(row.total || 0);
  return {
    id: row.id,
    orderNumber: row.id,
    buyer: {
      name: row.buyer_name,
      email: row.buyer_email,
      phone: row.buyer_phone,
      address: row.buyer_address,
      agencies: row.buyer_agencies || [],
      pickupLocation: row.pickup_location || '',
      pickupTime: row.pickup_time || ''
    },
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    region: row.region,
    shippingFee: Number(row.shipping_fee || 0),
    subtotal: Number(row.subtotal || 0),
    total,
    totals: {
      subtotal: Number(row.subtotal || 0),
      shipping: Number(row.shipping_fee || 0),
      shippingFee: Number(row.shipping_fee || 0),
      total
    },
    items,
    status: row.status,
    deliveryAgency: row.delivery_agency || '',
    notes: row.notes || '',
    paymentMethod: row.payment_method || '',
    deliveryOption: row.delivery_option || 'delivery',
    pickupLocation: row.pickup_location || '',
    pickupTime: row.pickup_time || '',
    isPaid: paidAmount >= total && total > 0,
    isInStoreSale: Boolean(row.is_in_store_sale),
    discountPercent: Number(row.discount_percent || 0),
    paidAmount,
    changeAmount: Number(row.change_amount || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: [
      { status: 'pending', timestamp: row.created_at, note: 'Order received' },
      ...(row.status !== 'pending'
        ? [{ status: row.status, timestamp: row.updated_at, note: `Order marked as ${row.status}` }]
        : [])
    ]
  };
}

function locationFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    phone: row.phone,
    email: row.email,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    isMainStore: Boolean(row.is_main_store),
    hours: row.hours,
    description: row.description,
    createdAt: row.created_at
  };
}

function adminFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    permissions: row.permissions || {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function activityFromRow(row) {
  return {
    id: row.id,
    subAdminId: row.admin_id,
    subAdminName: row.admin_name,
    subAdminEmail: row.admin_email,
    action: row.action,
    details: typeof row.details === 'string' ? row.details : JSON.stringify(row.details || {}),
    timestamp: row.created_at,
    ipAddress: row.details?.ipAddress || ''
  };
}

async function getSettings() {
  const result = await pool.query('SELECT key, value FROM settings');
  const settings = {
    shop_name: 'MyShop',
    main_shop_town: 'Bamenda',
    free_shipping_threshold: '100000',
    shop_phone: '+237 6 52 882 753',
    shop_email: 'ndimihboclair4@gmail.com'
  };
  for (const row of result.rows) settings[row.key] = row.value;
  return settings;
}

async function getShippingFees() {
  const result = await pool.query('SELECT city, fee FROM shipping_fees ORDER BY city ASC');
  return Object.fromEntries(result.rows.map((row) => [row.city, Number(row.fee)]));
}

async function logActivity(req, action, details = {}) {
  if (!req.admin) return;
  try {
    await pool.query(
      `INSERT INTO admin_activities (admin_id, admin_name, admin_email, action, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        req.admin.id,
        req.admin.name,
        req.admin.email,
        action,
        JSON.stringify({ ...details, ipAddress: req.ip })
      ]
    );
  } catch (err) {
    console.error('Failed to log admin activity:', err.message);
  }
}

async function authenticate(req, res, next) {
  try {
    requireJwtSecret();
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const adminResult = await pool.query(
      `SELECT id, name, email, role, permissions, is_active
       FROM admins
       WHERE id = $1 AND is_active = true`,
      [decoded.id]
    );
    if (adminResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid or inactive admin token' });
    }

    req.admin = adminFromRow(adminResult.rows[0]);
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
}

function authenticateCustomer(req, res, next) {
  try {
    requireJwtSecret();
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required' });
    req.customer = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function checkPermission(permissionKey) {
  return (req, res, next) => {
    if (req.admin?.role === 'super_admin') return next();
    if (req.admin?.permissions?.[permissionKey]) return next();
    return res.status(403).json({ error: 'Permission denied' });
  };
}

function requireSuperAdmin(req, res, next) {
  if (req.admin?.role === 'super_admin') return next();
  return res.status(403).json({ error: 'Only the super admin can perform this action' });
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function sendMailSafe(message) {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail(message);
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
}

function orderEmailText(order) {
  const itemLines = (order.items || [])
    .map((item) => `- ${item.name} x ${item.quantity}: ${Number(item.price || 0).toLocaleString()} XAF`)
    .join('\n');
  return [
    `Order ID: ${order.id}`,
    `Customer: ${order.buyer.name}`,
    `Phone: ${order.buyer.phone}`,
    `Email: ${order.buyer.email}`,
    `Region: ${order.region}`,
    '',
    'Items:',
    itemLines,
    '',
    `Subtotal: ${order.totals.subtotal.toLocaleString()} XAF`,
    `Shipping: ${order.totals.shipping.toLocaleString()} XAF`,
    `Total: ${order.totals.total.toLocaleString()} XAF`,
    '',
    'Your order has been received. We will contact you shortly to confirm payment and delivery.'
  ].join('\n');
}

function queueOrderEmails(order) {
  setImmediate(() => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || ADMIN_EMAIL;
    sendMailSafe({
      from,
      to: order.buyer.email,
      subject: `Order received - ${order.id}`,
      text: orderEmailText(order)
    });
    sendMailSafe({
      from,
      to: ADMIN_EMAIL,
      subject: `New order received - ${order.id}`,
      text: orderEmailText(order)
    });
  });
}

function queueStatusEmail(order, oldStatus) {
  if (!order.buyer?.email || oldStatus === order.status) return;
  setImmediate(() => {
    sendMailSafe({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || ADMIN_EMAIL,
      to: order.buyer.email,
      subject: `Order status updated - ${order.id}`,
      text: [
        `Hello ${order.buyer.name},`,
        '',
        `Your order ${order.id} status is now: ${order.status}.`,
        '',
        'Thank you for shopping with us.'
      ].join('\n')
    });
  });
}

const loginValidation = validate([
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
]);

const productValidation = validate([
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isInt({ min: 1 }).withMessage('Price must be a positive integer'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('translations').optional().isObject().withMessage('Translations must be an object')
]);

const orderValidation = validate([
  body('buyer.name').trim().notEmpty().withMessage('Buyer name is required'),
  body('buyer.phone').trim().notEmpty().withMessage('Buyer phone is required'),
  body('buyer.email').custom((value, { req }) => {
    if (req.body.isInStoreSale) return true;
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Enter a valid email address');
    return true;
  }),
  body('buyer.address').custom((value, { req }) => {
    if (req.body.isInStoreSale || req.body.deliveryOption === 'pickup' || req.body.delivery_option === 'pickup') return true;
    if (!value || !String(value).trim()) throw new Error('Buyer address is required');
    return true;
  }),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.id').notEmpty().withMessage('Each item must include an id'),
  body('items.*.name').notEmpty().withMessage('Each item must include a name'),
  body('items.*.price').isInt({ min: 1 }).withMessage('Each item price must be a positive integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1')
]);

const chatValidation = validate([
  body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
]);

const productReviewValidation = validate([
  body('customerName').optional().trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 3, max: 1000 }).withMessage('Comment must be between 3 and 1000 characters')
]);

app.get('/api/health', (req, res) => res.json({ ok: true, database: 'postgresql' }));

app.get('/api/settings', asyncHandler(async (req, res) => {
  setPublicCache(res, 120);
  const settings = await getSettings();
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({
    shopName: settings.shop_name,
    mainShopTown: settings.main_shop_town,
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    shopPhone: settings.shop_phone,
    shopEmail: settings.shop_email
  });
}));

app.get('/api/platform-name', asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({ platformName: settings.shop_name || 'MyShop' });
}));

app.get('/api/hero-section', asyncHandler(async (req, res) => {
  setPublicCache(res, 120);
  const settings = await getSettings();
  const result = await pool.query("SELECT value FROM settings WHERE key = 'hero_section'");
  const hero = { ...DEFAULT_HERO_SECTION, ...(result.rowCount ? JSON.parse(result.rows[0].value) : {}) };
  if (!hero.backgroundImage) hero.backgroundImage = INITIAL_HERO_IMAGE;
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({ ...hero, title: hero.title === 'MyShop' ? settings.shop_name : hero.title });
}));

app.get('/api/stats', asyncHandler(async (req, res) => {
  setPublicCache(res, 60);
  const productStats = await pool.query(`
    SELECT COUNT(*)::int AS total_products, COALESCE(SUM(stock), 0)::int AS total_in_stock
    FROM products
  `);
  const orderStats = await pool.query(`
    SELECT COUNT(*)::int AS total_orders,
           COALESCE(SUM(total), 0)::int AS total_revenue,
           COALESCE(SUM((
             SELECT SUM((item->>'quantity')::int)
             FROM jsonb_array_elements(items) AS item
           )), 0)::int AS total_items_sold
    FROM orders
    WHERE status IN ('processing', 'shipped', 'delivered', 'completed')
  `);

  res.json({
    totalProducts: productStats.rows[0].total_products,
    totalInStock: productStats.rows[0].total_in_stock,
    totalOrders: orderStats.rows[0].total_orders,
    totalRevenue: orderStats.rows[0].total_revenue,
    totalItemsSold: orderStats.rows[0].total_items_sold,
    deliveryTime: 'We will contact you shortly'
  });
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  setPublicCache(res, 60);
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(result.rows.map(productFromRow));
}));

app.get('/api/categories', asyncHandler(async (req, res) => {
  setPublicCache(res, 300);
  const result = await pool.query(`
    SELECT DISTINCT category AS name
    FROM products
    WHERE category IS NOT NULL AND BTRIM(category) <> ''
    ORDER BY category ASC
  `);
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json(result.rows.map((row) => row.name));
}));

app.get('/api/products/:id/reviews', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM product_reviews
     WHERE product_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.params.id]
  );
  const reviews = result.rows.map(productReviewFromRow);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  res.json({
    reviews,
    reviewCount: reviews.length,
    averageRating: Number(averageRating.toFixed(1))
  });
}));

app.post('/api/products/:id/reviews', productReviewValidation, asyncHandler(async (req, res) => {
  const product = await pool.query('SELECT id FROM products WHERE id = $1', [req.params.id]);
  if (product.rowCount === 0) return res.status(404).json({ error: 'Product not found' });

  const result = await pool.query(
    `INSERT INTO product_reviews (product_id, customer_name, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      req.params.id,
      String(req.body.customerName || '').trim() || 'Customer',
      Number(req.body.rating),
      String(req.body.comment || '').trim()
    ]
  );
  res.status(201).json(productReviewFromRow(result.rows[0]));
}));

app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(productFromRow(result.rows[0]));
}));

app.post('/api/orders', orderLimiter, orderValidation, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const settings = await getSettings();
    const buyer = req.body.buyer || {};
    const isInStoreSale = Boolean(req.body.isInStoreSale || req.body.is_in_store_sale);
    const deliveryOption = req.body.deliveryOption || req.body.delivery_option || 'delivery';
    const isPickup = deliveryOption === 'pickup';
    const pickupLocation = buyer.pickupLocation || req.body.pickupLocation || req.body.pickup_location || '';
    const pickupTime = buyer.pickupTime || req.body.pickupTime || req.body.pickup_time || '';
    const region = req.body.region || req.body.country || buyer.country || settings.main_shop_town || 'N/A';
    const items = req.body.items || [];
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      const update = await client.query(
        `UPDATE products
         SET stock = stock - $1, updated_at = NOW()
         WHERE id = $2 AND stock >= $1
         RETURNING id, name, price, image_url, images, stock`,
        [quantity, item.id]
      );

      if (update.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for: ${item.name}` });
      }

      const product = update.rows[0];
      const price = Number(product.price);
      subtotal += price * quantity;
      orderItems.push({
        id: product.id,
        name: product.name,
        price,
        quantity,
        selectedVariant: item.selectedVariant || item.selected_variant || '',
        selectedImageUrl: item.selectedImageUrl || item.selected_image_url || product.image_url || '',
        image: item.image || product.image_url || ''
      });
    }

    // Shipping regions were removed — delivery is arranged with the customer after the order.
    const shippingFee = 0;
    const discountPercent = Math.max(0, Number(req.body.discountPercent || req.body.discount_percent || 0));
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const total = Math.max(0, subtotal - discountAmount + shippingFee);
    const status = isInStoreSale ? (req.body.status || 'completed') : 'pending';
    const email = buyer.email || (isInStoreSale ? 'pos-sale@local.invalid' : '');
    const address = isPickup
      ? (buyer.address || pickupLocation || 'Customer pickup')
      : (buyer.address || (isInStoreSale ? 'In-store sale' : ''));
    const notes = [
      buyer.specialInstructions || req.body.notes || '',
      isPickup && pickupTime ? `Pickup time: ${pickupTime}` : ''
    ].filter(Boolean).join('\n');

    const inserted = await client.query(
      `INSERT INTO orders (
        buyer_name, buyer_email, buyer_phone, buyer_address, buyer_agencies,
        region, shipping_fee, subtotal, total, items, status, delivery_agency,
        notes, payment_method, delivery_option, pickup_location, pickup_time,
        is_in_store_sale, discount_percent, paid_amount, change_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        buyer.name,
        email,
        buyer.phone,
        address,
        normalizeArray(buyer.agencies),
        region,
        shippingFee,
        subtotal,
        total,
        JSON.stringify(orderItems),
        status,
        req.body.deliveryAgency || req.body.delivery_agency || '',
        notes,
        req.body.paymentMethod || req.body.payment_method || '',
        deliveryOption,
        pickupLocation,
        pickupTime,
        isInStoreSale,
        discountPercent,
        normalizeNumber(req.body.paidAmount || req.body.paid_amount, 0),
        normalizeNumber(req.body.changeAmount || req.body.change_amount, 0)
      ]
    );

    await client.query('COMMIT');
    const order = orderFromRow(inserted.rows[0]);
    if (!isInStoreSale) queueOrderEmails(order);
    res.status(201).json({
      ...order,
      message: 'Your order has been received. We will contact you shortly to confirm payment and delivery.'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

app.get('/api/orders/search', asyncHandler(async (req, res) => {
  const orderId = (req.query.orderId || req.query.id || '').trim();
  const email = (req.query.email || '').trim();
  const phone = (req.query.phone || '').trim();
  const normalizedPhone = phone.replace(/\D/g, '');
  if (!orderId && !email && !normalizedPhone) return res.status(400).json({ error: 'Order ID, email, or phone is required' });

  const result = await pool.query(
    `SELECT * FROM orders
     WHERE ($1::text <> '' AND id::text ILIKE $1 || '%')
        OR ($2::text <> '' AND LOWER(buyer_email) = LOWER($2))
        OR ($3::text <> '' AND regexp_replace(buyer_phone, '\\D', '', 'g') = $3)
     ORDER BY created_at DESC
     LIMIT 20`,
    [orderId, email, normalizedPhone]
  );
  res.json(result.rows.map(orderFromRow));
}));

app.get('/api/orders/:id', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
  res.json(orderFromRow(result.rows[0]));
}));

app.get('/api/shipping-fees', asyncHandler(async (req, res) => {
  setPublicCache(res, 300);
  res.json(await getShippingFees());
}));

app.get('/api/pickup-locations', asyncHandler(async (req, res) => {
  setPublicCache(res, 120);
  const result = await pool.query('SELECT * FROM locations ORDER BY is_main_store DESC, city ASC, name ASC');
  res.json(result.rows.map(locationFromRow));
}));

app.get('/api/locations', asyncHandler(async (req, res) => {
  setPublicCache(res, 120);
  const result = await pool.query('SELECT * FROM locations ORDER BY is_main_store DESC, city ASC, name ASC');
  res.json(result.rows.map(locationFromRow));
}));

app.get('/api/payment-accounts', (req, res) => {
  res.json(DEFAULT_PAYMENT_ACCOUNTS);
});

app.get('/api/chat/:deviceId', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, device_id, customer_name, message, sender, image_url, is_read, created_at
     FROM chat_messages
     WHERE device_id = $1
     ORDER BY created_at ASC`,
    [req.params.deviceId]
  );
  res.json(result.rows.map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    userName: row.customer_name,
    message: row.message,
    sender: row.sender,
    imageUrl: row.image_url,
    read: row.is_read,
    timestamp: row.created_at,
    createdAt: row.created_at
  })));
}));

app.post('/api/chat', chatValidation, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (device_id, customer_name, message, sender, image_url, is_read)
     VALUES ($1, $2, $3, 'customer', $4, false)
     RETURNING *`,
    [req.body.deviceId, req.body.userName || req.body.customerName || '', req.body.message, req.body.imageUrl || null]
  );
  const row = result.rows[0];
  res.status(201).json({
    id: row.id,
    deviceId: row.device_id,
    userName: row.customer_name,
    message: row.message,
    sender: row.sender,
    imageUrl: row.image_url,
    read: row.is_read,
    timestamp: row.created_at,
    createdAt: row.created_at
  });
}));

app.post('/api/chat/upload', upload.single('file'), sendUploadResponse);

app.post('/api/admin/login', loginValidation, asyncHandler(async (req, res) => {
  requireJwtSecret();
  const { email, password } = req.body;
  const result = await pool.query(
    `SELECT * FROM admins WHERE LOWER(email) = LOWER($1) AND is_active = true`,
    [email]
  );
  if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

  const admin = result.rows[0];
  const valid = await verifyStoredPassword(password, admin);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  const safeAdmin = adminFromRow(admin);
  await logActivity({ admin: safeAdmin, ip: req.ip }, 'login', { details: 'Admin login' });
  res.json({ token, admin: safeAdmin, email: admin.email, role: admin.role, permissions: admin.permissions || {} });
}));

app.post('/api/sub-admin/login', loginValidation, asyncHandler(async (req, res) => {
  requireJwtSecret();
  const { email, password } = req.body;
  const result = await pool.query(
    `SELECT * FROM admins WHERE LOWER(email) = LOWER($1) AND role = 'sub_admin' AND is_active = true`,
    [email]
  );
  if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

  const admin = result.rows[0];
  const valid = await verifyStoredPassword(password, admin);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  const safeAdmin = adminFromRow(admin);
  await logActivity({ admin: safeAdmin, ip: req.ip }, 'login', { details: 'Sub-admin login' });
  res.json({ token, admin: safeAdmin, email: admin.email, role: admin.role, permissions: admin.permissions || {} });
}));

app.use('/api/admin', authenticate);

app.get('/api/admin/real-time-stats', asyncHandler(async (req, res) => {
  const orders = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  const mapped = orders.rows.map(orderFromRow);
  const completed = mapped.filter((order) => ['delivered', 'completed'].includes(order.status));
  const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);
  const totalItemsSold = completed.reduce(
    (sum, order) => sum + order.items.reduce((inner, item) => inner + Number(item.quantity || 0), 0),
    0
  );
  res.json({
    totalRevenue,
    totalOrders: mapped.length,
    totalItemsSold,
    averageOrderValue: mapped.length ? Math.round(mapped.reduce((sum, order) => sum + order.total, 0) / mapped.length) : 0,
    revenueTrend: 0,
    ordersTrend: 0,
    recentOrders: mapped.slice(0, 10).map((order) => ({
      id: order.id,
      buyerName: order.buyer.name,
      region: order.region,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    })),
    byStatus: mapped.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {})
  });
}));

app.get('/api/admin/period-stats', asyncHandler(async (req, res) => {
  const stats = await pool.query(`
    SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total), 0)::int AS total_revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);
  res.json(stats.rows[0]);
}));

app.get('/api/admin/products', checkPermission('manageProducts'), asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(result.rows.map(productFromRow));
}));

app.post('/api/admin/products', checkPermission('manageProducts'), productValidation, asyncHandler(async (req, res) => {
  const images = normalizeArray(req.body.images).filter((image) => image && image.url);
  const imageUrl = req.body.image_url || req.body.image || images[0]?.url || '';
  const regions = normalizeArray(req.body.availableRegions || req.body.available_regions, ['ALL']);
  const translations = req.body.translations && typeof req.body.translations === 'object' ? req.body.translations : {};
  const storeAvailability = req.body.storeAvailability || req.body.store_availability || {};
  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock, category, is_new, most_ordered, available_regions, image_url, images, translations, store_availability)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb)
     RETURNING *`,
    [
      req.body.name,
      req.body.description || '',
      Number(req.body.price),
      Number(req.body.stock),
      req.body.category || '',
      Boolean(req.body.isNew || req.body.is_new),
      Boolean(req.body.mostOrdered || req.body.most_ordered),
      regions.length ? regions : ['ALL'],
      imageUrl,
      JSON.stringify(images),
      JSON.stringify(translations),
      JSON.stringify(storeAvailability)
    ]
  );
  await logActivity(req, 'create_product', { productId: result.rows[0].id, name: result.rows[0].name });
  res.status(201).json(productFromRow(result.rows[0]));
}));

app.put('/api/admin/products/:id', checkPermission('manageProducts'), productValidation, asyncHandler(async (req, res) => {
  const images = normalizeArray(req.body.images).filter((image) => image && image.url);
  const imageUrl = req.body.image_url || req.body.image || images[0]?.url || '';
  const regions = normalizeArray(req.body.availableRegions || req.body.available_regions, ['ALL']);
  const translations = req.body.translations && typeof req.body.translations === 'object' ? req.body.translations : {};
  const storeAvailability = req.body.storeAvailability || req.body.store_availability || {};
  const result = await pool.query(
    `UPDATE products
     SET name = $1, description = $2, price = $3, stock = $4, category = $5,
         is_new = $6, most_ordered = $7, available_regions = $8, image_url = $9,
         images = $10::jsonb, translations = $11::jsonb, store_availability = $12::jsonb, updated_at = NOW()
     WHERE id = $13
     RETURNING *`,
    [
      req.body.name,
      req.body.description || '',
      Number(req.body.price),
      Number(req.body.stock),
      req.body.category || '',
      Boolean(req.body.isNew || req.body.is_new),
      Boolean(req.body.mostOrdered || req.body.most_ordered),
      regions.length ? regions : ['ALL'],
      imageUrl,
      JSON.stringify(images),
      JSON.stringify(translations),
      JSON.stringify(storeAvailability),
      req.params.id
    ]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
  await logActivity(req, 'update_product', { productId: req.params.id, name: req.body.name });
  res.json(productFromRow(result.rows[0]));
}));

app.delete('/api/admin/products/:id', checkPermission('manageProducts'), asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
  await logActivity(req, 'delete_product', { productId: req.params.id, name: result.rows[0].name });
  res.json({ message: 'Product deleted' });
}));

app.get('/api/admin/orders', checkPermission('manageOrders'), asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(result.rows.map(orderFromRow));
}));

app.put('/api/admin/orders/:id', checkPermission('manageOrders'), validate([
  body('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed']).withMessage('Invalid order status'),
  body('deliveryAgency').optional().isString(),
  body('paidAmount').optional().isInt({ min: 0 }),
  body('isPaid').optional().isBoolean().withMessage('Payment status must be true or false')
]), asyncHandler(async (req, res) => {
  const current = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (current.rowCount === 0) return res.status(404).json({ error: 'Order not found' });

  const existing = current.rows[0];
  const status = req.body.status || existing.status;
  const requestedAgency = req.body.deliveryAgency ?? req.body.delivery_agency ?? req.body.selectedDeliveryAgency;
  const deliveryAgency = requestedAgency && typeof requestedAgency === 'object'
    ? requestedAgency.name || ''
    : requestedAgency ?? existing.delivery_agency;
  const paidAmount = req.body.isPaid === true
    ? existing.total
    : req.body.isPaid === false
      ? 0
      : req.body.paidAmount ?? req.body.paid_amount ?? existing.paid_amount;
  const changeAmount = req.body.changeAmount ?? req.body.change_amount ?? existing.change_amount;
  const paymentMethod = req.body.paymentMethod ?? req.body.payment_method ?? existing.payment_method;

  const result = await pool.query(
    `UPDATE orders
     SET status = $1, delivery_agency = $2, paid_amount = $3, change_amount = $4,
         payment_method = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [status, deliveryAgency, paidAmount, changeAmount, paymentMethod, req.params.id]
  );
  const order = orderFromRow(result.rows[0]);
  await logActivity(req, 'update_order', { orderId: req.params.id, oldStatus: existing.status, newStatus: status });
  queueStatusEmail(order, existing.status);
  res.json(order);
}));

app.post('/api/admin/orders/:id/status', checkPermission('manageOrders'), asyncHandler(async (req, res) => {
  req.body = { ...req.body, status: req.body.status };
  const current = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (current.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
  const result = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [req.body.status || 'pending', req.params.id]
  );
  const order = orderFromRow(result.rows[0]);
  queueStatusEmail(order, current.rows[0].status);
  res.json(order);
}));

app.post('/api/admin/orders/:id/cancel', checkPermission('manageOrders'), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
  await logActivity(req, 'cancel_order', { orderId: req.params.id });
  res.json(orderFromRow(result.rows[0]));
}));

app.delete('/api/admin/orders/:id', checkPermission('manageOrders'), asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
  await logActivity(req, 'delete_order', { orderId: req.params.id });
  res.json({ message: 'Order deleted' });
}));

app.get('/api/admin/shipping-fees', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  res.json(await getShippingFees());
}));

app.put('/api/admin/shipping-fees', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  const updates = req.body || {};
  for (const [city, fee] of Object.entries(updates)) {
    if (!city || normalizeNumber(fee, -1) < 0) continue;
    await pool.query(
      `INSERT INTO shipping_fees (city, fee)
       VALUES ($1, $2)
       ON CONFLICT (city) DO UPDATE SET fee = EXCLUDED.fee`,
      [city, Number(fee)]
    );
  }
  await logActivity(req, 'update_shipping_fees', { cities: Object.keys(updates) });
  res.json(await getShippingFees());
}));

app.get('/api/admin/main-shop-town', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ mainShopTown: settings.main_shop_town });
}));

app.put('/api/admin/main-shop-town', checkPermission('manageLocations'), validate([
  body('mainShopTown').trim().notEmpty().withMessage('Main shop town is required')
]), asyncHandler(async (req, res) => {
  if (req.body.mainShopTown !== 'Bamenda') {
    return res.status(400).json({ error: 'The main shop town is configured as Bamenda and cannot be changed here.' });
  }
  await pool.query(
    `UPDATE settings SET value = 'Bamenda', updated_at = NOW() WHERE key = 'main_shop_town'`
  );
  await logActivity(req, 'update_main_shop_town', { mainShopTown: 'Bamenda' });
  res.json({ mainShopTown: 'Bamenda' });
}));

app.get('/api/admin/free-shipping', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({
    threshold: Number(settings.free_shipping_threshold),
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    regionFreeShipping: {}
  });
}));

app.put('/api/admin/free-shipping', checkPermission('manageLocations'), validate([
  body('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
  body('freeShippingThreshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer')
]), asyncHandler(async (req, res) => {
  const threshold = Number(req.body.threshold ?? req.body.freeShippingThreshold ?? 100000);
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('free_shipping_threshold', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [String(threshold)]
  );
  await logActivity(req, 'update_free_shipping', { threshold });
  res.json({ threshold, freeShippingThreshold: threshold, regionFreeShipping: {} });
}));

app.put('/api/admin/settings', requireSuperAdmin, asyncHandler(async (req, res) => {
  const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const rawPassword = typeof req.body.password === 'string' ? req.body.password : '';

  const updates = [];
  const values = [];
  let emailChanged = false;

  if (rawEmail) {
    const normalizedEmail = rawEmail.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    const existing = await pool.query(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER($1) AND id <> $2',
      [normalizedEmail, req.admin.id]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'That email is already in use by another account' });
    }
    values.push(normalizedEmail);
    updates.push(`email = $${values.length}`);
    emailChanged = true;
  }

  if (rawPassword) {
    if (rawPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    values.push(passwordHash);
    updates.push(`password_hash = $${values.length}`);
  }

  let updatedAdmin = req.admin;
  if (updates.length > 0) {
    values.push(req.admin.id);
    const result = await pool.query(
      `UPDATE admins SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, email, role, permissions, is_active, created_at, updated_at`,
      values
    );
    updatedAdmin = adminFromRow(result.rows[0]);
  }

  if (req.body.platformName) {
    await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('shop_name', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [String(req.body.platformName)]
    );
  }

  let token;
  if (emailChanged) {
    token = jwt.sign(
      { id: updatedAdmin.id, email: updatedAdmin.email, role: updatedAdmin.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
  }

  await logActivity(req, 'update_settings', {
    emailChanged,
    passwordChanged: Boolean(rawPassword),
    platformName: req.body.platformName || undefined
  });

  res.json({
    message: 'Settings updated',
    admin: updatedAdmin,
    email: updatedAdmin.email,
    token
  });
}));

app.put('/api/admin/hero-section', requireSuperAdmin, asyncHandler(async (req, res) => {
  const hero = { ...DEFAULT_HERO_SECTION, ...req.body };
  if (!hero.backgroundImage) hero.backgroundImage = INITIAL_HERO_IMAGE;
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('hero_section', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(hero)]
  );
  await logActivity(req, 'update_hero_section', {});
  res.json(hero);
}));

app.post('/api/admin/upload', checkPermission('manageProducts'), adminProductUpload, sendUploadResponse);

app.get('/api/admin/locations', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM locations ORDER BY is_main_store DESC, city ASC, name ASC');
  res.json(result.rows.map(locationFromRow));
}));

app.post('/api/admin/locations', checkPermission('manageLocations'), validate([
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
]), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO locations (name, city, address, phone, email, lat, lng, is_main_store, hours, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      req.body.name,
      req.body.city,
      req.body.address,
      req.body.phone || '',
      req.body.email || '',
      req.body.lat || null,
      req.body.lng || null,
      Boolean(req.body.isMainStore || req.body.is_main_store),
      req.body.hours || '',
      req.body.description || ''
    ]
  );
  await logActivity(req, 'create_location', { locationId: result.rows[0].id, name: result.rows[0].name });
  res.status(201).json(locationFromRow(result.rows[0]));
}));

app.put('/api/admin/locations/:id', checkPermission('manageLocations'), validate([
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
]), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE locations
     SET name = $1, city = $2, address = $3, phone = $4, email = $5,
         lat = $6, lng = $7, is_main_store = $8, hours = $9, description = $10
     WHERE id = $11
     RETURNING *`,
    [
      req.body.name,
      req.body.city,
      req.body.address,
      req.body.phone || '',
      req.body.email || '',
      req.body.lat || null,
      req.body.lng || null,
      Boolean(req.body.isMainStore || req.body.is_main_store),
      req.body.hours || '',
      req.body.description || '',
      req.params.id
    ]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Location not found' });
  await logActivity(req, 'update_location', { locationId: req.params.id });
  res.json(locationFromRow(result.rows[0]));
}));

app.delete('/api/admin/locations/:id', checkPermission('manageLocations'), asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Location not found' });
  await logActivity(req, 'delete_location', { locationId: req.params.id, name: result.rows[0].name });
  res.json({ message: 'Location deleted' });
}));

async function listSubAdmins(req, res) {
  const result = await pool.query(
    `SELECT id, name, email, role, permissions, is_active, created_at, updated_at
     FROM admins
     WHERE role = 'sub_admin'
     ORDER BY created_at DESC`
  );
  res.json(result.rows.map(adminFromRow));
}

async function createSubAdmin(req, res) {
  if (!req.body.password || String(req.body.password).length < 8) {
    return res.status(400).json({ errors: [{ field: 'password', message: 'Password must be at least 8 characters' }] });
  }
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const result = await pool.query(
    `INSERT INTO admins (name, email, password_hash, role, permissions, is_active)
     VALUES ($1, $2, $3, 'sub_admin', $4::jsonb, true)
     RETURNING id, name, email, role, permissions, is_active, created_at, updated_at`,
    [req.body.name, req.body.email, passwordHash, JSON.stringify(req.body.permissions || {})]
  );
  await logActivity(req, 'create_sub_admin', { subAdminId: result.rows[0].id, email: req.body.email });
  res.status(201).json(adminFromRow(result.rows[0]));
}

async function updateSubAdmin(req, res) {
  const current = await pool.query("SELECT * FROM admins WHERE id = $1 AND role = 'sub_admin'", [req.params.id]);
  if (current.rowCount === 0) return res.status(404).json({ error: 'Sub-admin not found' });

  let passwordHash = current.rows[0].password_hash;
  if (req.body.password) passwordHash = await bcrypt.hash(req.body.password, 12);

  const result = await pool.query(
    `UPDATE admins
     SET name = $1, email = $2, password_hash = $3, permissions = $4::jsonb,
         is_active = $5, updated_at = NOW()
     WHERE id = $6 AND role = 'sub_admin'
     RETURNING id, name, email, role, permissions, is_active, created_at, updated_at`,
    [
      req.body.name || current.rows[0].name,
      req.body.email || current.rows[0].email,
      passwordHash,
      JSON.stringify(req.body.permissions || current.rows[0].permissions || {}),
      req.body.isActive ?? req.body.is_active ?? current.rows[0].is_active,
      req.params.id
    ]
  );
  await logActivity(req, 'update_sub_admin', { subAdminId: req.params.id });
  res.json(adminFromRow(result.rows[0]));
}

async function deleteSubAdmin(req, res) {
  const result = await pool.query("DELETE FROM admins WHERE id = $1 AND role = 'sub_admin' RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Sub-admin not found' });
  await logActivity(req, 'delete_sub_admin', { subAdminId: req.params.id, email: result.rows[0].email });
  res.json({ message: 'Sub-admin deleted' });
}

const subAdminValidation = validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').if(body('password').exists()).isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
]);

app.get('/api/admin/sub-admins', requireSuperAdmin, asyncHandler(listSubAdmins));
app.post('/api/admin/sub-admins', requireSuperAdmin, subAdminValidation, asyncHandler(createSubAdmin));
app.put('/api/admin/sub-admins/:id', requireSuperAdmin, asyncHandler(updateSubAdmin));
app.delete('/api/admin/sub-admins/:id', requireSuperAdmin, asyncHandler(deleteSubAdmin));
app.get('/api/admin/subadmins', requireSuperAdmin, asyncHandler(listSubAdmins));
app.post('/api/admin/subadmins', requireSuperAdmin, subAdminValidation, asyncHandler(createSubAdmin));
app.put('/api/admin/subadmins/:id', requireSuperAdmin, asyncHandler(updateSubAdmin));
app.delete('/api/admin/subadmins/:id', requireSuperAdmin, asyncHandler(deleteSubAdmin));

app.get('/api/admin/subadmin-activities', requireSuperAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM admin_activities ORDER BY created_at DESC LIMIT 50');
  res.json(result.rows.map(activityFromRow));
}));

app.post('/api/admin/log-subadmin-activity', asyncHandler(async (req, res) => {
  await logActivity(req, req.body.action || 'activity', { details: req.body.details || '' });
  res.json({ message: 'Activity logged' });
}));

app.get('/api/admin/chats', checkPermission('manageCustomerService'), asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT device_id,
           MAX(customer_name) FILTER (WHERE customer_name IS NOT NULL AND customer_name <> '') AS customer_name,
           COUNT(*) FILTER (WHERE sender = 'customer' AND is_read = false)::int AS unread_count,
           MAX(created_at) AS last_message_at
    FROM chat_messages
    GROUP BY device_id
    ORDER BY last_message_at DESC
  `);
  const conversations = [];
  for (const row of result.rows) {
    const messages = await pool.query(
      `SELECT * FROM chat_messages WHERE device_id = $1 ORDER BY created_at ASC`,
      [row.device_id]
    );
    conversations.push({
      deviceId: row.device_id,
      userName: row.customer_name || row.device_id,
      unreadCount: row.unread_count,
      lastMessageAt: row.last_message_at,
      messages: messages.rows.map((message) => ({
        id: message.id,
        deviceId: message.device_id,
        userName: message.customer_name,
        message: message.message,
        sender: message.sender,
        imageUrl: message.image_url,
        read: message.is_read,
        timestamp: message.created_at,
        createdAt: message.created_at
      }))
    });
  }
  res.json(conversations);
}));

app.get('/api/admin/chat/conversations', checkPermission('manageCustomerService'), asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT DISTINCT device_id FROM chat_messages ORDER BY device_id ASC');
  res.json(result.rows.map((row) => ({ deviceId: row.device_id })));
}));

app.post('/api/admin/chats/:deviceId/reply', checkPermission('manageCustomerService'), validate([
  body('message').custom((value, { req }) => {
    if (String(value || '').trim() || req.body.imageUrl) return true;
    throw new Error('Message is required');
  })
]), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (device_id, customer_name, message, sender, image_url, is_read)
     VALUES ($1, $2, $3, 'admin', $4, false)
     RETURNING *`,
    [req.params.deviceId, req.admin.name, req.body.message || '[Attachment]', req.body.imageUrl || null]
  );
  await logActivity(req, 'reply_chat', { deviceId: req.params.deviceId });
  res.status(201).json({
    id: result.rows[0].id,
    message: result.rows[0].message,
    sender: 'admin',
    imageUrl: result.rows[0].image_url,
    timestamp: result.rows[0].created_at
  });
}));

app.put('/api/admin/chats/:deviceId/read', checkPermission('manageCustomerService'), asyncHandler(async (req, res) => {
  await pool.query(
    "UPDATE chat_messages SET is_read = true WHERE device_id = $1 AND sender = 'customer'",
    [req.params.deviceId]
  );
  res.json({ message: 'Conversation marked as read' });
}));

app.delete('/api/admin/chats/:deviceId', checkPermission('manageCustomerService'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM chat_messages WHERE device_id = $1', [req.params.deviceId]);
  await logActivity(req, 'clear_chat', { deviceId: req.params.deviceId });
  res.json({ message: 'Chat cleared' });
}));

app.delete('/api/admin/chats/:deviceId/delete', checkPermission('manageCustomerService'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM chat_messages WHERE device_id = $1', [req.params.deviceId]);
  await logActivity(req, 'delete_chat', { deviceId: req.params.deviceId });
  res.json({ message: 'Conversation deleted' });
}));

app.put('/api/chat/:messageId/read', asyncHandler(async (req, res) => {
  await pool.query('UPDATE chat_messages SET is_read = true WHERE id = $1', [req.params.messageId]);
  res.json({ message: 'Message marked read' });
}));

app.post('/api/pos/save-receipt', authenticate, checkPermission('managePOS'), asyncHandler(async (req, res) => {
  const receipt = req.body.receipt || req.body;
  const totals = receipt.totals || {};
  const result = await pool.query(
    `INSERT INTO pos_receipts (
      customer_name, customer_phone, items, subtotal, discount_percent, discount_amount,
      total, paid_amount, change_amount, payment_method, cashier_name
    )
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      receipt.customer?.name || req.body.customerName || '',
      receipt.customer?.phone || req.body.customerPhone || '',
      JSON.stringify(receipt.items || []),
      normalizeNumber(totals.subtotal, 0),
      normalizeNumber(receipt.discountPercent, 0),
      normalizeNumber(totals.discount, 0),
      normalizeNumber(totals.total, 0),
      normalizeNumber(receipt.paidAmount, 0),
      normalizeNumber(receipt.changeAmount, 0),
      receipt.paymentMethod || 'cash',
      req.admin.name
    ]
  );
  await logActivity(req, 'create_pos_receipt', { receiptId: result.rows[0].id });
  res.status(201).json({ id: result.rows[0].id, message: 'Receipt saved' });
}));

app.get('/api/pos/receipts', authenticate, checkPermission('viewPOSAnalytics'), asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const result = await pool.query('SELECT * FROM pos_receipts ORDER BY created_at DESC LIMIT $1', [limit]);
  res.json(result.rows.map((row) => ({
    id: row.id,
    customer: { name: row.customer_name, phone: row.customer_phone },
    items: row.items || [],
    totals: { subtotal: row.subtotal, discount: row.discount_amount, total: row.total },
    discountPercent: row.discount_percent,
    paymentMethod: row.payment_method,
    cashierName: row.cashier_name,
    createdAt: row.created_at
  })));
}));

app.get('/api/pos/statistics', authenticate, checkPermission('viewPOSAnalytics'), asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total_receipts,
           COALESCE(SUM(total), 0)::int AS total_revenue,
           COALESCE(AVG(total), 0)::int AS average_receipt
    FROM pos_receipts
  `);
  res.json({
    totalReceipts: result.rows[0].total_receipts,
    totalRevenue: result.rows[0].total_revenue,
    averageReceipt: result.rows[0].average_receipt
  });
}));

app.get('/api/admin/pos-stats', checkPermission('viewPOSAnalytics'), asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total_receipts,
           COALESCE(SUM(total), 0)::int AS total_revenue
    FROM pos_receipts
  `);
  res.json(result.rows[0]);
}));

app.post('/api/admin/payment-accounts', requireSuperAdmin, (req, res) => {
  res.json({
    ...DEFAULT_PAYMENT_ACCOUNTS,
    message: 'Payment gateways are not enabled. Orders are received first and confirmed manually.'
  });
});

app.get('/api/admin/customers-with-installments', checkPermission('viewAnalytics'), (req, res) => res.json([]));
app.get('/api/admin/installment-stats', checkPermission('viewAnalytics'), (req, res) => {
  res.json({ activeInstallments: 0, totalInstallmentAmount: 0, conversionRate: 0 });
});

app.get('/api/admin/data-management/deleted', (req, res) => res.json([]));
app.get('/api/admin/data-management/stats', (req, res) => {
  res.json({
    totalDeleted: 0,
    deletedInLast48h: 0,
    deletedOlderThan48h: 0,
    breakdown: { products: 0, orders: 0, receipts: 0, chats: 0 }
  });
});
app.post('/api/admin/data-management/restore/:deleteId', (req, res) => res.json({ message: 'Nothing to restore' }));
app.post('/api/admin/data-management/permanent-delete/:deleteId', (req, res) => res.json({ message: 'Nothing to delete' }));
app.post('/api/admin/data-management/clear-period/:type/:period', (req, res) => res.json({ deletedCount: 0 }));

app.get('/api/admin/reset-status', (req, res) => res.json({ isReset: false, isExpired: false, hoursRemaining: 0 }));
app.post('/api/admin/reset-platform', requireSuperAdmin, (req, res) => {
  res.status(400).json({ error: 'Production reset is disabled. Use server/cleanup.js intentionally from the server shell.' });
});
app.post('/api/admin/restore-platform', requireSuperAdmin, (req, res) => res.json({ message: 'No reset data to restore' }));
app.post('/api/admin/extend-recovery-window', requireSuperAdmin, (req, res) => res.json({ message: 'No reset window is active' }));
app.post('/api/admin/clear-data', requireSuperAdmin, (req, res) => {
  res.status(400).json({ error: 'Bulk data clearing is disabled in production. Use server/cleanup.js intentionally.' });
});

app.post('/api/customer/signup', validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
]), asyncHandler(async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const result = await pool.query(
    `INSERT INTO customers (name, email, phone, address, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, address, created_at`,
    [req.body.name, req.body.email, req.body.phone || '', req.body.address || '', passwordHash]
  );
  res.status(201).json({ customer: result.rows[0], message: 'Customer account created' });
}));

app.post('/api/customer/login', loginValidation, asyncHandler(async (req, res) => {
  requireJwtSecret();
  const result = await pool.query('SELECT * FROM customers WHERE LOWER(email) = LOWER($1)', [req.body.email]);
  if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(req.body.password, result.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, customer: { id: result.rows[0].id, name: result.rows[0].name, email: result.rows[0].email } });
}));

app.get('/api/customer/orders', authenticateCustomer, asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM orders WHERE LOWER(buyer_email) = LOWER($1) ORDER BY created_at DESC', [req.customer.email]);
  res.json(result.rows.map(orderFromRow));
}));
app.get('/api/customer/installment-plans', authenticateCustomer, (req, res) => res.json([]));
app.post('/api/customer/create-installment', authenticateCustomer, (req, res) => {
  res.status(400).json({ error: 'Installment payments are not enabled.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.expose || process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error'
  });
});

const clientBuildPath = path.join(__dirname, '../client/dist');
// Cache hashed assets for one year; keep HTML fresh so deployments update immediately.
app.use(express.static(clientBuildPath, {
  maxAge: '1y',
  immutable: true,
  etag: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

function isManagedDeploymentRuntime() {
  return Boolean(
    process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NODE_ENV === 'production'
  );
}

function createMissingDatabaseUrlError() {
  const err = new Error(
    [
      'DATABASE_URL is not configured for this deployment.',
      'Render web services do not include PostgreSQL on localhost, so the app cannot use ::1:5432 or 127.0.0.1:5432.',
      'Create a Render PostgreSQL database and set DATABASE_URL to its internal connection string, or deploy this repository as a Render Blueprint with render.yaml.'
    ].join(' ')
  );
  err.code = 'MISSING_DATABASE_URL';
  err.expose = true;
  return err;
}

function isLocalPostgresConnectionRefused(err) {
  if (err?.code !== 'ECONNREFUSED') return false;
  const errors = Array.isArray(err.errors) ? err.errors : [err];
  return errors.some((item) => (
    item?.port === 5432 &&
    (item?.address === '127.0.0.1' || item?.address === '::1')
  ));
}

function isDatabaseConnectivityError(err) {
  const networkCodes = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);
  if (networkCodes.has(err?.code)) return true;
  return Array.isArray(err?.errors) && err.errors.some((item) => networkCodes.has(item?.code));
}

function isDatabaseConfigurationError(err) {
  return new Set(['28P01', '28000', '3D000']).has(err?.code);
}

function logStartupError(err) {
  if (err?.code === 'MISSING_DATABASE_URL' || isLocalPostgresConnectionRefused(err)) {
    console.error('Server failed to start: DATABASE_URL is missing or pointing to local PostgreSQL.');
    console.error('Render manual Web Services ignore render.yaml envVars. If the build log shows your custom build command, this service was not created from the Blueprint.');
    console.error('Recommended fix: Render Dashboard -> Blueprints -> New Blueprint Instance -> select this repo -> set ADMIN_PASSWORD when prompted.');
    console.error('Existing service fix: create a Render PostgreSQL database, then add DATABASE_URL from its Internal Database URL, JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD in the Web Service environment variables.');
    console.error('Full checklist: RENDER_DEPLOYMENT.md in the repository root.');
    if (process.env.DEBUG_STARTUP === 'true') console.error(err);
    return;
  }

  if (isDatabaseConfigurationError(err)) {
    console.error('Server failed to start: PostgreSQL rejected the configured DATABASE_URL.');
    console.error('Check that DATABASE_URL is copied exactly from Render PostgreSQL, including username, password, host, port, and database name.');
    console.error('If this is a manual Web Service, use the database Internal Database URL when possible, then redeploy.');
    if (process.env.DEBUG_STARTUP === 'true') console.error(err);
    return;
  }

  if (isDatabaseConnectivityError(err)) {
    console.error('Server failed to start: PostgreSQL could not be reached with the configured DATABASE_URL.');
    console.error('On Render, use the PostgreSQL Internal Database URL for DATABASE_URL and keep the web service in the same region as the database.');
    console.error('If you pasted the External Database URL or a URL with sslmode=require, set DATABASE_SSL=true.');
    console.error('The database connection attempt timed out quickly so the service does not hang behind a browser timeout.');
    if (process.env.DEBUG_STARTUP === 'true') console.error(err);
    return;
  }

  console.error('Server failed to start:', err);
}

async function start() {
  if (!process.env.DATABASE_URL && isManagedDeploymentRuntime()) throw createMissingDatabaseUrlError();
  if (!JWT_SECRET) console.warn('JWT_SECRET is not configured. Admin login will fail until it is set.');
  await migrate({ close: false });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

if (require.main === module) {
  start().catch((err) => {
    logStartupError(err);
    process.exit(1);
  });
}

module.exports = app;
