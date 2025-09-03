@echo off
echo Updating Heroku app configuration...

echo Clearing existing buildpacks...
heroku buildpacks:clear

echo Adding correct buildpacks...
heroku buildpacks:add https://github.com/mxschmitt/heroku-playwright-buildpack
heroku buildpacks:add heroku/nodejs

echo Setting environment variables...
heroku config:unset PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
heroku config:unset PUPPETEER_EXECUTABLE_PATH
heroku config:set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
heroku config:set NODE_ENV=production

echo Adding files to git...
git add .

echo Committing changes...
git commit -m "Fix Heroku deployment: update buildpack and Chrome path

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo Deploying to Heroku...
git push heroku main

echo Deployment complete!
echo Opening app...
heroku open