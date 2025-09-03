# PowerShell script for automated Fly.io deployment
param(
    [string]$FlyctlPath = "C:\Users\Lekhana\.fly\bin\flyctl.exe"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Auto-Deploying to Fly.io" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to run command and check result
function Invoke-CommandSafely {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [string]$SuccessMessage = "",
        [string]$ErrorMessage = "Command failed"
    )
    
    try {
        if ($Arguments) {
            $result = Start-Process -FilePath $Command -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
        } else {
            $result = Start-Process -FilePath $Command -Wait -PassThru -NoNewWindow
        }
        
        if ($result.ExitCode -eq 0) {
            if ($SuccessMessage) {
                Write-Host "✅ $SuccessMessage" -ForegroundColor Green
            }
            return $true
        } else {
            Write-Host "❌ $ErrorMessage (Exit code: $($result.ExitCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $ErrorMessage : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if flyctl exists
if (-not (Test-Path $FlyctlPath)) {
    Write-Host "❌ ERROR: Fly.io CLI not found at $FlyctlPath" -ForegroundColor Red
    Write-Host "Please install Fly.io CLI first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Build the application
Write-Host "Step 1: Building the application locally..." -ForegroundColor Yellow
if (-not (Invoke-CommandSafely -Command "npm" -Arguments "run build" -SuccessMessage "Build completed successfully" -ErrorMessage "Build failed")) {
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 2: Check authentication
Write-Host "Step 2: Checking Fly.io authentication..." -ForegroundColor Yellow
$authResult = & $FlyctlPath auth whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "You need to login to Fly.io first." -ForegroundColor Yellow
    Write-Host "Opening browser for authentication..." -ForegroundColor Yellow
    if (-not (Invoke-CommandSafely -Command $FlyctlPath -Arguments "auth login" -SuccessMessage "Authenticated successfully" -ErrorMessage "Authentication failed")) {
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Already authenticated with Fly.io" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check if app exists
Write-Host "Step 3: Checking if app exists..." -ForegroundColor Yellow
$appsList = & $FlyctlPath apps list 2>$null
if ($appsList -notmatch "dte-circulars-scraper") {
    Write-Host "Creating new app..." -ForegroundColor Yellow
    if (-not (Invoke-CommandSafely -Command $FlyctlPath -Arguments "launch --no-deploy --name dte-circulars-scraper --region iad" -SuccessMessage "App created successfully" -ErrorMessage "Failed to create app")) {
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ App already exists" -ForegroundColor Green
}
Write-Host ""

# Step 4: Deploy
Write-Host "Step 4: Deploying to Fly.io..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Yellow
if (-not (Invoke-CommandSafely -Command $FlyctlPath -Arguments "deploy --verbose" -SuccessMessage "Deployment completed successfully!" -ErrorMessage "Deployment failed")) {
    Write-Host ""
    Write-Host "Common issues and solutions:" -ForegroundColor Yellow
    Write-Host "- Check if you have enough free tier resources" -ForegroundColor Yellow
    Write-Host "- Verify your Fly.io account is set up correctly" -ForegroundColor Yellow
    Write-Host "- Try running: flyctl deploy --local-only" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 5: Get app info
Write-Host "Step 5: Getting app information..." -ForegroundColor Yellow
& $FlyctlPath info
Write-Host ""

# Step 6: Check status
Write-Host "Step 6: Checking app status..." -ForegroundColor Yellow
& $FlyctlPath status
Write-Host ""

# Step 7: Open app
Write-Host "Step 7: Opening the deployed app..." -ForegroundColor Yellow
Write-Host "Your app should be available at: https://dte-circulars-scraper.fly.dev" -ForegroundColor Cyan
& $FlyctlPath open
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your DTE Circulars Scraper is now deployed on Fly.io!" -ForegroundColor Green
Write-Host "URL: https://dte-circulars-scraper.fly.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Unlike Heroku, Fly.io has no 30-second timeout limit," -ForegroundColor Yellow
Write-Host "so your scraper should work much better now!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "- To view logs: flyctl logs" -ForegroundColor Gray
Write-Host "- To check status: flyctl status" -ForegroundColor Gray  
Write-Host "- To redeploy: flyctl deploy" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"