#!/bin/bash

# Test script to verify category update API works
# Run this after dev server is running

echo "🧪 Testing Category Update API"
echo "=================================="
echo ""

# Replace with actual vendor ID from your database
VENDOR_ID="f089b49d-77e3-4549-b76d-4568d6cc4f94"

echo "Testing PUT /api/vendor/update-categories"
echo "Endpoint: http://localhost:3000/api/vendor/update-categories"
echo "Vendor ID: $VENDOR_ID"
echo ""

# Test request
curl -X PUT http://localhost:3000/api/vendor/update-categories \
  -H "Content-Type: application/json" \
  -d "{
    \"vendorId\": \"$VENDOR_ID\",
    \"primaryCategorySlug\": \"architectural_design\",
    \"secondaryCategories\": [\"building_design_services\"]
  }" 2>&1

echo ""
echo ""
echo "✅ Check the response above:"
echo "  - Status: 200 (not 405)"
echo "  - success: true"
echo "  - data.primaryCategorySlug: architectural_design"
echo ""
