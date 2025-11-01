#!/bin/bash

# Script to add required redirect URLs to Supabase
# Usage: ./scripts/add_supabase_redirect_urls.sh [SUPABASE_ACCESS_TOKEN]

PROJECT_ID="wzsxpxwwgaqiaoxdyhnf"
API_URL="https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth"

# Get access token from argument or environment variable
ACCESS_TOKEN="${1:-${SUPABASE_ACCESS_TOKEN}}"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: Supabase access token required"
  echo "Usage: $0 [SUPABASE_ACCESS_TOKEN]"
  echo "Or set SUPABASE_ACCESS_TOKEN environment variable"
  echo ""
  echo "To get your access token:"
  echo "1. Go to https://app.supabase.com/account/tokens"
  echo "2. Create a new access token"
  exit 1
fi

echo "🔗 Adding redirect URLs to Supabase project: $PROJECT_ID"
echo ""

# Required redirect URLs
REDIRECT_URLS=(
  "blackpill://auth/callback"
  "blackpill://subscribe/success"
  "blackpill://ref/*"
  "https://wzsxpxwwgaqiaoxdyhnf.supabase.co/auth/v1/callback"
  "https://black-pill.app/auth/v1/callback"
  "https://localhost:3000/auth/v1/callback"
)

# Convert array to JSON array
JSON_URLS=$(printf '%s\n' "${REDIRECT_URLS[@]}" | jq -R . | jq -s .)

# Make API request
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"redirect_urls\": $JSON_URLS
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 204 ]; then
  echo "✅ Successfully added redirect URLs!"
  echo ""
  echo "Added URLs:"
  for url in "${REDIRECT_URLS[@]}"; do
    echo "  - $url"
  done
else
  echo "❌ Error: Failed to add redirect URLs"
  echo "HTTP Status: $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

