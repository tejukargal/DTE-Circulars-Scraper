import { chromium } from 'playwright';
let browser = null;
async function getBrowser() {
    if (!browser) {
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            timeout: 60000
        };
        // Playwright handles browser installation automatically on Heroku
        browser = await chromium.launch(launchOptions);
    }
    return browser;
}
export async function scrapeUrl(url) {
    let browserInstance;
    let page;
    try {
        browserInstance = await getBrowser();
        page = await browserInstance.newPage();
        page.setDefaultTimeout(60000);
        // Set user agent to avoid blocking
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    catch (error) {
        console.error('Browser setup or navigation failed:', error);
        // Close browser and create new one if there's an error
        if (browser) {
            await browser.close();
            browser = null;
        }
        throw new Error(`Failed to load page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    try {
        // Use Playwright's built-in methods
        const title = await page.title();
        const pageUrl = page.url();
        // Get page content using Playwright methods
        let content = '';
        try {
            content = await page.evaluate(() => {
                return document.body ? document.body.innerText.slice(0, 2000) : '';
            });
        }
        catch (e) {
            console.log('Content extraction failed:', e);
        }
        // Extract images using Playwright
        const images = [];
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
        }
        catch (e) {
            console.log('Image extraction failed:', e);
        }
        // Extract links using Playwright
        const links = [];
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
        }
        catch (e) {
            console.log('Links extraction failed:', e);
        }
        // Extract metadata using Puppeteer
        const metadata = {
            description: undefined,
            keywords: undefined,
            author: undefined,
            publishDate: undefined
        };
        // Extract circulars from table using Puppeteer
        const circulars = [];
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
        }
        catch (e) {
            console.log('Circulars extraction failed:', e);
        }
        const scrapedData = {
            title,
            url: pageUrl,
            content,
            images,
            links,
            metadata,
            circulars // Already limited to 10 during collection
        };
        return scrapedData;
    }
    catch (error) {
        console.error('Scraping error:', error);
        throw error;
    }
    finally {
        try {
            if (page) {
                await page.close();
            }
        }
        catch (e) {
            console.error('Error closing page:', e);
        }
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
