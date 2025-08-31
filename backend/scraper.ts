import puppeteer, { Browser, Page } from 'puppeteer';
import type { ScrapedData } from '../src/types/index.js';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
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
    
    // Get page content using Puppeteer methods
    let content = '';
    try {
      content = await page.evaluate(() => {
        return document.body ? document.body.innerText.slice(0, 2000) : '';
      });
    } catch (e) {
      console.log('Content extraction failed:', e);
    }

    // Extract images using Puppeteer
    const images: string[] = [];
    try {
      const imageUrls = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        const urls = [];
        for (let i = 0; i < Math.min(imgs.length, 10); i++) {
          const src = imgs[i].getAttribute('src');
          if (src) {
            const fullUrl = src.startsWith('http') ? src : new URL(src, window.location.href).href;
            urls.push(fullUrl);
          }
        }
        return urls;
      });
      images.push(...imageUrls);
    } catch (e) {
      console.log('Image extraction failed:', e);
    }

    // Extract links using Puppeteer
    const links: Array<{text: string; href: string}> = [];
    try {
      const extractedLinks = await page.evaluate(() => {
        const linkElements = document.querySelectorAll('a[href]');
        const linksData = [];
        for (let i = 0; i < Math.min(linkElements.length, 20); i++) {
          const link = linkElements[i];
          const text = link.textContent ? link.textContent.trim() : '';
          const href = link.getAttribute('href');
          if (text && href) {
            const fullHref = href.startsWith('http') ? href : new URL(href, window.location.href).href;
            linksData.push({ text, href: fullHref });
          }
        }
        return linksData;
      });
      links.push(...extractedLinks);
    } catch (e) {
      console.log('Links extraction failed:', e);
    }

    // Extract metadata using Puppeteer
    const metadata = await page.evaluate(() => {
      const getMeta = (name: string) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`);
        return el ? el.getAttribute('content') : null;
      };
      return {
        description: getMeta('description'),
        keywords: getMeta('keywords'),
        author: getMeta('author'),
        publishDate: getMeta('article:published_time') || getMeta('date')
      };
    });

    // Extract circulars from table using Puppeteer
    const circulars: Array<{title: string; link: string; date?: string; orderNo?: string}> = [];
    try {
      const extractedCirculars = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        const circularsData = [];
        
        for (let i = 0; i < Math.min(rows.length, 12) && circularsData.length < 10; i++) {
          const row = rows[i];
          const cells = row.querySelectorAll('td');
          
          if (cells.length >= 4) {
            const dateText = cells[0] ? cells[0].textContent?.trim() : '';
            const orderText = cells[1] ? cells[1].textContent?.trim() : '';
            const subjectText = cells[2] ? cells[2].textContent?.trim() : '';
            const linkElement = cells[3] ? cells[3].querySelector('a') : null;
            
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href && dateText && subjectText) {
                const fullHref = href.startsWith('http') ? href : new URL(href, window.location.href).href;
                circularsData.push({
                  title: subjectText,
                  link: fullHref,
                  date: dateText,
                  orderNo: orderText
                });
              }
            }
          }
        }
        return circularsData;
      });
      circulars.push(...extractedCirculars);
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