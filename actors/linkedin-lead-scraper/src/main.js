import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset, sleep } from 'crawlee';
import { log } from 'apify';

await Actor.init();

const input = await Actor.getInput() ?? {};

const {
    searchQueries = ['IT manager managed IT services'],
    profileType = 'people',
    location = '',
    maxResultsPerQuery = 20,
    proxyConfiguration: proxyConfig,
} = input;

// Build site: prefix based on profile type
function buildSitePrefix(type) {
    if (type === 'companies') return 'site:linkedin.com/company';
    if (type === 'people') return 'site:linkedin.com/in';
    // 'both' — no site path restriction, just domain
    return 'site:linkedin.com/in OR site:linkedin.com/company';
}

// Build Google search URL for a query
function buildSearchUrl(query, type, loc, start = 0) {
    const sitePrefix = buildSitePrefix(type);
    const locationSuffix = loc ? ` "${loc}"` : '';
    const fullQuery = `${sitePrefix} ${query}${locationSuffix}`;
    const params = new URLSearchParams({
        q: fullQuery,
        num: '10',
        start: String(start),
        hl: 'en',
        gl: 'us',
    });
    return `https://www.google.com/search?${params}`;
}

// Parse a LinkedIn URL to determine profile type and extract handle
function classifyLinkedInUrl(url) {
    if (url.includes('linkedin.com/in/')) return 'person';
    if (url.includes('linkedin.com/company/')) return 'company';
    return 'unknown';
}

// Deduplicate by LinkedIn URL across all results
const seenUrls = new Set();
let totalCollected = 0;

const proxyConfiguration = proxyConfig
    ? await Actor.createProxyConfiguration(proxyConfig)
    : undefined;

// Build initial request list: one URL per (query, page) pair
const initialRequests = [];
for (const query of searchQueries) {
    // Start with first page; we'll enqueue more if needed
    initialRequests.push({
        url: buildSearchUrl(query, profileType, location, 0),
        userData: {
            query,
            start: 0,
            collected: 0,
        },
    });
}

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    launchContext: {
        launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    },
    // Respect Google's rate limits
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 30,

    async requestHandler({ request, page, enqueueLinks, crawler: c }) {
        const { query, start, collected } = request.userData;

        log.info(`Searching Google: query="${query}" start=${start}`);

        // Wait for search results to load
        await page.waitForSelector('#search, #rso, .g', { timeout: 20_000 }).catch(() => {});

        // Check for CAPTCHA
        const isCaptcha = await page.$('#captcha-form, #recaptcha') !== null
            || (await page.title()).toLowerCase().includes('captcha');
        if (isCaptcha) {
            log.warning('Google CAPTCHA detected — skipping this request. Consider using proxies.');
            return;
        }

        // Extract all organic result links that point to LinkedIn
        const results = await page.evaluate(() => {
            const items = [];
            const resultEls = document.querySelectorAll('.g, [data-sokoban-grid-item]');

            for (const el of resultEls) {
                const linkEl = el.querySelector('a[href]');
                const titleEl = el.querySelector('h3');
                const snippetEl = el.querySelector('.VwiC3b, .lEBKkf, [data-sncf="1"]');

                if (!linkEl) continue;

                const href = linkEl.getAttribute('href') || '';
                if (!href.includes('linkedin.com')) continue;

                const title = titleEl?.innerText?.trim() || '';
                const snippet = snippetEl?.innerText?.trim() || '';

                items.push({ href, title, snippet });
            }
            return items;
        });

        log.info(`Found ${results.length} LinkedIn results on this page`);

        let pageCollected = 0;

        for (const { href, title, snippet } of results) {
            // Clean the URL — strip tracking params
            let cleanUrl = href.split('?')[0].replace(/\/$/, '');

            // Skip non-profile/company pages
            if (
                !cleanUrl.includes('linkedin.com/in/') &&
                !cleanUrl.includes('linkedin.com/company/')
            ) continue;

            if (seenUrls.has(cleanUrl)) continue;
            seenUrls.add(cleanUrl);

            const type = classifyLinkedInUrl(cleanUrl);

            // Parse name/title/company from the Google snippet title
            // LinkedIn titles typically follow: "Name - Title at Company | LinkedIn"
            const parsed = parseLinkedInTitle(title);

            const lead = {
                linkedinUrl: cleanUrl,
                profileType: type,
                name: parsed.name,
                title: parsed.jobTitle,
                company: parsed.company,
                location: extractLocation(snippet),
                snippet: snippet.slice(0, 300),
                searchQuery: query,
                scrapedAt: new Date().toISOString(),
            };

            await Dataset.pushData(lead);
            pageCollected++;
            totalCollected++;

            log.info(`Lead #${totalCollected}: ${lead.name || cleanUrl} — ${lead.title || ''}`);

            if (collected + pageCollected >= maxResultsPerQuery) break;
        }

        const newCollected = collected + pageCollected;

        // Paginate if we need more results and found some on this page
        if (
            newCollected < maxResultsPerQuery &&
            results.length >= 8 &&
            start + 10 < 100  // Google only shows ~100 results
        ) {
            const nextStart = start + 10;
            await c.addRequests([{
                url: buildSearchUrl(query, profileType, location, nextStart),
                userData: { query, start: nextStart, collected: newCollected },
            }]);
        }

        // Polite delay between requests
        await sleep(2_000 + Math.random() * 2_000);
    },

    failedRequestHandler({ request, error }) {
        log.error(`Request ${request.url} failed: ${error.message}`);
    },
});

await crawler.run(initialRequests);

log.info(`Scraping complete. Total leads collected: ${totalCollected}`);

await Actor.exit();

// --- Helpers ---

/**
 * Parse a LinkedIn Google result title into name, jobTitle, company.
 * Common formats:
 *   "Jane Doe - Senior IT Manager at Acme Corp | LinkedIn"
 *   "Acme Corp | LinkedIn"
 *   "Jane Doe | LinkedIn"
 */
function parseLinkedInTitle(title) {
    const cleaned = title.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();

    // "Name - Title at Company"
    const dashMatch = cleaned.match(/^(.+?)\s+-\s+(.+?)(?:\s+at\s+(.+))?$/i);
    if (dashMatch) {
        return {
            name: dashMatch[1].trim(),
            jobTitle: dashMatch[3] ? dashMatch[2].trim() : '',
            company: dashMatch[3] ? dashMatch[3].trim() : dashMatch[2].trim(),
        };
    }

    // Fallback: whole string is just a name or company
    return { name: cleaned, jobTitle: '', company: '' };
}

/**
 * Try to extract a location string from a Google snippet.
 * LinkedIn snippets often include "Location · Title" or "City, State".
 */
function extractLocation(snippet) {
    // Match patterns like "Chicago, IL" or "New York, New York"
    const match = snippet.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})\b/);
    return match ? match[1].trim() : '';
}
