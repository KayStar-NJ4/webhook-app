@echo off
REM Turbo Chatwoot Webhook - Production Setup Script for Windows
REM This script helps you set up the production environment quickly

echo 🚀 Turbo Chatwoot Webhook - Production Setup
echo =============================================

REM Get current directory
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

REM Create project directory
set PROD_DIR=%USERPROFILE%\workplace\vision_lab\webhook\staging
echo [STEP] Creating project directory: %PROD_DIR%

if not exist "%PROD_DIR%" mkdir "%PROD_DIR%"
cd /d "%PROD_DIR%"

REM Create necessary subdirectories
echo [INFO] Creating necessary directories...
if not exist "nginx\html" mkdir "nginx\html"
if not exist "nginx\ssl" mkdir "nginx\ssl"
if not exist "backup" mkdir "backup"
if not exist "logs" mkdir "logs"

REM Copy configuration files
echo [STEP] Setting up configuration files...

REM Copy docker-compose.prod.yml
if exist "%PROJECT_DIR%\docker-compose.prod.yml" (
    copy "%PROJECT_DIR%\docker-compose.prod.yml" "docker-compose.prod.yml"
    echo [INFO] Copied docker-compose.prod.yml
) else (
    echo [ERROR] docker-compose.prod.yml not found in project directory
    pause
    exit /b 1
)

REM Copy environment template
if exist "%PROJECT_DIR%\env.production.template" (
    copy "%PROJECT_DIR%\env.production.template" ".env"
    echo [INFO] Copied environment template to .env
    echo [WARNING] Please edit .env file with your actual configuration values
) else (
    echo [ERROR] env.production.template not found in project directory
    pause
    exit /b 1
)

REM Copy Nginx configuration
if exist "%PROJECT_DIR%\nginx\nginx.prod.conf" (
    if not exist "nginx" mkdir "nginx"
    copy "%PROJECT_DIR%\nginx\nginx.prod.conf" "nginx\nginx.conf"
    echo [INFO] Copied Nginx configuration
    echo [WARNING] Please update nginx\nginx.conf with your domain name
) else (
    echo [ERROR] nginx\nginx.prod.conf not found in project directory
    pause
    exit /b 1
)

echo [STEP] Configuration files created successfully!

REM Display next steps
echo.
echo 📋 Next Steps:
echo ==============
echo.
echo 1. Edit the .env file with your actual configuration:
echo    notepad .env
echo.
echo 2. Update Nginx configuration with your domain:
echo    notepad nginx\nginx.conf
echo.
echo 3. Login to GitHub Container Registry:
echo    echo YOUR_GITHUB_TOKEN ^| docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
echo.
echo 4. Pull the latest Docker image:
echo    docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest
echo.
echo 5. Start the services:
echo    docker compose -f docker-compose.prod.yml up -d
echo.
echo 6. Run database migrations:
echo    docker compose -f docker-compose.prod.yml exec -T webhook-app yarn migrate
echo.
echo 7. Check the health endpoint:
echo    curl -f http://localhost:3000/webhook/health
echo.
echo 📖 For detailed instructions, see: MANUAL_DEPLOYMENT_GUIDE.md
echo.

echo [INFO] Setup completed! 🎉
pause
