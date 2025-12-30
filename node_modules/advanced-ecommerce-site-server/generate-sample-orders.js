const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const dataFile = path.join(__dirname, 'data.json');
let data = JSON.parse(fs.readFileSync(dataFile));

const towns = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Buea', 'Limbe'];
const firstNames = ['Jean', 'Marie', 'Paul', 'Pierre', 'Sophie', 'André', 'Claude', 'François', 'Anne', 'Luc'];
const lastNames = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Richard', 'Leclerc', 'Moreau', 'Simon', 'Laurent'];

const generatePhoneNumber = () => {
  return `+237 ${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;
};

const generateEmail = (firstName, lastName) => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.cm`;
};

const generateSampleOrders = (count = 150) => {
  const orders = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Generate date within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(orderDate.getHours() - hoursAgo);
    orderDate.setMinutes(orderDate.getMinutes() - minutesAgo);

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const town = towns[Math.floor(Math.random() * towns.length)];

    // Generate 1-5 items per order
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = data.products[Math.floor(Math.random() * data.products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = product.price || 10000;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      items.push({
        id: product.id,
        name: product.name,
        price: price,
        quantity: quantity,
        selectedVariant: null,
        selectedImageUrl: product.image || null
      });
    }

    const shippingFee = data.shippingFees[town] || 0;
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const total = subtotal + shippingFee + tax;

    const order = {
      id: uuid(),
      buyer: {
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName),
        phone: generatePhoneNumber(),
        address: `${Math.floor(Math.random() * 1000) + 1} Rue de ${['la Paix', 'la Liberté', 'l\'Indépendance', 'la République'][Math.floor(Math.random() * 4)]}, ${town}`,
        agencies: []
      },
      region: town,
      shippingFee: shippingFee,
      items: items,
      totals: {
        subtotal: subtotal,
        tax: tax,
        total: total
      },
      status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
      deliveryAgency: '',
      notes: '',
      createdAt: orderDate.toISOString()
    };

    orders.push(order);
  }

  return orders;
};

// Generate sample orders
const sampleOrders = generateSampleOrders(150);

// Add them to the data
data.orders = sampleOrders;

// Save the updated data
fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

console.log(`✅ Generated ${sampleOrders.length} sample orders`);
console.log('Sample orders distributed across:');
const townCounts = {};
sampleOrders.forEach(order => {
  townCounts[order.region] = (townCounts[order.region] || 0) + 1;
});
Object.entries(townCounts).forEach(([town, count]) => {
  console.log(`  ${town}: ${count} orders`);
});

console.log(`📊 Total Revenue: XAF ${sampleOrders.reduce((sum, order) => sum + order.totals.total, 0).toLocaleString()}`);
