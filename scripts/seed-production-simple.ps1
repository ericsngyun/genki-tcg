# Simple Railway Database Seed Script
# Run this from the monorepo root

Write-Host "🌱 Seeding Railway Database..." -ForegroundColor Cyan
Write-Host ""

# Method 1: Using Railway Shell (Recommended)
Write-Host "📋 Method 1: Railway Dashboard Shell" -ForegroundColor Yellow
Write-Host "1. Go to: https://railway.app/" -ForegroundColor White
Write-Host "2. Click on your project" -ForegroundColor White
Write-Host "3. Click 'backend' service" -ForegroundColor White
Write-Host "4. Click 'Shell' tab at the top" -ForegroundColor White
Write-Host "5. Run this command:" -ForegroundColor White
Write-Host "   npm run db:seed --workspace=apps/backend" -ForegroundColor Green
Write-Host ""

# Method 2: Get DATABASE_URL and run locally
Write-Host "📋 Method 2: Run Locally with Railway Database URL" -ForegroundColor Yellow
Write-Host "1. Get your DATABASE_URL from Railway:" -ForegroundColor White
Write-Host "   - Go to Railway Dashboard" -ForegroundColor White
Write-Host "   - Click 'backend' service" -ForegroundColor White
Write-Host "   - Click 'Variables' tab" -ForegroundColor White
Write-Host "   - Copy the DATABASE_URL value" -ForegroundColor White
Write-Host ""
Write-Host "2. Run this command (replace <URL> with your actual URL):" -ForegroundColor White
Write-Host '   $env:DATABASE_URL="<YOUR_URL>"; node scripts/seed-railway.js' -ForegroundColor Green
Write-Host ""

Write-Host "💡 Tip: Method 1 (Railway Shell) is easiest!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
