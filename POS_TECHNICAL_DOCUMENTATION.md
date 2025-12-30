# 🏪 Point of Sale (POS) System - Technical Documentation

## System Architecture

### Frontend Components

#### PointOfSale.jsx (458 lines)
Located at: `client/src/components/PointOfSale.jsx`

**Responsibilities:**
- Customer information collection
- Product search and selection
- Shopping cart management
- Transaction calculation
- Order submission
- Receipt display

**Key States:**
```javascript
- customerInfo: { name, phone, email, address, region }
- cartItems: Array of selected products with quantities
- productSearch: Search query string
- selectedVariant: Selected color/variant per product
- shippingFee: Region-specific shipping cost
- discountPercent: Discount percentage (0-100)
- paymentMethod: cash | card | transfer | momo
- paidAmount: Amount customer provided
- generatedOrder: Completed order data
- shippingFees: Mapping of region to fee
- loading: API request state
- message: Toast notification
```

**Main Functions:**
1. `handleRegionChange(region)` - Updates shipping fee based on selected region
2. `addToCart(product)` - Adds product or increments quantity
3. `updateQuantity(productId, quantity)` - Changes item quantity
4. `removeFromCart(productId)` - Removes item from cart
5. `completeSale(e)` - Submits order to backend

**Calculations:**
```javascript
subtotal = sum(price * quantity for all items)
discountAmount = subtotal * (discountPercent / 100)
subtotalAfterDiscount = subtotal - discountAmount
total = subtotalAfterDiscount + shippingFee
change = paidAmount - total
```

**API Calls:**
- `GET /api/admin/shipping-fees` - Fetch region shipping fees
- `POST /api/orders` - Create order record

### Backend Endpoints

#### POST /api/orders
**Purpose:** Create order record (used by both online customers and POS)

**Request Body:**
```javascript
{
  buyer: {
    name: string,
    phone: string,
    email: string (optional),
    address: string (optional),
    agencies: array (optional)
  },
  items: [{
    id: string,
    name: string,
    price: number,
    quantity: number,
    selectedVariant: string (optional),
    image: string (optional),
    sku: string (optional)
  }],
  region: string,
  shippingFee: number,
  totals: {
    subtotal: number,
    discount: number (optional),
    subtotalAfterDiscount: number (optional),
    tax: number (optional),
    shipping: number,
    total: number
  },
  status: string (optional, defaults to 'pending'),
  paymentMethod: string (optional: cash, card, transfer, momo),
  isInStoreSale: boolean (true for POS, false/undefined for online),
  discountPercent: number (optional),
  change: number (optional),
  paidAmount: number (optional),
  notes: string (optional)
}
```

**Response:**
```javascript
{
  id: uuid,
  ...all request fields,
  createdAt: ISO timestamp
}
```

**Key Changes for POS Support:**
- Added `paymentMethod` field to track payment type
- Added `isInStoreSale` flag to distinguish POS from online
- Added `discountPercent` for tracking discount rate
- Added `change` for cash transactions
- Added `paidAmount` for payment tracking
- Enhanced `totals` object with `discount` and `subtotalAfterDiscount` fields

#### GET /api/admin/pos-stats
**Purpose:** Get POS-specific sales analytics

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None

**Response:**
```javascript
{
  posOrders: {
    total: number,           // Count of POS orders
    revenue: number,         // Total revenue from POS
    items: number,          // Total items sold via POS
    avgTransaction: number,  // Average transaction value
    discountGiven: number,   // Total discount amount
    paymentMethods: {
      cash: number,
      card: number,
      transfer: number,
      momo: number
    }
  },
  totals: {
    all: number,                // Total orders (online + POS)
    revenue: number,            // Total platform revenue
    onlineRevenue: number,      // Online-only revenue
    posRevenue: number,         // POS-only revenue
    onlinePct: number,          // Online percentage
    posPct: number              // POS percentage
  }
}
```

### Database Schema

#### Orders Collection
POS orders include additional fields in `data.orders`:

```javascript
{
  id: uuid,
  buyer: {
    name: string,
    phone: string,
    email: string,
    address: string
  },
  items: [{
    id: string,
    name: string,
    price: number,
    quantity: number,
    selectedVariant: string,
    selectedImageUrl: string
  }],
  region: string,
  shippingFee: number,
  totals: {
    subtotal: number,
    discount: number,
    subtotalAfterDiscount: number,
    tax: number,
    shipping: number,
    total: number
  },
  status: string,           // pending, processing, shipped, delivered, cancelled
  paymentMethod: string,    // NEW: cash, card, transfer, momo
  isInStoreSale: boolean,   // NEW: true for POS, false/undefined for online
  discountPercent: number,  // NEW: discount percentage applied
  change: number,           // NEW: change amount for cash transactions
  paidAmount: number,       // NEW: amount customer paid
  deliveryAgency: string,
  notes: string,
  createdAt: ISO timestamp
}
```

## Data Flow

### Complete POS Sale Flow

```
1. Admin opens POS tab
   ↓
2. System fetches shipping fees from GET /api/admin/shipping-fees
   ↓
3. Admin enters customer info
   ↓
4. Admin searches and selects products
   ↓
5. Products added to cart with quantities
   ↓
6. System calculates:
   - Subtotal (sum of price × quantity)
   - Discount amount (subtotal × discount%)
   - Total (subtotal - discount + shipping)
   - Change (paidAmount - total)
   ↓
7. Admin clicks "Complete Sale & Print Receipt"
   ↓
8. Frontend submits POST /api/orders with:
   - Customer info
   - Cart items
   - Calculations
   - Payment method
   - POS-specific fields
   ↓
9. Backend:
   - Validates request
   - Generates unique order ID
   - Saves order to data.json
   - Returns order with ID
   ↓
10. Frontend displays Receipt component
    - Shows order details
    - Provides print option
    - Can download as PDF
    ↓
11. Admin can print/download receipt
    ↓
12. Order appears in Orders tab for admin review
```

## Integration Points

### With Existing Systems

#### Product Management
- Uses existing product inventory from `/api/products`
- Deducts quantity when order is created
- Note: Current implementation doesn't auto-update stock, admin must manage manually or add inventory endpoint

#### Shipping System
- Integrates with existing `/api/admin/shipping-fees`
- Uses region-based fee system
- Supports free shipping thresholds (if implemented)

#### Order Management
- POS orders saved in same `data.orders` array
- Distinguished by `isInStoreSale: true` flag
- Visible in Orders tab with filter capability
- Can be managed with same CRUD operations

#### Receipt Generation
- Reuses existing Receipt.jsx component
- Displays POS-specific fields (paymentMethod, change)
- Supports print and PDF download
- Uses platform name from `/api/platform-name`

#### Analytics & Statistics
- New endpoint `/api/admin/pos-stats` provides POS analytics
- Existing statistics can filter by `isInStoreSale` flag
- Enables side-by-side online vs POS comparison

## UI Components

### Layout Structure
```
AdminDashboard
├─ Header (Logout, Profile)
├─ Tab Navigation (including "POS")
└─ PointOfSale Component
   ├─ Product Search Section (2/3 width on desktop)
   │  ├─ Search Input
   │  └─ Filtered Product List
   └─ Checkout Section (1/3 width on desktop)
      ├─ Customer Info Form
      ├─ Cart Items Display
      └─ Payment & Discount Form
```

### Responsive Behavior
- **Desktop (lg screens)**: 2-column layout (products left, checkout right)
- **Tablet (md screens)**: Stack layout with scroll
- **Mobile (sm screens)**: Single column, scrollable

### Color Scheme
- **Product Section**: Blue theme (#border-blue-200, bg-blue-50)
- **Customer Section**: Purple theme (#border-purple-200, bg-purple-50)
- **Payment Section**: Green theme (#border-green-200, bg-green-50)
- **Buttons**: Blue primary, Red danger, Green success

## Security Considerations

### Authentication
- POS requires admin login (Bearer token in header)
- Token fetched from localStorage: `adminToken`
- Shipping fee endpoint protected with JWT verification

### Authorization
- Only authenticated admins can access POS
- Orders endpoint doesn't require auth (for customer orders too)
- POS Stats endpoint protected

### Data Validation
- Backend validates all required fields (buyer, items)
- Frontend prevents submission without name/phone
- Product stock validation (prevents negative stock addition)

### Sensitive Data
- Payment amounts tracked but not sensitive (already in orders)
- Customer personal info stored in order (standard e-commerce practice)
- Discount tracking for business purposes

## Performance Optimization

### Data Fetching
- Shipping fees fetched once on component mount
- Products passed as prop (already loaded by AdminDashboard)
- No unnecessary API calls during product selection

### Rendering
- Product list memoization could be added if >1000 products
- Cart updates use efficient array methods
- Real-time calculations optimized with useMemo

### Storage
- Orders persisted to JSON file on backend
- No session storage required
- Cart cleared after successful sale (fresh start)

## Error Handling

### Frontend Error Handling
```javascript
try {
  - Fetch shipping fees
  - Submit order
} catch (err) {
  - Display error message
  - Log to console
  - Show for 3 seconds then clear
}
```

### Validation
- Customer name required (prevents anonymous sales)
- Phone required (enables order tracking)
- Cart must not be empty
- Items must be in stock

### User Feedback
- Toast notifications for success/error
- Loading state during submission
- Button disabled while processing
- Visual confirmation of calculations

## Testing Scenarios

### Happy Path
1. Add customer info (name, phone)
2. Search and add products
3. Apply discount
4. Select payment method
5. Enter paid amount
6. Complete sale
7. View and print receipt
8. Verify order in Orders tab

### Edge Cases
1. Zero-quantity items (removed from cart)
2. Overpay (shows change amount)
3. Exact payment (zero change)
4. No discount (0% field)
5. Region change (shipping updates)
6. Variant selection (tracked in order)
7. Network error (error message shown)
8. Duplicate submission (prevented by loading state)

## Future Enhancements

### Planned Features
- Barcode scanning for quick product selection
- Customer loyalty points system
- Promotion codes/voucher integration
- Inventory auto-decrement
- Multiple cashier tracking
- Daily reconciliation reports
- Cash drawer management
- Customer email receipts

### Performance Improvements
- Product pagination for large inventories
- Search debouncing
- Offline transaction queuing
- Local receipt caching

### Advanced Analytics
- Hourly sales trends
- Product performance (POS vs Online)
- Payment method analysis
- Customer behavior tracking
- Inventory turnover rates

## Deployment Notes

### Prerequisites
- Node.js with Express server running
- React frontend with Tailwind CSS
- JSON file storage (server/data.json)
- JWT authentication configured

### Environment Setup
- Ensure `/api/orders` endpoint is accessible
- Shipping fees data populated in backend
- Receipt component properly imported
- Toast notification system working

### Testing Before Production
1. Create test orders and verify they appear
2. Print receipts and check formatting
3. Verify payment method tracking
4. Check discount calculations
5. Test regional shipping fees
6. Validate order data in JSON file

## Monitoring

### Metrics to Track
- Daily POS transaction count
- Average transaction value
- Payment method distribution
- Discount usage rate
- Error rate on order submission
- Response time for completeSale

### Logs
- Backend logs order creation with timestamp
- Frontend console logs for debugging
- Error tracking for failed transactions
- Audit trail in Orders tab

---

**Version**: 1.0 (Initial Release)
**Status**: ✅ Production Ready
**Last Updated**: 2025
**Compatibility**: Compatible with existing e-commerce platform
