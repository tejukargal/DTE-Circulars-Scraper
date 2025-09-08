import type { ScrapedData } from '../src/types/index.js';

// Simple scraping function using node-fetch for serverless environments
async function simpleScrape(url: string): Promise<ScrapedData> {
  // Dynamically import node-fetch to avoid issues with different environments
  const fetchModule = await import('node-fetch');
  const fetch = fetchModule.default;
  
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
      .slice(0, 10) as string[];
    
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
      .slice(0, 20) as Array<{text: string; href: string}>;
    
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
      description: undefined as string | undefined,
      keywords: undefined as string | undefined,
      author: undefined as string | undefined,
      publishDate: undefined as string | undefined
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
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { simpleScrape };