# FONT-LOVER

**Web fonts are not chosen — they are observed.**

FONT-LOVER is an experimental repository that automatically detects fonts in use on real websites, stores and classifies the observation data, and displays it as a browsable field-guide UI. Accumulated insights are automatically formatted into **OKF (Open Knowledge Format) v0.2** compliant knowledge bundles for public release.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Version](https://img.shields.io/badge/version-v0.1.0-blue.svg)](https://github.com/watanabe3tipapa/font-lover/releases)
[![OKF](https://img.shields.io/badge/OKF-v0.2-8b5cf6.svg)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
[![Vercel](https://img.shields.io/badge/Vercel-live-black.svg)](https://font-lover.vercel.app)
[![Cloudflare](https://img.shields.io/badge/Cloudflare%20Workers-live-orange.svg)](https://font-lover-collector.watanabe3ti.workers.dev)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-blue.svg)](https://watanabe3tipapa.github.io/font-lover/)
[![GitHub](https://img.shields.io/github/issues/watanabe3tipapa/font-lover.svg)](https://github.com/watanabe3tipapa/font-lover/issues)

[日本語](README.md) | [English](README_en.md)

---

## Overview

FONT-LOVER observes the ecology of web fonts as a field guide. It scans live websites to obtain font usage data, stores it in Cloudflare D1 (production) or SQLite (local), and exposes it through GET APIs. Accumulated data is automatically formatted into OKF v0.2 compliant knowledge bundles (`concepts/fonts/*.json`), preserving traceability from observation to publication.

## Concept — why a "field guide"

A field guide is a tool for recording, classifying, and presenting living creatures observed in the wild. It is not a fixed catalogue but a continuously growing set of observation records. FONT-LOVER treats web fonts the same way: it observes fonts "living" on the web, accumulates sighting records, and grows a browsable field guide over time.

| Field-guide activity | FONT-LOVER equivalent |
|---|---|
| Observe | Scan real sites frequently in light mode (HTML parse) |
| Collect specimens | Store to `font_families` / `font_sightings`; bump score on duplicates |
| Preserve specimens | Save `@font-face` SRC in `font_faces`; auto-classify `source_type` |
| Classify | Organize by `category` (serif, sans-serif, etc.) and `source_type` (google-fonts, unknown, etc.) |
| Publish the field guide | Zine UI: browse, statistics, site view, OKF viewer, DB inspector |
| Formalize as knowledge | Generate OKF v0.2 bundles; hash diff produces `new` / `updated` / `unchanged` |

## Features

- Scan real sites in **light mode** — HTML parse only, runs on free-tier Cloudflare Workers
- Stores to D1 (production) / SQLite (local); Drizzle ORM shares schema across both
- `GET /api/fonts` `/api/stats` `/api/sites/:domain` query APIs
- Remote proxy layer (`lib/data.ts`) — `COLLECTOR_URL` presence toggles between production proxy and local SQLite automatically
- **OKF v0.2** compliant knowledge bundles generated automatically; hash-diff tracks `new` / `updated` / `unchanged`
- Zine UI in **Neo Brutalism** design: field guide, statistics, site view, OKF viewer, DB inspector
- GitHub Pages landing page with architecture diagrams, tutorials, and API reference

---

## Prerequisites

| Tool | Required version | Check |
|---|---|---|
| pnpm | >= 9 | `pnpm --version` |
| Node.js | >= 20 | `node --version` |
| Wrangler | >= 3 | `npx wrangler --version` |
| Git | optional (deploy/contributing) | `git --version` |

On macOS both can be installed with `brew install pnpm node`.

---

## Getting started (facts only)

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/watanabe3tipapa/font-lover.git
cd font-lover
pnpm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
cp apps/collector/.dev.vars.example apps/collector/.dev.vars
```

Set `WORKER_TOKEN` in `apps/collector/.dev.vars`.

3. (Optional) Seed demo data:

```bash
pnpm --filter @font-lover/zine db:seed
```

4. Start collector and zine in parallel:

```bash
pnpm dev
# collector → http://localhost:8787
# zine     → http://localhost:3000
```

5. Scan a website to observe its fonts:

```bash
curl -X POST http://localhost:8787/api/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","mode":"light"}'
```

6. View the result in the field-guide UI:

```bash
open http://localhost:3000/api/fonts
```

---

## API (v0.1.0)

### Collector (Cloudflare Workers) — Bearer token via `WORKER_TOKEN` required

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/scan` | Single-site scan (`{ url, mode: "light" \| "full" }`) |
| POST | `/api/collect` | Batch scan multiple URLs (`{ urls: string[], mode }`) |
| GET | `/api/fonts` | All font families (sorted by popularity) |
| GET | `/api/fonts/:family` | Font detail + sighting records |
| GET | `/api/sites/:domain` | Fonts detected on a specific domain |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/` | Health check |

### Zine (Vercel) — proxies to D1 in production, uses SQLite locally

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/fonts` `/api/fonts/:family` `/api/sites/:domain` `/api/stats` | Data queries (proxy or SQLite) |
| GET | `/api/okf` | OKF v0.2 knowledge bundle (committed JSON or live-generated) |
| POST | `/api/scan` | Proxy to collector |

---

## Deployment (live since 2026-09-14)

| Target | Delivery | URL |
|---|---|---|
| Zine (field guide) | GitHub push → Vercel auto-deploy | <https://font-lover.vercel.app> |
| Collector (Worker) | `wrangler deploy` | <https://font-lover-collector.watanabe3ti.workers.dev> |
| LP (GitHub Pages) | GitHub push → Pages auto-build (`/docs`) | <https://watanabe3tipapa.github.io/font-lover/> |

> Free-tier note: Browser Rendering (full scan) requires Workers Paid. Free-tier operates in light mode (HTML parse only); full scan is loaded via dynamic import.

---

## Documentation and learning order

1. Read the **GitHub Pages LP** for the full picture
2. Try the **live demo** and **API endpoints**
3. Follow the **getting started** guide to build locally and run a scan
4. Browse the **knowledge bundles** at `/okf`
5. Read `DEV-MEMO.md` for implementation background

---

## Repository structure

```
font-lover/
├── apps/
│   ├── collector/       # Cloudflare Workers: font detection + D1 proxy API
│   └── zine/            # Next.js: field-guide UI + API + OKF v0.2 bundles
├── packages/
│   ├── database/        # Drizzle ORM schema & migrations
│   └── shared-types/    # Shared types & constants
├── tooling/
│   ├── cron-trigger/    # Batch collection script
│   └── mdn-sync/        # MDN knowledge sync script
├── docs/                # GitHub Pages LP (index.html)
└── DEV-MEMO.md
```

---

## Environment variables

| Variable | Purpose | Where to set |
|---|---|---|
| `WORKER_TOKEN` | Bearer token for collector API authentication | `apps/collector/.dev.vars` / Workers Secret / Vercel (Production) |
| `COLLECTOR_URL` | URL zine uses to call collector (set = remote mode) | Vercel / local dev |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (for D1 migrations) | `.env.local` |
| `CLOUDFLARE_D1_TOKEN` | D1 API token | `.env.local` |

---

## Contributing

Contributions are welcome. Please open an issue before working on large changes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your change'`)
4. Push to the branch and open a Pull Request

---

## Contact

| Name | URL |
|---|---|
| GitHub | <https://github.com/watanabe3tipapa/font-lover> |
| Demo (Vercel) | <https://font-lover.vercel.app> |
| Collector API | <https://font-lover-collector.watanabe3ti.workers.dev> |
| LP (GitHub Pages) | <https://watanabe3tipapa.github.io/font-lover/> |
| OKF Viewer | <https://font-lover.vercel.app/okf> |

---

## License

MIT License — see the LICENSE file for details.

---

## Development status

- Repository is not archived.
- v0.1.0 (first production release, 2026-09-14)
- Last updated: 2026-09-14