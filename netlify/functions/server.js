import { scrapeUrl } from '../backend-js/backend/scraper.js';

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  // Set up CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    if (event.httpMethod === 'POST' && event.path === '/api/scrape') {
      const body = JSON.parse(event.body);
      const { url } = body;
      
      if (!url) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'URL is required' 
          })
        };
      }

      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Invalid URL format' 
          })
        };
      }

      const data = await scrapeUrl(url);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          data 
        })
      };
    } else if (event.httpMethod === 'GET' && event.path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Server is running',
          timestamp: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV
        })
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Endpoint not found' 
        })
      };
    }
  } catch (error) {
    console.error('Scraping error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape URL' 
      })
    };
  }
};