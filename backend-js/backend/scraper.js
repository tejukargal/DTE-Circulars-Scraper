import { chromium } from 'playwright';
import { execSync } from 'child_process';
let browser = null;
let browsersInstalled = false;
async function ensureBrowsersInstalled() {
    if (browsersInstalled)
        return;
    try {
        // Try to launch a test browser to check if it works
        const testBrowser = await chromium.launch({ headless: true });
        await testBrowser.close();
        browsersInstalled = true;
        console.log('Playwright browser is available');
    }
    catch (error) {
        console.log('Installing Playwright browsers...');
        try {
            execSync('npx playwright install chromium', { stdio: 'inherit' });
            // Verify installation worked
            const verifyBrowser = await chromium.launch({ headless: true });
            await verifyBrowser.close();
            browsersInstalled = true;
            console.log('Playwright browsers installed successfully');
        }
        catch (installError) {
            console.error('Failed to install Playwright browsers:', installError);
            throw new Error(`Browser installation failed: ${installError instanceof Error ? installError.message : 'Unknown error'}`);
        }
    }
}
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
                '--disable-renderer-backgrounding',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list'
            ],
            timeout: 90000
        };
        // Let Playwright use its bundled browser on Heroku
        // No executablePath needed - Playwright will manage it
        browser = await chromium.launch(launchOptions);
    }
    return browser;
}
async function attemptScrape(url, retryCount = 0) {
    let browserInstance = null;
    let page = null;
    try {
        // Ensure browsers are installed before attempting to launch
        await ensureBrowsersInstalled();
        // Create a fresh browser instance for each scrape to avoid connection issues
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
                '--disable-renderer-backgrounding',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list'
            ],
            timeout: 60000
        };
        // Let Playwright use its bundled browser on Heroku
        // No executablePath needed - Playwright will manage it
        browserInstance = await chromium.launch(launchOptions);
        page = await browserInstance.newPage();
        // Set more generous timeout for production (Heroku has 30s limit)
        const timeout = process.env.NODE_ENV === 'production' ? 25000 : 10000;
        page.setDefaultTimeout(timeout);
        // Set user agent to avoid blocking
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        // Use conservative timeouts for Heroku (30s total limit)
        console.log('Attempting to navigate to:', url);
        
        try {
            await page.goto(url, { waitUntil: 'commit', timeout: 8000 });
            console.log('Navigation successful with commit');
            
            try {
                await page.waitForSelector('table, body', { timeout: 5000 });
                console.log('Content found after navigation');
            } catch (e) {
                console.log('No specific content found, continuing...');
            }
        }
        catch (timeoutError) {
            console.log('Commit timeout, trying with load...');
            try {
                await page.goto(url, { waitUntil: 'load', timeout: 12000 });
                console.log('Navigation successful with load');
            }
            catch (loadError) {
                console.log('Load timeout, trying domcontentloaded...');
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
                console.log('Navigation with domcontentloaded completed');
            }
        }
    }
    catch (error) {
        console.error('Browser setup or navigation failed:', error);
        // Clean up resources
        if (page) {
            try {
                await page.close();
            }
            catch (e) {
                console.log('Error closing page:', e);
            }
        }
        if (browserInstance) {
            try {
                await browserInstance.close();
            }
            catch (e) {
                console.log('Error closing browser:', e);
            }
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Timeout')) {
            throw new Error(`Website is taking too long to respond. This might be due to slow server response or network issues. Please try again later.`);
        }
        throw new Error(`Failed to load page: ${errorMessage}`);
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
        // Clean up resources
        try {
            if (page) {
                await page.close();
            }
        }
        catch (e) {
            console.error('Error closing page:', e);
        }
        try {
            if (browserInstance) {
                await browserInstance.close();
            }
        }
        catch (e) {
            console.error('Error closing browser:', e);
        }
    }
}

export async function scrapeUrl(url = 'https://dtek.karnataka.gov.in/info-4/Departmental+Circulars/kn', maxRetries = 2) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Scraping attempt ${attempt + 1}/${maxRetries + 1} for URL: ${url}`);
            const result = await attemptScrape(url, attempt);
            console.log(`Scraping successful on attempt ${attempt + 1}`);
            return result;
        } catch (error) {
            lastError = error;
            console.log(`Attempt ${attempt + 1} failed:`, error.message);
            
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * (attempt + 1), 3000);
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    console.error(`All ${maxRetries + 1} attempts failed. Last error:`, lastError?.message);
    throw lastError || new Error('Maximum retry attempts reached');
}

if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
        if (browser) {
            await browser.close();
        }
        process.exit(0);
    });
}
