# JanDrishti

**Connecting public project commitments to on-ground evidence.**

A digital accountability platform for publicly funded infrastructure. JanDrishti
reconciles three independent sources of truth and publishes where they disagree:

1. **Approved commitment** — what was sanctioned and budgeted
2. **Contractor report** — what the contractor claims was delivered
3. **Independent observation** — what a field inspector actually measured

When the reported figure and the observed figure diverge beyond a published
tolerance, a discrepancy is opened, assigned to a human, and its resolution is
recorded in a public audit trail.

Submission for the **National Student Ideation Challenge** — Track A
(Product/Technology), Theme: *Surakshit Bharat — Digital Public Infrastructure*.

---

## Status at a glance

| Component | State |
|---|---|
| Ward Admin portal | Working — map, discrepancy queue, audit trail |
| Contractor portal | Working — claim submission against sanctioned scope |
| Inspector interface | Working — observation capture with immediate reconciliation |
| Citizen portal | Working — read-only public record |
| Reconciliation engine | Working — 3 rules, pure and fully tested |
| Unit tests | 68 passing |
| Browser verification | 24 checks passing, including a live WCAG audit |
| Accessibility | 19/19 palette pairings meet WCAG AA |
| Production build | Clean (~97 kB gzipped) |
| **Backend** | **Not implemented — see below** |
| **Demo video** | **Not made — see `VIDEO_SHOTLIST.md`** |

Two things this project does *not* have, stated up front because the previous
documentation was not honest about them: there is **no database or
authentication**, and there is **no assembled video**. Everything else listed
above is implemented and verified.

---

## Quick start

Requires Node 18+.

```bash
npm install
npm run dev          # http://localhost:3002
```

Other scripts:

```bash
npm test             # 68 unit tests (domain + store + components)
npm run contrast     # WCAG audit of the palette; exits 1 on regression
npm run build        # production build
npm run verify       # browser verification (needs dev server running)
npm run verify:full  # tests + contrast + build + browser verification
```

`npm run verify` drives a real Chrome through the full accountability loop and
writes screenshots to `screenshots/`. It uses a browser already installed on the
machine rather than downloading one.

---

## The reconciliation model

This is the core of the product, and it lives in one pure module:
[`src/domain/reconcile.js`](src/domain/reconcile.js). It imports no framework and
performs no I/O.

**Tolerances** are policy, not physics, so they are named, exported, and shown in
the UI. A reviewer can see the rule that flagged them:

| Rule | Tolerance | What it catches |
|---|---|---|
| Reported vs approved | ±2% | Overclaiming beyond sanctioned scope |
| Observed vs reported | ±5% | The claim not matching physical reality |
| Duplicate evidence | exact hash match | Same photograph submitted as two observations |

A shortfall beyond 25% of the claim is graded **high severity**.

Three decisions inside this module are worth knowing, because each fixes a bug
the tests caught:

- **A missing observation is only reportable once something has been claimed.**
  Flagging untouched milestones buried real findings in noise.
- **A claim with no observation is `awaiting inspection`, not `flagged`.**
  Insufficient evidence is not a finding of wrongdoing. If filing a claim
  immediately flagged it, the flag would mean nothing.
- **A resolved discrepancy clears the flag.** Otherwise resolution was
  decorative and a finding could never be closed.

The full reasoning is in [`DECISIONS.md`](DECISIONS.md).

---

## Architecture

```
src/
├── domain/            # framework-free, pure
│   ├── reconcile.js       reconciliation rules and formatting
│   ├── seed.js            three seeded projects, one per lifecycle state
│   └── selectors.js       raw records -> view-ready values
├── store/
│   └── StoreProvider.jsx  reducer, actions, sessionStorage persistence
├── components/
│   ├── ui.jsx             primitives; owns every status colour
│   ├── AppShell.jsx       shared chrome across the four portals
│   ├── TransitDiagram.jsx cadastral grid + transit network
│   ├── ProjectStation.jsx one project as a station
│   └── DiscrepancyQueue.jsx the review surface
└── pages/             # the four portals
```

**Derived values are never stored.** Milestone and project status are computed
from the evidence on every render. Keeping a status field alongside the evidence
would create two sources of truth that can disagree — the exact failure this
product exists to detect.

**The four portals are one product.** They share one store and are one click
apart, because the accountability loop is only visible when you move between
them.

---

## Why there is no backend

The Supabase client remains in [`src/lib/supabase.js`](src/lib/supabase.js) and is
unused by the demo path. This is a deliberate trade-off, not an omission.

A competition demo runs once, on hardware you do not fully control, often on
someone else's network. A live database adds signup failure, expired keys, CORS,
and cold-start latency as possible causes of a demo that does not work. The
reconciliation logic — the part that carries the product's claim — is fully
exercised without any of that risk.

The cost is real and worth stating: **this is a demonstration, not a deployed
system.** There is no persistence beyond the browser session, no authentication,
no role enforcement, and no file storage. The Citizen portal is read-only
because it dispatches no actions, which is a structural property rather than an
enforced permission.

### Seeded state

Three projects, one per lifecycle state, so every branch of the logic is
visible without any setup:

| Project | State | What it demonstrates |
|---|---|---|
| T Nagar Main Road Resurfacing | **Flagged** | Claimed 500 m, observed 320 m — the case study |
| Anna Nagar West Storm Drain | **Verified** | Claim and observation agree within tolerance |
| Saidapet Bridge Pavement | **Awaiting inspection** | Claim on file, no observation yet |

Saidapet is the entry point for the live walkthrough: record an observation
against it and watch the system decide, rather than being shown a verdict.

State persists to `sessionStorage`, so a reload mid-walkthrough does not discard
your work. Use **Reset demo data** in the sidebar to return to seed.

---

## Accessibility

The original palette failed five WCAG AA pairings. The worst was porcelain text
on the amber fill at **1.75:1**, against a 4.5:1 requirement. An early status
report recorded this correctly; a later delivery summary reclassified it as an
"intentional design choice". It was not — it was unreadable.

The palette now separates a colour's **fill** role from its **text** role. The
brand hues are unchanged as fills; text variants are each brand hue mixed 10%
toward white, the minimum shift that clears AA on every ground. Those values were
derived by [`tools/pick-palette.mjs`](tools/pick-palette.mjs), not chosen by eye.

All 19 pairings the app actually renders now pass, verified two ways: statically
via `npm run contrast`, and against the live DOM by `npm run verify`.

Status is also never conveyed by colour alone — every status surface carries a
label and a distinct glyph, so the interface survives both colourblindness and a
greyscale screenshot.

---

## Testing

**68 unit tests** cover the reconciliation rules, the reducer, the derived
selectors, and the station component. They run in under a second.

**24 browser checks** ([`tools/verify-browser.mjs`](tools/verify-browser.mjs))
cover what unit tests cannot: that all four routes render without console
errors, that the palette passes AA *in rendered pixels*, and that the
accountability loop closes end to end —

> contractor files a claim → inspector records a conflicting observation →
> a discrepancy opens automatically → a Ward Officer resolves it with a written
> finding → the disposition appears in the citizen record.

Two bugs were found by this browser walkthrough rather than by unit tests, both
recorded in [`DECISIONS.md`](DECISIONS.md): a memory-only store that silently
discarded all work on any hard navigation, and a missing favicon.

---

## Scope

**Target:** municipal road repair and resurfacing in one ward. Chosen because
worksites are observable, locations are mappable, quantities are measurable, and
before/after evidence is understandable.

**Explicitly out of scope:** replacing GeM, CPGRAMS, or existing procurement
systems; payment authorisation; automated fraud determination; facial
recognition or Aadhaar processing.

**Product principles**

1. Evidence before claims — completion must be supported by proof
2. Independent verification — contractor and inspector data stay distinguishable
3. Traceability — full audit trail with timestamps and actors
4. Explainability — show what was expected, submitted, observed, and why it was flagged
5. Human accountability — software flags, humans decide

---

## Roadmap

1. **Backend** — Supabase Postgres + PostGIS, row-level security per role,
   storage for evidence, real authentication
2. **Evidence integrity** — real content hashing on upload, perceptual image
   similarity to catch resubmitted photographs
3. **Inspector offline mode** — capture at sites with no connectivity, sync later
4. **Field pilot** — 5–10 real projects in one ward, read-only integration with
   existing municipal records

---

## Licence

ISC.

> JanDrishti connects public project promises to on-ground evidence, helping
> authorities and citizens verify whether taxpayer-funded infrastructure was
> actually delivered.
