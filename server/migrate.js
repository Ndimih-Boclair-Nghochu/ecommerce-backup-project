require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { pool } = require('./db');

const requiredSettings = [
  ['shop_name', process.env.SHOP_NAME || 'MyShop'],
  ['main_shop_town', 'Bamenda'],
  ['free_shipping_threshold', '100000'],
  ['shop_phone', '+237 6 52 882 753'],
  ['shop_email', 'ndimihboclair4@gmail.com']
];

const shippingFees = [
  ['Bamenda', 0],
  ['Douala', 1016],
  ['Yaoundé', 3000],
  ['Bafoussam', 5000],
  ['Garoua', 8000],
  ['Maroua', 9000],
  ['Ngaoundéré', 7000],
  ['Bertoua', 6500],
  ['Buea', 2000],
  ['Limbe', 2500],
  ['Bafang', 2001],
  ['Nkong', 2000]
];

const starterProducts = [
  {
    name: 'Samsung Galaxy A15 128GB',
    description: 'Reliable Android smartphone with a bright display, long battery life, dual SIM support, and enough storage for everyday business, school, and entertainment use.',
    price: 145000,
    stock: 18,
    category: 'Phones',
    isNew: true,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200',
    images: [
      { color: 'Blue Black', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200' },
      { color: 'Light Blue', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200' }
    ]
  },
  {
    name: 'HP EliteBook 840 G6 Laptop',
    description: 'Business-grade laptop for office work, online classes, inventory management, and daily productivity. Includes fast SSD storage, webcam, Wi-Fi, and a durable aluminum body.',
    price: 285000,
    stock: 7,
    category: 'Computers',
    isNew: false,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200',
    images: [
      { color: 'Silver', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200' },
      { color: 'Workspace View', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200' }
    ]
  },
  {
    name: 'Oraimo FreePods Wireless Earbuds',
    description: 'Compact wireless earbuds with clear sound, charging case, touch controls, and comfortable fit for calls, music, and travel.',
    price: 18500,
    stock: 35,
    category: 'Audio',
    isNew: true,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=1200',
    images: [
      { color: 'Black', url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=1200' },
      { color: 'White', url: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=1200' }
    ]
  },
  {
    name: 'Smart LED TV 43 Inch',
    description: 'Full HD smart television with built-in streaming apps, HDMI and USB ports, clear speakers, and a slim design for living rooms, shops, and offices.',
    price: 195000,
    stock: 9,
    category: 'Televisions',
    isNew: true,
    mostOrdered: false,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200',
    images: [
      { color: 'Front View', url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200' },
      { color: 'Home Setup', url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=1200' }
    ]
  },
  {
    name: 'Anker 20000mAh Power Bank',
    description: 'High-capacity portable power bank with fast charging support for phones, tablets, wireless earbuds, and other USB-powered devices.',
    price: 32000,
    stock: 24,
    category: 'Accessories',
    isNew: false,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200',
    images: [
      { color: 'Black', url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200' },
      { color: 'Portable Setup', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200' }
    ]
  },
  {
    name: 'Logitech Wireless Keyboard and Mouse Combo',
    description: 'Comfortable wireless keyboard and mouse set for laptops, desktops, POS desks, and office work. Includes plug-and-play USB receiver.',
    price: 28000,
    stock: 16,
    category: 'Computer Accessories',
    isNew: true,
    mostOrdered: false,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200',
    images: [
      { color: 'Black', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200' },
      { color: 'Desk Setup', url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200' }
    ]
  }
];

async function seedStarterProducts(client) {
  const marker = await client.query("SELECT 1 FROM settings WHERE key = 'starter_products_seeded_v1'");
  if (marker.rowCount > 0) return;

  for (const product of starterProducts) {
    await client.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [product.category]
    );

    await client.query(
      `INSERT INTO products (
        name, description, price, stock, category, is_new, most_ordered,
        available_regions, image_url, images
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.isNew,
        product.mostOrdered,
        product.availableRegions,
        product.imageUrl,
        JSON.stringify(product.images)
      ]
    );
  }

  await client.query(
    `INSERT INTO settings (key, value) VALUES ('starter_products_seeded_v1', 'true')
     ON CONFLICT (key) DO NOTHING`
  );
}

async function migrate(options = {}) {
  const close = options.close !== false;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_fees (
        city VARCHAR(100) PRIMARY KEY,
        fee INTEGER NOT NULL DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(100),
        is_new BOOLEAN DEFAULT false,
        most_ordered BOOLEAN DEFAULT false,
        available_regions TEXT[],
        image_url TEXT,
        images JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_name VARCHAR(255) NOT NULL,
        buyer_email VARCHAR(255) NOT NULL,
        buyer_phone VARCHAR(50) NOT NULL,
        buyer_address TEXT NOT NULL,
        buyer_agencies TEXT[],
        region VARCHAR(100) NOT NULL,
        shipping_fee INTEGER NOT NULL DEFAULT 0,
        subtotal INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        items JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        delivery_agency VARCHAR(255),
        notes TEXT,
        payment_method VARCHAR(50),
        is_in_store_sale BOOLEAN DEFAULT false,
        discount_percent INTEGER DEFAULT 0,
        paid_amount INTEGER DEFAULT 0,
        change_amount INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        items JSONB NOT NULL DEFAULT '[]',
        subtotal INTEGER NOT NULL DEFAULT 0,
        discount_percent INTEGER DEFAULT 0,
        discount_amount INTEGER DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        paid_amount INTEGER DEFAULT 0,
        change_amount INTEGER DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'cash',
        cashier_name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'sub_admin',
        permissions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
        admin_name VARCHAR(255),
        admin_email VARCHAR(255),
        action VARCHAR(500) NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        message TEXT NOT NULL,
        sender VARCHAR(20) NOT NULL,
        image_url TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        lat DECIMAL(9,6),
        lng DECIMAL(9,6),
        is_main_store BOOLEAN DEFAULT false,
        hours VARCHAR(255),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders (buyer_email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone ON orders (buyer_phone)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_device_created ON chat_messages (device_id, created_at)');

    for (const [key, value] of requiredSettings) {
      await client.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    for (const [city, fee] of shippingFees) {
      await client.query(
        `INSERT INTO shipping_fees (city, fee)
         VALUES ($1, $2)
         ON CONFLICT (city) DO NOTHING`,
        [city, fee]
      );
    }

    await client.query(`
      INSERT INTO locations (name, city, address, phone, email, lat, lng, is_main_store, hours, description)
      SELECT 'Main Store - Bamenda', 'Bamenda', 'mile 4, Bamenda, Cameroon', '+237 6 52 882 753', 'bamenda@store.cm', 5.9631, 10.1591, true, 'Mon-Sun: 8AM-8PM', 'Our flagship store in the heart of Bamenda'
      WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Main Store - Bamenda' AND city = 'Bamenda')
    `);

    await client.query(`
      INSERT INTO locations (name, city, address, phone, email, lat, lng, is_main_store, hours, description)
      SELECT 'Buea Branch', 'Buea', 'mile 5, Buea, Cameroon', '+237 6 52 882 753', 'buea@store.cm', 4.1555, 9.2424, false, 'Mon-Sun: 8AM-8PM', 'Our scenic branch store overlooking Mount Cameroon'
      WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Buea Branch' AND city = 'Buea')
    `);

    await seedStarterProducts(client);

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
      await client.query(
        `INSERT INTO admins (name, email, password_hash, role, permissions)
         VALUES ($1, $2, $3, 'super_admin', $4::jsonb)
         ON CONFLICT (email) DO UPDATE
         SET role = 'super_admin',
             password_hash = EXCLUDED.password_hash,
             permissions = EXCLUDED.permissions,
             is_active = true,
             updated_at = NOW()`,
        [
          'Ndimih Boclair Nghochu',
          process.env.ADMIN_EMAIL,
          process.env.ADMIN_PASSWORD_HASH,
          JSON.stringify({
            manageProducts: true,
            manageOrders: true,
            manageLocations: true,
            viewReports: true,
            viewAnalytics: true,
            manageCustomerService: true,
            managePOS: true,
            viewPOSAnalytics: true,
            manageTeam: true,
            manageSettings: true
          })
        ]
      );
    } else {
      console.warn('ADMIN_EMAIL and ADMIN_PASSWORD_HASH are required to create the super admin.');
    }

    await client.query('COMMIT');
    console.log('Database migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', err);
    throw err;
  } finally {
    client.release();
    if (close) await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(() => process.exit(1));
}

module.exports = migrate;
