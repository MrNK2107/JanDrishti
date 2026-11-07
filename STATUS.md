# Status

Current build state of JanDrishti, stated plainly. Every figure here was
measured; none is estimated. Where something is not done, it says so.

Previous versions of this file and of `DELIVERY.md` overstated the build — a
305-line file described as 540 lines, five local functions described as eight
reusable components, and an unfixed accessibility defect listed as fixed while
still failing. `DELIVERY.md` has been removed; the corrections are recorded in
[`DECISIONS.md`](DECISIONS.md).

---

## Verified state

| Measure | Value | How it was measured |
|---|---|---|
| Unit tests | **75 passing** | `npm test` |
| Browser checks | **32 passing** | `npm run verify` (real Chrome) |
| Palette pairings | **32/32 meet WCAG AA** | `npm run contrast` + live-DOM audit |
| Production build | **clean, 97 kB gzipped** | `npm run build` |
| Source size | **~1,900 lines** across `src/` | file count |
| Runtime dependencies added | **0** | see `package.json` |

---

## What is implemented

**Reconciliation engine** — [`src/domain/reconcile.js`](src/domain/reconcile.js).
Three tolerance rules, pure and framework-free, fully tested.

**Ward Officer** — [`src/pages/AdminDashboard.jsx`](src/pages/AdminDashboard.jsx).
A delivery-against-sanction chart (worst-first), the discrepancy review queue, and an
append-only audit trail. The project detail walks the evidence chain in four steps —
sanctioned, claimed, observed, compared — and shows the reconciliation output for
every rule, including the ones that passed.

**Contractor Portal** — claim submission against sanctioned scope. States the
tolerance before submission. Cannot mark work complete.

**Inspector Interface** — records the independent observation that is the only
source of a finding, and shows the reconciliation verdict on site.

**Citizen Portal** — the public record. Read-only by construction: it dispatches
no actions and renders no form.

**Demo voiceover** — eight segments, 2:23 total, in [`video/audio/`](video/audio/).

**Recording guide** — [`VIDEO_SHOTLIST.md`](VIDEO_SHOTLIST.md) and
[`video/storyboard.html`](video/storyboard.html), which plays the narration and
counts down each shot.

---

## What is not implemented

### No backend

There is no database, no authentication, and no role enforcement. The Supabase
client at [`src/lib/supabase.js`](src/lib/supabase.js) is configured but unused by
the demo path.

State lives in the browser session (`sessionStorage`) and is seeded from
[`src/domain/seed.js`](src/domain/seed.js). This is a deliberate trade-off for a
one-shot demo: a live database would add signup failure, key expiry, CORS, and
cold starts as ways for the demo to fail, without exercising the part of the
product that carries its claim.

**Consequence:** this is a demonstration, not a deployable system. Records do not
persist beyond the browser session, and nothing enforces that an inspector
cannot also act as an officer.

### No demo video

The screen recording and assembly steps are yours. The voiceover and a full shot
list exist; the capture does not.

### No evidence integrity

`evidenceHash` values are deterministic strings generated from the record, not
real content hashes. The duplicate-evidence rule works, but it compares
synthetic identifiers. Real content hashing and perceptual image similarity are
roadmap items.

### Not built

- Inspector offline capture and sync
- Named assignment of findings to individuals
- Notifications
- Export, reporting, or analytics
- Any integration with existing municipal systems

---

## Browser verification

[`tools/verify-browser.mjs`](tools/verify-browser.mjs) drives the full loop in a
real browser and writes screenshots to `screenshots/`:

> contractor files a claim → inspector records a conflicting observation → a
> discrepancy opens automatically → a Ward Officer resolves it with a written
> finding → the disposition appears in the citizen record.

It also measures contrast on **92 rendered text nodes**, so the accessibility fix
is verified in pixels rather than only in config.

Two defects were found by this walkthrough that unit tests could not see, because
both concern the browser rather than the logic:

1. **The store was memory-only.** Navigating by URL is a full document request,
   so any hard navigation silently discarded every claim, observation, and
   finding. A single refresh mid-demo lost the entire session. Now persisted to
   `sessionStorage` under a versioned key.
2. **No favicon existed**, and `index.html` declared none, so every page load
   logged a 404.

Four further defects were found by unit tests during development. All six are
documented in [`DECISIONS.md`](DECISIONS.md), because the reasoning matters more
than the fix.

---

## Accessibility

The inherited palette failed five AA pairings; the worst was porcelain text on
the amber fill at **1.75:1** against a 4.5:1 requirement.

The palette now separates a colour's fill role from its text role. Brand hues are
unchanged as fills; text variants are each hue mixed 10% toward white, derived by
[`tools/pick-palette.mjs`](tools/pick-palette.mjs) rather than chosen by eye.

Status is never conveyed by colour alone — every status surface also carries a
label and a glyph, so the interface survives colourblindness and greyscale
screenshots.

---

## Honest assessment

**Working and verified:** the reconciliation logic, all four portals, the full
accountability loop, accessibility, and build health.

**Weakest points, in order:**

1. **No backend.** The largest gap between what this demonstrates and what a
   pilot would require.
2. **Seeded data only.** Three projects. The model is real; the scale is not.
3. **Synthetic evidence hashes.** The duplicate-detection rule cannot catch a
   genuinely resubmitted photograph.
4. **No video.** The last deliverable for a submission whose format expects one.

**Ready for:** demo presentation, design review, stakeholder walkthrough.
**Needs before a pilot:** database, authentication, real evidence storage, and
field testing against actual municipal records.
