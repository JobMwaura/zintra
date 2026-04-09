#!/bin/bash

# Reset Supabase SMTP Configuration via API
# This script resets SMTP settings to use Supabase's default email service

echo "🔄 Resetting Supabase SMTP Configuration..."
echo ""

# Check if access token is provided
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set"
    echo ""
    echo "📋 To get your access token:"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Create a new token or copy existing one"
    echo "3. Run this script with: SUPABASE_ACCESS_TOKEN=your_token ./reset-smtp-supabase.sh"
    echo ""
    echo "📱 Alternative (easier): Use Supabase Dashboard"
    echo "1. Go to: https://supabase.com/dashboard/project/zeomgqlnztcdqtespsjx/settings/auth"
    echo "2. Toggle OFF 'Enable custom SMTP server'"
    echo "3. Save changes"
    echo ""
    exit 1
fi

# Project ID
PROJECT_ID="zeomgqlnztcdqtespsjx"

# API Endpoint
API_URL="https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth"

echo "🚀 Making API request to reset SMTP settings..."
echo "📡 Project ID: $PROJECT_ID"
echo ""

# Make the API request
response=$(curl -s -w "%{http_code}" -X PATCH "$API_URL" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": false,
    "smtp_admin_email": "",
    "smtp_host": null,
    "smtp_port": null,
    "smtp_user": null,
    "smtp_pass": null,
    "smtp_sender_name": null
  }')

# Extract HTTP status code (last 3 characters)
http_code="${response: -3}"
response_body="${response%???}"

echo "📊 Response Status: $http_code"

if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo "✅ SMTP settings reset successfully!"
    echo ""
    echo "📧 Your project now uses Supabase's default email service"
    echo "🔄 You can now configure EventsGear SMTP via Dashboard"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Go to: https://supabase.com/dashboard/project/zeomgqlnztcdqtespsjx/settings/auth"
    echo "2. Enable 'Custom SMTP server'"
    echo "3. Enter EventsGear settings:"
    echo "   Host: mail.eventsgear.co.ke"
    echo "   Port: 587"
    echo "   User: forgetpassword@eventsgear.co.ke"
    echo "   Pass: [your password]"
else
    echo "❌ Failed to reset SMTP settings"
    echo "📄 Response: $response_body"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "• Verify your access token is valid"
    echo "• Check if you have admin access to the project"
    echo "• Try using the Supabase Dashboard instead"
fi

echo ""
echo "✅ Script completed"