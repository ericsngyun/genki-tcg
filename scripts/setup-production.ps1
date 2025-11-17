# Production Setup Script for Windows PowerShell
# This script seeds the Railway database and verifies the setup

Write-Host "🚀 Genki TCG Production Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
Write-Host "Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking Railway authentication..." -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    Write-Host "✅ Logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Railway. Please run:" -ForegroundColor Red
    Write-Host "   railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🌱 Seeding Railway Database..." -ForegroundColor Cyan
Write-Host "This will create:" -ForegroundColor Yellow
Write-Host "  - Organization: Genki TCG (invite code: GENKI)" -ForegroundColor White
Write-Host "  - Owner: owner@genki-tcg.com / password123" -ForegroundColor White
Write-Host "  - Staff: staff@genki-tcg.com / password123" -ForegroundColor White
Write-Host "  - 10 test players with 100 credits each" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running seed script..." -ForegroundColor Yellow

# Change to backend directory and run seed
Set-Location -Path "apps\backend"
railway run npm run db:seed

Write-Host ""
Write-Host "✅ Database seeding complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Email: owner@genki-tcg.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host "   Invite Code: GENKI" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testing authentication..." -ForegroundColor Yellow

# Test login
$loginBody = @{
    email = "owner@genki-tcg.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://genki-tcg-production.up.railway.app/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "✅ Authentication successful!" -ForegroundColor Green
    Write-Host "   Token obtained: $($response.access_token.Substring(0,20))..." -ForegroundColor White
    Write-Host ""

    Write-Host "🎉 Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Start admin web: npm run dev:admin" -ForegroundColor White
    Write-Host "  2. Open http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Login with owner@genki-tcg.com / password123" -ForegroundColor White

} catch {
    Write-Host "⚠️  Could not verify authentication" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "This might be normal if the seed just ran." -ForegroundColor Yellow
    Write-Host "Try logging in via the admin web app." -ForegroundColor Yellow
}

Write-Host ""
