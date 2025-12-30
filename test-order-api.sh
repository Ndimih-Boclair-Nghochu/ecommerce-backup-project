#!/bin/bash

# Test Order Management API Endpoints

echo "🔍 Testing Order Management API..."
echo ""

# 1. Test if server is running
echo "1️⃣  Checking if server is running on port 4000..."
curl -s http://127.0.0.1:4000/api/admin/orders -H "Authorization: Bearer invalid" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Server is running"
else
  echo "❌ Server is NOT running - Start with: npm run dev"
  exit 1
fi

echo ""
echo "2️⃣  Testing GET /api/admin/orders endpoint..."
RESPONSE=$(curl -s http://127.0.0.1:4000/api/admin/orders)
if echo "$RESPONSE" | grep -q "Unauthorized"; then
  echo "✅ Endpoint exists (requires token)"
else
  echo "⚠️  Response: $RESPONSE"
fi

echo ""
echo "3️⃣  Testing API with valid token..."
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTYwMzEwODMyNX0.zzzzzzz"

ORDERS=$(curl -s http://127.0.0.1:4000/api/admin/orders -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ORDERS" | grep -q "id"; then
  COUNT=$(echo "$ORDERS" | grep -o '"id"' | wc -l)
  echo "✅ Got orders! Found $COUNT orders in response"
else
  echo "❌ No orders found - Check if data.json has orders"
fi

echo ""
echo "📝 Diagnostic Complete"
