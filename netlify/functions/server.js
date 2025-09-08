// Simple scraping function for serverless environments
async function simpleScrape(url) {
  // Import node-fetch using CommonJS syntax for Netlify functions
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract title using regex
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract basic content (first 2000 characters of text)
    const content = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 2000);
    
    // Extract images using regex
    const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    const images = imageMatches
      .map(match => {
        const srcMatch = match.match(/src=["']([^"']+)["']/i);
        return srcMatch ? srcMatch[1] : null;
      })
      .filter(Boolean)
      .slice(0, 10);
    
    // Extract links using regex
    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi) || [];
    const links = linkMatches
      .map(match => {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        const textMatch = match.match(/>(.*?)<\/a>/i);
        return hrefMatch && textMatch ? {
          href: hrefMatch[1],
          text: textMatch[1].replace(/<[^>]*>/g, '').trim()
        } : null;
      })
      .filter(Boolean)
      .slice(0, 20);
    
    // Extract PDF links as circulars
    const pdfLinks = links.filter(link => 
      link.href.toLowerCase().includes('.pdf') || 
      link.text.toLowerCase().includes('circular') ||
      link.text.toLowerCase().includes('notification')
    ).slice(0, 10);
    
    const circulars = pdfLinks.map(link => ({
      title: link.text || 'PDF Document',
      link: link.href.startsWith('http') ? link.href : new URL(link.href, url).href
    }));
    
    // Basic metadata extraction
    const metadata = {
      description: undefined,
      keywords: undefined,
      author: undefined,
      publishDate: undefined
    };
    
    // Try to extract description from meta tags
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) {
      metadata.description = descMatch[1];
    }
    
    return {
      title,
      url,
      content,
      images,
      links,
      metadata,
      circulars
    };
    
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape URL: ${error.message || 'Unknown error'}`);
  }
}

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

      const data = await simpleScrape(url);
      
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
        error: error.message || 'Failed to scrape URL' 
      })
    };
  }
};