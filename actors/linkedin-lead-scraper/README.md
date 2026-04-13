# LinkedIn Lead Scraper

Find LinkedIn profiles and company pages for prospects who need managed IT services, cloud backup, MDR (Managed Detection and Response), and laptop/equipment rentals — all without a LinkedIn account or Sales Navigator subscription.

## How It Works

This Actor uses Google Search with `site:linkedin.com` queries to surface LinkedIn profiles and company pages that match your target criteria. It then parses each result's title and snippet to extract structured lead data (name, job title, company, location, LinkedIn URL).

**Why Google instead of LinkedIn directly?**  
Scraping LinkedIn directly triggers aggressive bot-detection. Google already indexes the public portions of LinkedIn profiles, giving you clean structured data without the friction.

## Use Cases

- **Managed IT Services** — Find IT managers, CTOs, and operations leaders at SMBs who are actively discussing IT pain points
- **Cloud Backup & Disaster Recovery** — Target IT directors and sysadmins researching backup solutions
- **MDR (Managed Detection & Response)** — Identify security-conscious decision makers at companies without a dedicated SOC
- **Laptop & Equipment Rentals** — Reach HR managers, event coordinators, and office managers with temporary tech needs

## Input

| Field | Type | Description |
|-------|------|-------------|
| `searchQueries` | string[] | Google search queries (e.g. `"IT manager cloud backup Chicago"`) |
| `profileType` | string | `people`, `companies`, or `both` |
| `location` | string | Optional city/state/country to restrict results |
| `maxResultsPerQuery` | integer | Max leads per query (default: 20, max: 100) |
| `proxyConfiguration` | object | Apify Proxy settings (recommended) |

### Example Input

```json
{
    "searchQueries": [
        "IT manager managed IT services",
        "CTO cloud backup disaster recovery",
        "IT director MDR managed detection response",
        "office manager laptop rental"
    ],
    "profileType": "people",
    "location": "Chicago",
    "maxResultsPerQuery": 30,
    "proxyConfiguration": { "useApifyProxy": true }
}
```

## Output

Each lead is saved as a dataset item with the following fields:

| Field | Description |
|-------|-------------|
| `name` | Full name (for people) or company name |
| `title` | Job title (e.g. "Senior IT Manager") |
| `company` | Employer or company name |
| `location` | City/State extracted from snippet |
| `linkedinUrl` | Direct LinkedIn profile or company page URL |
| `profileType` | `person` or `company` |
| `snippet` | Google search snippet with context |
| `searchQuery` | The query that found this lead |
| `scrapedAt` | ISO timestamp |

### Example Output Item

```json
{
    "name": "Jane Smith",
    "title": "IT Manager",
    "company": "Acme Corp",
    "location": "Chicago, IL",
    "linkedinUrl": "https://www.linkedin.com/in/janesmith",
    "profileType": "person",
    "snippet": "IT Manager at Acme Corp. Specializes in cloud infrastructure and disaster recovery...",
    "searchQuery": "IT manager managed IT services",
    "scrapedAt": "2024-01-15T10:30:00.000Z"
}
```

## Tips for Better Results

1. **Be specific in queries** — `"IT director SMB managed services Chicago"` outperforms `"IT"`.
2. **Use location filter** — Combine the `location` field with geographic terms in your queries for tighter targeting.
3. **Layer multiple queries** — Use 4–6 queries covering different job titles and service terms.
4. **Enable Apify Proxy** — Datacenter proxies reduce the chance of Google rate-limiting your run.
5. **Export to CSV** — Use the dataset's Export button to download results into your CRM.

## Limitations

- Results are limited to publicly visible LinkedIn data indexed by Google.
- Google may return fewer than `maxResultsPerQuery` results for niche queries.
- LinkedIn profiles must be public (not hidden behind login) to appear in Google results.
- Respects Google's rate limits — runs are deliberately paced to avoid blocks.

## Legal & Ethical Use

Only collect data on people and companies where you have a legitimate business purpose. Always comply with GDPR, CCPA, and LinkedIn's Terms of Service. Do not store personal data longer than necessary and provide an opt-out mechanism in your outreach.
