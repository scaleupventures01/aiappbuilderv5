@echo off
REM Elite Trading Coach AI - Test Server Startup Script (Windows)
REM This script starts the server in test mode with mock OpenAI enabled
REM Created: 2025-08-15

echo 🚀 Elite Trading Coach AI - Starting Test Server
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM Set environment to development
set NODE_ENV=development

REM Check if .env.development exists
if not exist ".env.development" (
    echo ❌ .env.development file not found!
    echo    Creating minimal .env.development for testing...
    
    (
        echo # Minimal configuration for testing
        echo NODE_ENV=development
        echo PORT=3001
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Mock mode enabled - no real API key needed
        echo USE_MOCK_OPENAI=true
        echo OPENAI_MODEL=gpt-4-vision-preview
        echo OPENAI_MAX_TOKENS=500
        echo OPENAI_TEMPERATURE=0.7
        echo.
        echo # JWT ^(development only^)
        echo JWT_SECRET=test-jwt-secret-not-for-production
        echo.
        echo # Database ^(optional for chart analysis testing^)
        echo DATABASE_URL=postgresql://test:test@localhost:5432/test_db
        echo.
        echo # Rate limiting ^(permissive for testing^)
        echo RATE_LIMIT_WINDOW=15
        echo RATE_LIMIT_MAX=1000
    ) > .env.development
    
    echo ✅ Created .env.development with test configuration
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Configuration:
echo    • Environment: development
echo    • Port: 3001
echo    • Mock OpenAI: enabled
echo    • Test endpoint: /api/test-analyze-trade
echo.

echo 🌟 Starting server...
echo    • Chart analysis test page: http://localhost:3001/api/test-analyze-trade
echo    • Health check: http://localhost:3001/health
echo    • OpenAI health: http://localhost:3001/health/openai
echo.

REM Start the server with development environment
npm run start:dev

REM If that fails, try with node directly
if errorlevel 1 (
    echo ⚠️  npm start:dev failed, trying with node directly...
    node server.js
)

pause