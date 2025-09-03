@echo off
echo Deploying to Fly.io now...
npm run build && C:\Users\Lekhana\.fly\bin\flyctl.exe deploy && C:\Users\Lekhana\.fly\bin\flyctl.exe open
echo.
echo Deployment complete! Check https://dte-circulars-scraper.fly.dev
pause