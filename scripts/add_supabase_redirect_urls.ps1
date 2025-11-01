# PowerShell script to add required redirect URLs to Supabase
# Usage: .\scripts\add_supabase_redirect_urls.ps1 [SUPABASE_ACCESS_TOKEN]

$PROJECT_ID = "wzsxpxwwgaqiaoxdyhnf"
$API_URL = "https://api.supabase.com/v1/projects/$PROJECT_ID/config/auth"

# Get access token from argument or environment variable
$ACCESS_TOKEN = if ($args[0]) { $args[0] } else { $env:SUPABASE_ACCESS_TOKEN }

if ([string]::IsNullOrEmpty($ACCESS_TOKEN)) {
    Write-Host "❌ Error: Supabase access token required" -ForegroundColor Red
    Write-Host "Usage: .\scripts\add_supabase_redirect_urls.ps1 [SUPABASE_ACCESS_TOKEN]"
    Write-Host "Or set SUPABASE_ACCESS_TOKEN environment variable"
    Write-Host ""
    Write-Host "To get your access token:"
    Write-Host "1. Go to https://app.supabase.com/account/tokens"
    Write-Host "2. Create a new access token"
    exit 1
}

Write-Host "🔗 Adding redirect URLs to Supabase project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host ""

# Required redirect URLs
$REDIRECT_URLS = @(
    "blackpill://auth/callback",
    "blackpill://subscribe/success",
    "blackpill://ref/*",
    "https://wzsxpxwwgaqiaoxdyhnf.supabase.co/auth/v1/callback",
    "https://black-pill.app/auth/v1/callback",
    "https://localhost:3000/auth/v1/callback"
)

# Convert to JSON
$body = @{
    redirect_urls = $REDIRECT_URLS
} | ConvertTo-Json

# Make API request
$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method PATCH -Headers $headers -Body $body
    
    Write-Host "✅ Successfully added redirect URLs!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Added URLs:"
    foreach ($url in $REDIRECT_URLS) {
        Write-Host "  - $url"
    }
} catch {
    Write-Host "❌ Error: Failed to add redirect URLs" -ForegroundColor Red
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}

