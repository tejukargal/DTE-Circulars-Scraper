import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeUrl } from './backend-js/backend/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV
  });
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check if Playwright is available
    let playwrightStatus = 'unknown';
    try {
      const { chromium } = await import('playwright');
      playwrightStatus = 'available';
      
      // Try to get executable path
      try {
        const execPath = chromium.executablePath();
        playwrightStatus = `available at ${execPath}`;
      } catch (e) {
        playwrightStatus = 'available but no executable path';
      }
    } catch (e) {
      playwrightStatus = `not available: ${e.message}`;
    }
    
    res.json({
      success: true,
      debug: {
        playwright: playwrightStatus,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// API routes
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    const data = await scrapeUrl(url);
    
    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to scrape URL' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});