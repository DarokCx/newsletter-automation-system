# 📧 Newsletter Automation System

> AI-powered newsletter generation for multi-brand co-operative organizations, integrated with Cyberimpact.

![Google Apps Script](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-blueviolet?style=flat-square)
![Google Sheets](https://img.shields.io/badge/Google_Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)

## Overview

A production Google Apps Script system that generates structured, brand-consistent newsletter content for two distinct co-op brands using the Claude API. Content is generated, reviewed, and formatted directly inside Google Sheets before export to Cyberimpact.

Built for a non-technical marketing team — operated entirely from a spreadsheet interface.

## Features

- 🏷️ **Multi-brand support** — Separate brand contexts, personas, and content pillars per organization
- 🤖 **AI-generated content** — Claude API generates: Objet, Préheader, Accroche, Introduction, Offre, CTA
- 📋 **Context sidebar** — In-sheet sidebar for selecting brand, persona, content pillar, and partner
- 📅 **Visual calendar** — Editorial planning sidebar calendar
- 🔤 **Partner name normalization** — Levenshtein distance-based matching
- 🎛️ **Dynamic dropdowns** — Brand-filtered cascading dropdowns for personas and pillars
- 📖 **Non-technical guide** — Built-in `📋 Guide` sheet for team onboarding

## Architecture

```
Google Sheets (UI layer)
├── Code.gs              — Main logic, Claude API calls
├── ContextSidebar.html  — Content generation interface
├── CalendrierSidebar.html — Editorial calendar UI
└── Sheets:
    ├── Personas         — Brand-specific persona definitions
    ├── Pilliers         — Content pillars per brand
    ├── Partenaires      — Partner list with normalization
    └── 📋 Guide        — User documentation
```

## Output Format (Cyberimpact fields)

| Field | Description |
|---|---|
| `Objet` | Email subject line |
| `Préheader` | Preview text |
| `Accroche` | Hook / opening line |
| `Introduction` | Body introduction |
| `Offre` | Main offer or value proposition |
| `CTA` | Call to action |

## Setup

1. Copy the Google Sheet template to your Drive
2. Add your Claude API key to Script Properties: `CLAUDE_API_KEY`
3. Configure brand names in the `Personas` and `Pilliers` sheets
4. Open sidebar via **Extensions → Apps Script → Run sidebar**

## Status

🟢 Production — actively used for bi-weekly newsletter campaigns.
