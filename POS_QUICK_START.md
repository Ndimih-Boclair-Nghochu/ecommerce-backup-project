# 🏪 Point of Sale (POS) System - Quick Start Guide

## Overview
The Point of Sale system enables in-store purchasing with professional receipt generation, integrated with your existing online platform.

## Accessing POS

1. Login to Admin Dashboard
2. Click on **🏪 POS** tab (between Products and Shipping)
3. You're ready to process in-store sales!

## How to Process a Sale

### Step 1: Customer Information
Fill in the customer details on the left panel:
- **Name** ✓ (required)
- **Phone** ✓ (required)
- Email (optional)
- Address (optional)
- **Region** (affects shipping fee)

### Step 2: Product Selection
1. Use the **Search** box to find products by name or SKU
2. Select product variants (color, size, etc.) if available
3. Click **Add** button to add to cart
4. Out-of-stock items are disabled automatically

### Step 3: Cart Management
View your selected items in the cart panel:
- **Edit Quantity**: Click the number field and change
- **Remove Item**: Click the ✕ button
- **Real-time Totals**: See subtotal as you add items

### Step 4: Discounts & Payment
1. **Discount**: Enter discount percentage (0-100%)
   - Automatically calculates discount amount
2. **Payment Method**: Select how customer paid:
   - 💵 Cash
   - 💳 Card
   - 🏦 Bank Transfer
   - 📱 Mobile Money
3. **Amount Paid**: Enter the amount customer provided
   - System auto-calculates change

### Step 5: Complete Sale
Click **✓ Complete Sale & Print Receipt**
- Receipt prints/displays automatically
- Order saved to database
- Inventory updated
- Invoice generated with all details

## Receipt Information

The receipt includes:
- Order ID and timestamp
- Customer information
- Itemized product list with prices
- Subtotal, discount, shipping, total
- Payment method and change
- Platform branding

### Printing Options:
- **Print**: Click "Print Receipt" in the receipt view
- **Download**: Click "Download as PDF"
- **Close**: Click "Close Receipt" to return to POS

## Features

### Product Search
- Search by product name or SKU
- Real-time filtering
- Stock availability shown
- Multiple color/variant options

### Inventory Management
- Stock levels displayed for each product
- Automatic deduction when sale completes
- Prevents overselling

### Shipping Options
- Regional shipping fees applied automatically
- Can be disabled for in-store pickup
- Configurable per region

### Discount System
- Percentage-based discounts
- Applied to subtotal before shipping
- Useful for promotions or negotiated prices

### Multiple Payment Methods
- Track cash transactions
- Record card/mobile money payments
- Generate reports by payment type

### Real-time Totals
- Live calculation of:
  - Subtotal
  - Discount amount
  - Shipping fee
  - Total due
  - Change owed

## Sales History

All POS sales are recorded in:
- **Orders Tab**: Shows all sales (online + in-store)
- **Statistics Tab**: View POS vs Online sales comparison
- Filter by status, date, or customer

## Advanced Features

### In-Store vs Online Tracking
- Each order marked as `isInStoreSale: true`
- Separate analytics for both channels
- Compare performance in statistics

### Daily Reconciliation
- Check Dashboard Overview for daily stats
- Monitor cash register totals
- Track payment method distribution

### Customer Records
- Builds customer database from POS sales
- Can enable follow-up communications
- Tracks customer preferences

## Tips & Tricks

**💡 Quick Tips:**
1. Keep frequently-bought items on favorites for faster selection
2. Use variants feature for color/size selection
3. Enable receipt printing for customer satisfaction
4. Check inventory regularly in Products tab
5. Use discounts strategically for promotions

**🎯 Best Practices:**
- Always confirm customer phone/email for order tracking
- Round shipping to convenient amounts
- Keep receipts organized for reconciliation
- Update stock levels regularly
- Review POS reports daily

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Products not showing | Refresh page or check Products tab |
| Stock not updating | Verify order saved, check Orders tab |
| Receipt won't print | Try PDF download option |
| Customer info error | Ensure name and phone are filled |
| Cart not adding items | Check if product is in stock |

## API Integration

The POS system automatically:
- ✅ Saves orders to database
- ✅ Updates inventory
- ✅ Generates unique order IDs
- ✅ Tracks payment methods
- ✅ Calculates shipping fees
- ✅ Applies discounts correctly

## Reports & Analytics

View POS-specific data in:
1. **Dashboard Overview**: Today's POS sales count and revenue
2. **Statistics Tab**: POS vs Online comparison
3. **Orders Tab**: Filter by `isInStoreSale` flag
4. **Admin → POS Stats**: Detailed POS analytics endpoint

## Keyboard Shortcuts

- **Tab**: Move between fields
- **Enter**: Search products or submit forms
- **Esc**: Close dialogs

## Contact & Support

For issues or feature requests:
- Check Orders tab for transaction history
- Verify inventory in Products tab
- Review chat messages for customer issues

---

**Status**: ✅ **Fully Operational**
**Last Updated**: 2025
**Version**: 1.0 (World-Class POS System)
