@echo off
echo Creating Heroku app...
heroku create dte-circulars-scraper

echo Adding buildpacks...
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-google-chrome

echo Setting environment variables...
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
heroku config:set PUPPETEER_EXECUTABLE_PATH=/app/.apt/usr/bin/google-chrome

echo Adding files to git...
git add .

echo Committing changes...
git commit -m "Configure for Heroku deployment"

echo Deploying to Heroku...
git push heroku main

echo Deployment complete!
echo Opening app...
heroku open