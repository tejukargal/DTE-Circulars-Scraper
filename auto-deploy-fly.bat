@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Auto-Deploying to Fly.io
echo ========================================
echo.

REM Set the path to flyctl
set FLYCTL_PATH=C:\Users\Lekhana\.fly\bin\flyctl.exe

REM Check if flyctl exists
if not exist "%FLYCTL_PATH%" (
    echo ERROR: Fly.io CLI not found at %FLYCTL_PATH%
    echo Please install Fly.io CLI first
    pause
    exit /b 1
)

echo Step 1: Building the application locally...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully
echo.

echo Step 2: Checking Fly.io authentication...
%FLYCTL_PATH% auth whoami >nul 2>&1
if !errorlevel! neq 0 (
    echo You need to login to Fly.io first.
    echo Opening browser for authentication...
    %FLYCTL_PATH% auth login
    if !errorlevel! neq 0 (
        echo ERROR: Failed to authenticate with Fly.io
        pause
        exit /b 1
    )
)
echo ✅ Authenticated with Fly.io
echo.

echo Step 3: Checking if app exists...
%FLYCTL_PATH% apps list | findstr "dte-circulars-scraper" >nul 2>&1
if !errorlevel! neq 0 (
    echo Creating new app...
    %FLYCTL_PATH% launch --no-deploy --name dte-circulars-scraper --region iad
    if !errorlevel! neq 0 (
        echo ERROR: Failed to create app
        pause
        exit /b 1
    )
    echo ✅ App created successfully
) else (
    echo ✅ App already exists
)
echo.

echo Step 4: Deploying to Fly.io...
echo This may take several minutes...
%FLYCTL_PATH% deploy --verbose
if !errorlevel! neq 0 (
    echo ERROR: Deployment failed!
    echo.
    echo Common issues and solutions:
    echo - Check if you have enough free tier resources
    echo - Verify your Fly.io account is set up correctly
    echo - Try running: flyctl deploy --local-only
    pause
    exit /b 1
)
echo ✅ Deployment completed successfully!
echo.

echo Step 5: Getting app information...
%FLYCTL_PATH% info
echo.

echo Step 6: Checking app status...
%FLYCTL_PATH% status
echo.

echo Step 7: Opening the deployed app...
echo Your app should be available at: https://dte-circulars-scraper.fly.dev
%FLYCTL_PATH% open
echo.

echo ========================================
echo   🎉 Deployment Complete!
echo ========================================
echo.
echo Your DTE Circulars Scraper is now deployed on Fly.io!
echo URL: https://dte-circulars-scraper.fly.dev
echo.
echo Unlike Heroku, Fly.io has no 30-second timeout limit,
echo so your scraper should work much better now!
echo.
echo To view logs: flyctl logs
echo To check status: flyctl status
echo To redeploy: flyctl deploy
echo.
pause