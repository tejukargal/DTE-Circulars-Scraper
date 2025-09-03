# Deployment Guide

This guide covers deploying the DTE Circulars Scraper to various platforms.

## Quick Deployment Options

### 1. Render (Recommended)

Render provides easy deployment with automatic Chromium installation.

**Steps:**
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
     - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

### 2. Netlify (Serverless Functions)

Netlify deployment uses serverless functions for the scraping API.

**Steps:**
1. Push code to GitHub
2. Connect to Netlify
3. Deploy settings are in `netlify.toml`
4. The API will be available at `/.netlify/functions/scrape`

**Note**: Netlify may have timeout limits on free tier (10s for functions)

### 3. Railway

**Steps:**
1. Connect GitHub repo to Railway
2. Railway auto-detects Node.js
3. Add environment variables:
   - `NODE_ENV=production`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
   - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

### 4. Heroku

**Requirements:**
- Add Heroku buildpack for Puppeteer: `heroku-community/puppeteer`

**Steps:**
1. Create Heroku app
2. Add buildpack: `heroku buildpacks:add heroku-community/puppeteer`
3. Add Node.js buildpack: `heroku buildpacks:add heroku/nodejs`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   heroku config:set PUPPETEER_EXECUTABLE_PATH=/app/.cache/puppeteer/chrome/linux-*/chrome-linux/chrome
   ```
5. Deploy: `git push heroku main`

## Build Optimizations

### Faster Builds
The following optimizations reduce build time:

1. **Skip Chromium Download**: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
2. **Use System Chrome**: Puppeteer uses system-installed Chrome
3. **Minimal Dependencies**: Only essential packages included

### Environment Variables

Required for production:
- `NODE_ENV=production`
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

## Troubleshooting

### Build Timeouts
- **Cause**: Puppeteer downloading Chromium
- **Solution**: Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

### Chrome Not Found
- **Cause**: System Chrome not available
- **Solution**: Check `PUPPETEER_EXECUTABLE_PATH` or install Chrome buildpack

### Memory Issues
- **Cause**: Limited memory on free tiers
- **Solution**: Upgrade plan or optimize Chrome flags

## Testing Deployment

After deployment, test the API:
```bash
curl -X POST https://your-app.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "url": "https://example.com/",
    "content": "...",
    "links": [...],
    "images": [...],
    "circulars": [...]
  }
}
```