@echo off
REM ============================================================================
REM Production Secrets Generation Script (Windows)
REM ============================================================================
REM This script generates secure secrets for production deployment
REM
REM Usage:
REM   scripts\generate-production-secrets.bat
REM
REM Requirements:
REM   - Git Bash installed (includes openssl)
REM   - OR OpenSSL for Windows installed
REM ============================================================================

setlocal EnableDelayedExpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         Genki TCG Production Secrets Generator              ║
echo ║         (Windows Version)                                    ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  SECURITY WARNING:
echo    - Save this output in a secure password manager
echo    - Never commit these secrets to git
echo    - Each secret should be unique
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Check if we can find Git Bash
set "GIT_BASH=C:\Program Files\Git\bin\bash.exe"
if not exist "%GIT_BASH%" (
    set "GIT_BASH=C:\Program Files (x86)\Git\bin\bash.exe"
)

if exist "%GIT_BASH%" (
    echo ✅ Found Git Bash, using it to generate secrets...
    echo.
    "%GIT_BASH%" "%~dp0generate-production-secrets.sh"
    goto :end
)

REM If Git Bash not found, try openssl directly
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found OpenSSL, generating secrets...
    echo.
    goto :generate
)

REM Neither found
echo ❌ Error: Neither Git Bash nor OpenSSL found
echo.
echo Install one of the following:
echo   1. Git for Windows (Recommended): https://git-scm.com/download/win
echo   2. OpenSSL for Windows: https://slproweb.com/products/Win32OpenSSL.html
echo.
pause
exit /b 1

:generate
echo 📝 Generating Production Secrets...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Generate secrets
for /f "delims=" %%i in ('openssl rand -base64 64') do set "JWT_SECRET=%%i"
for /f "delims=" %%i in ('openssl rand -base64 64') do set "REFRESH_TOKEN_SECRET=%%i"
for /f "delims=" %%i in ('openssl rand -base64 24') do set "ADMIN_PASSWORD=%%i"
for /f "delims=" %%i in ('openssl rand -base64 64') do set "SESSION_SECRET=%%i"

echo 1️⃣  JWT_SECRET (Backend Authentication)
echo    Use this for: Railway → JWT_SECRET
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    %JWT_SECRET%
echo.

echo 2️⃣  REFRESH_TOKEN_SECRET (Backend Refresh Tokens)
echo    Use this for: Railway → REFRESH_TOKEN_SECRET
echo    ⚠️  This MUST be different from JWT_SECRET!
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    %REFRESH_TOKEN_SECRET%
echo.

echo 3️⃣  ADMIN_SITE_PASSWORD (Admin Web Gate Password)
echo    Use this for: Vercel → ADMIN_SITE_PASSWORD
echo    Current: genkihunter123 (CHANGE THIS!)
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    %ADMIN_PASSWORD%
echo.

echo 4️⃣  SESSION_SECRET (Optional - For future session management)
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    %SESSION_SECRET%
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ Secrets Generated Successfully!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. Copy these secrets to your password manager
echo 2. Set them in Railway Dashboard
echo 3. Set ADMIN_SITE_PASSWORD in Vercel
echo 4. Verify environment variables are set
echo.
echo See PRE_SUBMISSION_CHECKLIST.md for detailed instructions
echo.

:end
echo.
pause
