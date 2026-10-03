# Wellness Signal

Static publishing repository for **Wellness Signal**, an evidence-aware wellness publication bridging lifestyle reporting and market intelligence.

**Tagline:** Health Insights for Healthier Tomorrow.

## Stack

Node.js 22+, ES modules, zero npm dependencies, and plain static HTML output in `dist/`.

## Commands

```bash
npm ci
npm run verify
npm run release:check
npm run dev
```

`npm run verify` cleans, builds, validates, and tests the repository.

`npm run release:check` is the production gate and is expected to fail while launch approvals, public contact details, privacy review, brand clearance, and published-content sign-offs are incomplete.

## Sources of Truth

- `data/site.json` — brand and environment settings
- `data/content-plan.json` — 10-article + 10-blog launch plan
- `content/research/*.json` — per-piece evidence and QA records
- `AGENTS.md` — canonical editorial and repository rules
- `docs/BRAND.md` — visual system
- `docs/CONTENT-WORKFLOW.md` — editorial production flow
- `data/release.json` — launch approvals and core-route gate

## Branch Flow

`feature/*` → pull request to `staging` → review noindex staging deployment → release pull request from `staging` to `main`.

Do not push directly to `staging` or `main`.

## Brand Note

The portfolio tracker uses the internal key `WellSignal`, while the public display name is **Wellness Signal**. Public-facing metadata and site copy use the approved public display name.

The tracker also flags name clearance for attorney review before launch. The repository keeps that approval false until reviewed.
