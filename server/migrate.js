require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
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

function isBcryptHash(value = '') {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function resolveAdminPasswordHash() {
  if (isBcryptHash(process.env.ADMIN_PASSWORD_HASH || '')) return process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH;
  if (!plainPassword) return '';
  console.warn('ADMIN password was provided without bcrypt. Hashing it during migration.');
  return bcrypt.hash(plainPassword, 12);
}

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

const additionalProducts = [
  {
    name: 'Tecno Spark 20 Pro 256GB',
    description: 'Large-screen Android phone with generous storage, smooth everyday performance, dual SIM support, and a dependable battery for work, school, and entertainment.',
    price: 168000,
    stock: 20,
    category: 'Phones',
    isNew: true,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200',
    images: [
      { color: 'Midnight Black', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200' },
      { color: 'Display View', url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200' }
    ]
  },
  {
    name: 'Canon PIXMA Wireless Printer',
    description: 'Compact color printer for home offices, school projects, invoices, and small business documents with wireless printing support.',
    price: 89000,
    stock: 11,
    category: 'Computer Accessories',
    isNew: true,
    mostOrdered: false,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1200',
    images: [
      { color: 'White', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1200' },
      { color: 'Office Setup', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200' }
    ]
  },
  {
    name: 'JBL Portable Bluetooth Speaker',
    description: 'Durable portable speaker with rich sound, wireless Bluetooth connection, rechargeable battery, and compact design for indoor and outdoor use.',
    price: 42000,
    stock: 26,
    category: 'Audio',
    isNew: false,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200',
    images: [
      { color: 'Black', url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200' },
      { color: 'Portable View', url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200' }
    ]
  },
  {
    name: 'iPhone 13 128GB',
    description: 'Premium smartphone with sharp OLED display, excellent cameras, fast performance, and reliable battery life for calls, photos, apps, and business.',
    price: 415000,
    stock: 8,
    category: 'Phones',
    isNew: false,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=1200',
    images: [
      { color: 'Blue', url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=1200' },
      { color: 'Camera Detail', url: 'https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=1200' }
    ]
  },
  {
    name: 'Dell 24 Inch Full HD Monitor',
    description: 'Clear Full HD monitor for office desks, POS counters, online classes, design work, and comfortable multitasking with laptops or desktops.',
    price: 118000,
    stock: 13,
    category: 'Computers',
    isNew: true,
    mostOrdered: false,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200',
    images: [
      { color: 'Black', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200' },
      { color: 'Desk Setup', url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=1200' }
    ]
  },
  {
    name: 'Solar Rechargeable LED Lamp',
    description: 'Bright rechargeable LED lamp with solar charging support for homes, shops, study desks, travel, and backup lighting during power cuts.',
    price: 15500,
    stock: 40,
    category: 'Accessories',
    isNew: true,
    mostOrdered: true,
    availableRegions: ['ALL'],
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200',
    images: [
      { color: 'Warm White', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200' },
      { color: 'Night Light', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1200' }
    ]
  }
];

const starterTranslations = {
  'Samsung Galaxy A15 128GB': {
    fr: {
      name: 'Samsung Galaxy A15 128 Go',
      description: 'Smartphone Android fiable avec ecran lumineux, longue autonomie, double SIM et stockage suffisant pour le travail, les etudes et les loisirs.'
    }
  },
  'HP EliteBook 840 G6 Laptop': {
    fr: {
      name: 'Ordinateur portable HP EliteBook 840 G6',
      description: 'Ordinateur professionnel pour le bureau, les cours en ligne, la gestion de stock et la productivite quotidienne.'
    }
  },
  'Oraimo FreePods Wireless Earbuds': {
    fr: {
      name: 'Ecouteurs sans fil Oraimo FreePods',
      description: 'Ecouteurs compacts avec son clair, boitier de charge, commandes tactiles et port confortable pour appels, musique et voyages.'
    }
  },
  'Smart LED TV 43 Inch': {
    fr: {
      name: 'Television Smart LED 43 pouces',
      description: 'Television intelligente Full HD avec applications de streaming, ports HDMI et USB, haut-parleurs clairs et design fin.'
    }
  },
  'Anker 20000mAh Power Bank': {
    fr: {
      name: 'Power bank Anker 20000 mAh',
      description: 'Batterie externe haute capacite avec charge rapide pour telephones, tablettes, ecouteurs et autres appareils USB.'
    }
  },
  'Logitech Wireless Keyboard and Mouse Combo': {
    fr: {
      name: 'Clavier et souris sans fil Logitech',
      description: 'Ensemble clavier et souris sans fil confortable pour ordinateurs, bureaux POS et travail quotidien.'
    }
  },
  'Tecno Spark 20 Pro 256GB': {
    fr: {
      name: 'Tecno Spark 20 Pro 256 Go',
      description: 'Telephone Android grand ecran avec stockage genereux, bonnes performances quotidiennes, double SIM et batterie fiable.'
    }
  },
  'Canon PIXMA Wireless Printer': {
    fr: {
      name: 'Imprimante sans fil Canon PIXMA',
      description: 'Imprimante couleur compacte pour bureaux, devoirs scolaires, factures et documents de petite entreprise.'
    }
  },
  'JBL Portable Bluetooth Speaker': {
    fr: {
      name: 'Haut-parleur Bluetooth portable JBL',
      description: 'Haut-parleur portable durable avec son riche, connexion Bluetooth, batterie rechargeable et format compact.'
    }
  },
  'iPhone 13 128GB': {
    fr: {
      name: 'iPhone 13 128 Go',
      description: 'Smartphone premium avec ecran OLED, excellents appareils photo, performances rapides et autonomie fiable.'
    }
  },
  'Dell 24 Inch Full HD Monitor': {
    fr: {
      name: 'Ecran Dell Full HD 24 pouces',
      description: 'Ecran Full HD clair pour bureaux, comptoirs POS, cours en ligne et multitache confortable.'
    }
  },
  'Solar Rechargeable LED Lamp': {
    fr: {
      name: 'Lampe LED solaire rechargeable',
      description: 'Lampe LED lumineuse avec recharge solaire pour maisons, boutiques, bureaux et eclairage de secours.'
    }
  }
};

async function syncStarterProductTranslations(client) {
  for (const [name, translations] of Object.entries(starterTranslations)) {
    await client.query(
      `UPDATE products
       SET translations = $1::jsonb, updated_at = NOW()
       WHERE name = $2 AND (translations IS NULL OR translations = '{}'::jsonb)`,
      [JSON.stringify(translations), name]
    );
  }
}

async function seedStarterProducts(client) {
  const marker = await client.query("SELECT 1 FROM settings WHERE key = 'starter_products_seeded_v1'");
  if (marker.rowCount > 0) {
    await syncStarterProductTranslations(client);
    return;
  }

  for (const product of starterProducts) {
    await client.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [product.category]
    );

    await client.query(
      `INSERT INTO products (
        name, description, price, stock, category, is_new, most_ordered,
        available_regions, image_url, images, translations
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)`,
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
        JSON.stringify(product.images),
        JSON.stringify(starterTranslations[product.name] || {})
      ]
    );
  }

  await syncStarterProductTranslations(client);

  await client.query(
    `INSERT INTO settings (key, value) VALUES ('starter_products_seeded_v1', 'true')
     ON CONFLICT (key) DO NOTHING`
  );
}

async function seedAdditionalProducts(client) {
  const marker = await client.query("SELECT 1 FROM settings WHERE key = 'starter_products_seeded_v2'");
  if (marker.rowCount > 0) {
    await syncStarterProductTranslations(client);
    return;
  }

  for (const product of additionalProducts) {
    await client.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [product.category]
    );

    await client.query(
      `INSERT INTO products (
        name, description, price, stock, category, is_new, most_ordered,
        available_regions, image_url, images, translations
      )
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1)`,
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
        JSON.stringify(product.images),
        JSON.stringify(starterTranslations[product.name] || {})
      ]
    );
  }

  await syncStarterProductTranslations(client);

  await client.query(
    `INSERT INTO settings (key, value) VALUES ('starter_products_seeded_v2', 'true')
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
        translations JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        customer_name VARCHAR(120),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
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
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer_email_lower ON orders (LOWER(buyer_email))');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone ON orders (buyer_phone)');
    await client.query("CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone_digits ON orders ((regexp_replace(buyer_phone, '\\D', '', 'g')))");
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created ON product_reviews (product_id, created_at DESC)');
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
    await seedAdditionalProducts(client);

    const adminPasswordHash = await resolveAdminPasswordHash();
    if (process.env.ADMIN_EMAIL && adminPasswordHash) {
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
          adminPasswordHash,
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
      console.warn('ADMIN_EMAIL and ADMIN_PASSWORD_HASH or ADMIN_PASSWORD are required to create the super admin.');
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
