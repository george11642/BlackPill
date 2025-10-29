# PowerShell script to run migration 007
# This script helps execute the subscription schema fix migration

Write-Host "🚀 Black Pill - Running Migration 007: Fix Subscriptions Schema" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase/migrations/007_fix_subscriptions_schema.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""
Write-Host "📋 This migration will:" -ForegroundColor Yellow
Write-Host "   1. Add 'source' column to subscriptions table (app/web tracking)"
Write-Host "   2. Make user_id nullable (for web flow subscriptions)"
Write-Host "   3. Create index on source column for analytics"
Write-Host ""

$migrationContent = Get-Content $migrationFile -Raw

Write-Host "📄 Migration SQL:" -ForegroundColor Cyan
Write-Host "─" * 60
Write-Host $migrationContent
Write-Host "─" * 60
Write-Host ""

Write-Host "⚠️  IMPORTANT: You need to run this migration manually in Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor Cyan
Write-Host "   1. Go to https://supabase.com/dashboard"
Write-Host "   2. Select your project"
Write-Host "   3. Click 'SQL Editor' in the left sidebar"
Write-Host "   4. Click 'New Query'"
Write-Host "   5. Copy and paste the SQL above"
Write-Host "   6. Click 'Run' (or press Ctrl+Enter)"
Write-Host ""
Write-Host "The migration file is saved at: $migrationFile" -ForegroundColor Green
Write-Host ""
Write-Host "After running, verify:" -ForegroundColor Cyan
Write-Host "   - subscriptions table has source column"
Write-Host "   - user_id column allows NULL values"
Write-Host "   - Index idx_subscriptions_source exists"
Write-Host ""

