import { chromium, Browser, Page } from 'playwright';
import type { ScrapedData } from '../src/types/index.js';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const browserInstance = await getBrowser();
  const page: Page = await browserInstance.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Use Playwright's built-in methods instead of page.evaluate
    const title = await page.title();
    const pageUrl = page.url();
    
    // Get page content using textContent (limited for faster performance)
    let content = '';
    try {
      const bodyElement = await page.$('body');
      if (bodyElement) {
        content = await bodyElement.textContent() || '';
        content = content.slice(0, 2000); // Reduced content length for faster processing
      }
    } catch (e) {
      console.log('Content extraction failed:', e);
    }

    // Extract only first 10 images for faster performance
    const images: string[] = [];
    try {
      const imgElements = await page.$$('img');
      for (const img of imgElements.slice(0, 10)) {
        const src = await img.getAttribute('src');
        if (src) {
          const fullUrl = src.startsWith('http') ? src : new URL(src, pageUrl).href;
          images.push(fullUrl);
        }
      }
    } catch (e) {
      console.log('Image extraction failed:', e);
    }

    // Extract only first 20 links for faster performance
    const links: Array<{text: string; href: string}> = [];
    try {
      const linkElements = await page.$$('a[href]');
      for (const link of linkElements.slice(0, 20)) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text && href && text.trim()) {
          const fullHref = href.startsWith('http') ? href : new URL(href, pageUrl).href;
          links.push({ text: text.trim(), href: fullHref });
        }
      }
    } catch (e) {
      console.log('Links extraction failed:', e);
    }

    // Extract metadata using getAttribute
    const metadata = {
      description: null as string | null,
      keywords: null as string | null,
      author: null as string | null,
      publishDate: null as string | null
    };

    try {
      const descMeta = await page.$('meta[name="description"], meta[property="description"], meta[property="og:description"]');
      if (descMeta) {
        metadata.description = await descMeta.getAttribute('content');
      }

      const keywordsMeta = await page.$('meta[name="keywords"]');
      if (keywordsMeta) {
        metadata.keywords = await keywordsMeta.getAttribute('content');
      }

      const authorMeta = await page.$('meta[name="author"]');
      if (authorMeta) {
        metadata.author = await authorMeta.getAttribute('content');
      }

      const publishMeta = await page.$('meta[property="article:published_time"], meta[name="date"]');
      if (publishMeta) {
        metadata.publishDate = await publishMeta.getAttribute('content');
      }
    } catch (e) {
      console.log('Metadata extraction failed:', e);
    }

    // Extract only recent 10 circulars from table structure for faster performance
    const circulars: Array<{title: string; link: string; date?: string; orderNo?: string}> = [];
    try {
      const rows = await page.$$('table tr');
      
      // Process only the first 12 rows (including potential header rows)
      // This gives us approximately 10 circular entries
      const rowsToProcess = rows.slice(0, 12);
      
      for (const row of rowsToProcess) {
        const cells = await row.$$('td');
        
        if (cells.length >= 4) {
          const dateText = await cells[0].textContent();
          const orderText = await cells[1].textContent();
          const subjectText = await cells[2].textContent();
          
          // Look for link in the last cell
          const linkElement = await cells[3].$('a');
          if (linkElement) {
            const href = await linkElement.getAttribute('href');
            
            if (href && dateText && subjectText) {
              const fullHref = href.startsWith('http') ? href : new URL(href, pageUrl).href;
              
              circulars.push({
                title: subjectText.trim(),
                link: fullHref,
                date: dateText.trim(),
                orderNo: orderText ? orderText.trim() : undefined
              });
              
              // Stop after collecting 10 circulars
              if (circulars.length >= 10) {
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('Circulars extraction failed:', e);
    }

    const scrapedData: ScrapedData = {
      title,
      url: pageUrl,
      content,
      images,
      links,
      metadata,
      circulars // Already limited to 10 during collection
    };

    return scrapedData;
  } finally {
    await page.close();
  }
}

if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (browser) {
      await browser.close();
    }
    process.exit(0);
  });
}