# SEO, AEO and GEO Site SOP

Every brand site follows one rule: content lives in topic silos, each silo has
one pillar page, and every post links up to its pillar, across to siblings, and
gets linked to, so no page is abandoned.

## Step 1: Site Foundations

Built once per brand into the site template. Each item has an automated check;
a failed check blocks the release.

| Item | Rule | How it is checked |
|---|---|---|
| HTTPS | Canonical and site URL use https:// | Validator fails a non-HTTPS site URL |
| sitemap.xml | Live, indexable pages only, with lastmod | Production build; drafts and scheduled posts excluded |
| robots.txt | Production allows crawling and names the sitemap; staging disallows all | Generated per environment |
| noindex | Only on 404, drafts, scheduled posts and staging | Robots meta set by the build |
| Canonical tag | One per page, absolute URL | Validator |
| Title and meta description | Unique per page; description 160 characters or fewer | `check-silos.mjs` |
| Headings | One H1, no skipped levels | `check.mjs`, `check-silos.mjs` |
| Images | Alt text, width and height, full and 800 px versions, compressed | Build and validator |
| og:image and social tags | Every page | Build |
| Clean URL slugs | `/silo/keyword-phrase/`, lowercase, hyphens | `check-silos.mjs` |
| Broken links | No internal link to a missing route | Validator; build unlinks scheduled posts |

## Step 2: Map the Silos

1. List the brand's core topics; each becomes a folder and a category hub page.
2. Pick one pillar per silo (role `hub`): the broadest, highest-volume keyword.
3. List spokes under each pillar (role `supporting`); a post serving two silos
   is a `bridge`, placed in the folder it serves most.
4. Record every post in the content plan: id, title, primary keyword, slug,
   silo, role and planned link targets.

## Step 3: Produce Each Post

A post moves through these gates in order and stays a draft until the last one
passes.

1. **Research record:** keyword data, top competitors and every source URL with
   the date checked.
2. **Draft:** follow the writing rules below.
3. **Editor fact-check:** the editor checks every figure, price, date and
   product claim against the publisher's own page and removes anything that
   cannot be confirmed.
4. **Final AI QA and fact-check (Claude):** an independent second pass before
   scheduling, described below. No post is scheduled or released until this
   pass is complete and its report has been sent to the editor.
5. **QA:** automated checks plus a human read for flow and link accuracy.
6. **Sign-off:** a named person records approval with the date; only then does
   the post switch from draft to published.

### Gate 4: Final AI QA and Fact-Check

| Check | What is done | Outcome |
|---|---|---|
| Fact-check | Every price, figure, percentage, date, study size and named feature is checked against its cited source (publisher page, or the PubMed/NCBI record for studies) | Each claim marked Confirmed, Contradicted or Unverifiable |
| Arithmetic | Every total, percentage and worked example is recalculated | Errors fixed |
| Links | Every external link resolves; internal links point only to live or scheduled posts, never to articles that do not exist | Broken links fixed or removed |
| Claims language | No health promises, nothing beyond what the source says; product status (approved, compounded, experimental) stated exactly | Wording corrected |
| Draft leftovers | Internal notes (CMS, suggested links, affiliate placement, "verify before publishing") removed | Replaced with reader-facing disclosures |
| Site checks | `npm run verify` for every publish date in the batch | Must pass |
| Report | Editor receives what was confirmed, fixed and unverifiable | Contradicted claims are fixed or removed; unverifiable claims are the editor's call |

**Release rule:** the production release PR is opened only after the QA report
has been sent. If drafts reach staging before QA is finished, QA fixes go in a
follow-up PR before the release.

### Writing Rules

- Primary keyword in the title or H1 and in the opening paragraphs.
- Key Takeaways and FAQ sections start straight with the list or questions.
- At least 3 FAQs, written as the questions people search.
- At least 3 links to primary sources, placed on the sentence they support.
- Worked examples use invented inputs and say so; every total is recalculated.
- No AI kill-list words, no em dashes, title-case headings.
- Meta description specific to the post, 160 characters or fewer.
- One featured image per post, unique across the site, with alt text.

## Step 4: Contextual Interlinking

Only links inside the body text count; menus, cards and related lists do not.

| Rule | Applies to | Minimum |
|---|---|---|
| Link up to the pillar | Every spoke | 1 body link to its silo's pillar |
| Link down to every spoke | Every pillar | 1 body link to each published spoke |
| Receive links | Every published post | 2 body links from other posts (a post opening a new silo may count links from posts scheduled in its first 7 days) |
| Link across | Spokes | 1 to 2 links to siblings or a related silo |
| Total | Spokes | 2 to 3 internal links; pillars may exceed this |

Anchor text is the linked post's keyword or a close variant, placed on a
sentence where the topic already comes up, with no new factual claim. Links to
scheduled posts render as plain text until the post goes live.

## Step 5: Schema

Generated by the build from front matter, in one connected JSON-LD `@graph` per
page.

| Page type | Schema types |
|---|---|
| Homepage | Organization, WebSite, WebPage |
| Topic hub | CollectionPage (hasPart = live posts), BreadcrumbList, Organization, WebSite |
| Article or blog | Article or BlogPosting, WebPage, BreadcrumbList, FAQPage, Organization, WebSite; isPartOf = its hub |
| About, contact, legal | WebPage, BreadcrumbList, Organization, WebSite |
| 404 | WebPage only, noindex |

The author is the Organization unless a real, approved person is named.

## Step 6: AEO and GEO

- Answer first under each H2, with the number.
- Question-shaped headings and FAQs that stand alone in 2 to 3 sentences.
- Tables for comparisons; every statistic next to its source.
- `/llms.txt` lists live posts by silo, from the same set as the sitemap.
- Update `updated` (dateModified) when content changes.

## Step 7: Release and Scheduling

1. Work on a feature branch; run `npm run verify`.
2. Pull request into `staging`; review the noindex preview.
3. Final AI QA report sent (Step 3, Gate 4).
4. Pull request from `staging` into `main`.
5. Posts publish on their date via the nightly run at 00:07 UTC (usually
   starting 30 to 40 minutes late). Default cadence is 2 posts per day.
6. The morning after each publish date, confirm the run succeeded and the
   posts are live; re-run the deploy once if it failed.

## Step 8: Off-Site and Measurement

| Task | Tool | When |
|---|---|---|
| Verify domain, submit sitemap | Google Search Console, Bing Webmaster Tools | At launch |
| Analytics | Google Analytics 4 | At launch |
| Manual actions and indexing errors | Search Console | Weekly |
| Core Web Vitals | PageSpeed Insights | Monthly |
| Rankings per primary keyword | Ubersuggest or rank tracker | Weekly |
| Lost clicks and cannibalisation | Search Console Performance | Monthly |
| Backlink gap and mentions | Ubersuggest, brand monitoring | Monthly |
| AI visibility | ChatGPT, Gemini, Google AI Mode | Monthly |
