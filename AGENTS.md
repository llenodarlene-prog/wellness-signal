# Wellness Signal Repository Rules

- Work on a feature branch.
- Never push directly to `staging` or `main`.
- Run `npm run verify` before opening a pull request.
- Run `npm run release:check` before production.
- Staging must remain noindex.
- Production builds must never deploy into the staging document root.
- Do not commit credentials, SSH keys, tokens, or private source exports.
- Do not mark `launch_status` ready until the site, content, legal pages, and production configuration have been reviewed.

## Final QA and Fact-Check for Incoming Drafts

The editor researches and fact-checks every draft before sending it. The agent
still runs one final QA layer on every draft before it is scheduled; nothing is
scheduled until this pass is complete and reported.

1. **Fact-check:** check every specific claim (prices, figures, percentages,
   dates, study sizes, named features and limits) against the cited source.
   Use the publisher's own page or the PubMed/NCBI record. Record each as
   confirmed, contradicted, or unverifiable (page blocked or changed).
2. **Arithmetic:** recalculate every total, percentage and worked example.
3. **Links:** every external link resolves; internal links point to live or
   scheduled posts only (no references to articles that do not exist).
4. **Claims language:** no health promises, no claims beyond what the source
   says, product status (approved, compounded, experimental) stated exactly.
5. **Draft leftovers:** remove internal notes (CMS, "suggested internal
   links", affiliate placement, "verify before publishing") and replace them
   with reader-facing disclosures where needed.
6. **SEO checks:** `npm run verify` for every publish date in the batch.
7. **Report:** tell the editor what was confirmed, what was fixed, and what
   could not be verified, before asking them to merge. Contradicted claims are
   fixed or removed; unverifiable claims are flagged for the editor to decide.
