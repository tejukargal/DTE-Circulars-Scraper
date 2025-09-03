@echo off
echo Deploying DTE Circulars Scraper to Fly.io...
echo.

REM Set the path to flyctl
set FLYCTL_PATH=C:\Users\Lekhana\.fly\bin\flyctl.exe

echo Step 1: Checking Fly.io authentication...
%FLYCTL_PATH% auth whoami
if %ERRORLEVEL% neq 0 (
    echo You need to login to Fly.io first.
    echo Running: flyctl auth login
    %FLYCTL_PATH% auth login
    if %ERRORLEVEL% neq 0 (
        echo Failed to login to Fly.io
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Launching app (this will create the app if it doesn't exist)...
%FLYCTL_PATH% launch --no-deploy --name dte-circulars-scraper --region iad
if %ERRORLEVEL% neq 0 (
    echo App might already exist, continuing...
)

echo.
echo Step 3: Deploying to Fly.io...
%FLYCTL_PATH% deploy
if %ERRORLEVEL% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Opening the deployed app...
%FLYCTL_PATH% open

echo.
echo Deployment complete! Your app should be opening in the browser.
echo App URL: https://dte-circulars-scraper.fly.dev
echo.
pause