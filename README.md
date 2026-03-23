# Apify Agent Skills

A collection of AI agent skills for web scraping, data extraction, and Actor development on the Apify platform.

> Looking for more specialized skills? Check out [apify/awesome-skills](https://github.com/apify/awesome-skills) — a community collection of domain-specific skills for lead generation, brand monitoring, competitor intelligence, and more.

## Skills

### [Ultimate scraper](skills/apify-ultimate-scraper/) (`apify-ultimate-scraper`)

AI-powered web scraper for 55+ platforms. Scrape data from Instagram, Facebook, TikTok, YouTube, Google Maps, Amazon, Walmart, eBay, Booking.com, TripAdvisor, and more. Can also search the [Apify Store](https://apify.com/store) to find the right Actor for any platform not listed here.

**Use cases**: lead generation, brand monitoring, competitor analysis, influencer discovery, trend research, content analytics, audience analysis, e-commerce pricing, reviews.

### [Actor development](skills/apify-actor-development/) (`apify-actor-development`)

Create, debug, and deploy Apify Actors from scratch in JavaScript, TypeScript, or Python.

### [Actorization](skills/apify-actorization/) (`apify-actorization`)

Convert existing projects into Apify Actors — supports JS/TS (SDK), Python (async context manager), and any language (CLI wrapper).

## Installation

```bash
npx skills add apify/agent-skills
```

### Claude Code

```bash
# Add the marketplace
/plugin marketplace add https://github.com/apify/agent-skills

# Install a skill
/plugin install apify-ultimate-scraper@apify-agent-skills
```

### Cursor / Windsurf

Add to your project's `.cursor/settings.json` or use the same Claude Code plugin format.

### Codex / Gemini CLI

Point your agent to the `agents/AGENTS.md` file which contains skill descriptions and paths:

```bash
# Gemini CLI uses gemini-extension.json automatically
# For Codex, reference agents/AGENTS.md in your configuration
```

### Other AI tools

Any AI tool that supports Markdown context can use the skills by pointing to:
- `agents/AGENTS.md` - auto-generated skill index
- `skills/*/SKILL.md` - individual skill documentation

## Prerequisites

1. **Apify account** — [apify.com](https://apify.com)
2. **API token** — get from [Apify Console](https://console.apify.com/account/integrations), add `APIFY_TOKEN=your_token` to `.env`
3. **Node.js 20.6+** (for the scraper skill)

## Pricing

Apify Actors use pay-per-result pricing. Check individual Actor pricing on the [Apify platform](https://apify.com).

## Support

- [Apify Documentation](https://docs.apify.com)
- [Apify Discord](https://discord.gg/jyEM2PRvMU)

## License

[Apache-2.0](LICENSE)
