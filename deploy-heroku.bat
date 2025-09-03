@echo off
echo Creating Heroku app...
heroku create dte-circulars-scraper

echo Adding buildpacks...
heroku buildpacks:add jontewks/puppeteer
heroku buildpacks:add heroku/nodejs

echo Setting environment variables...
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
heroku config:set PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

echo Adding files to git...
git add .

echo Committing changes...
git commit -m "Configure for Heroku deployment"

echo Deploying to Heroku...
git push heroku main

echo Deployment complete!
echo Opening app...
heroku open