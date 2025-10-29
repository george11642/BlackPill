# Load environment variables from backend/.env
$envPath = ".\backend\.env"
if (-Not (Test-Path $envPath)) {
    Write-Error "backend/.env file not found!"
    exit 1
}

Write-Host "Loading environment variables from backend/.env..." -ForegroundColor Cyan

# Read the .env file and set environment variables
Get-Content $envPath | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
    if ($_ -match '^(.+?)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Verify required Supabase variables are set
$requiredVars = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if (-Not $value) {
        $missingVars += $var
        Write-Host "[ERROR] Missing: $var" -ForegroundColor Red
    } else {
        # Show masked value for security
        $masked = $value.Substring(0, [Math]::Min(10, $value.Length)) + "***"
        Write-Host "[OK] Loaded: $var = $masked" -ForegroundColor Green
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "Missing required environment variables: $($missingVars -join ', ')"
    exit 1
}

Write-Host ""
Write-Host "Running Supabase migrations..." -ForegroundColor Cyan
Write-Host ""

# Extract project ref from SUPABASE_URL (format: https://PROJECTREF.supabase.co)
$supabaseUrl = [Environment]::GetEnvironmentVariable("SUPABASE_URL")
if ($supabaseUrl -match 'https://([a-z0-9]+)\.supabase\.co') {
    $projectRef = $matches[1]
    Write-Host "Project ref: $projectRef" -ForegroundColor Yellow
    
    # Link the project first
    Write-Host "Linking Supabase project..." -ForegroundColor Cyan
    npx supabase link --project-ref $projectRef
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to link project" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Error "Could not extract project ref from SUPABASE_URL"
    exit 1
}

# Run the migrations using Supabase CLI
npx supabase db push --linked --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Migrations failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
