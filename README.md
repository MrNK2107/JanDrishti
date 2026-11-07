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
| Public site | Working — homepage, worked example, stated limits |
| Authentication | Working — sign in, sign up with roles, sign out, session restore, guards |
| Public record | Working — readable without an account, read-only by construction |
| Ward Officer portal | Working — delivery chart, discrepancy review, audit trail |
| Field Inspector portal | Working — observation capture with immediate reconciliation |
| Contractor portal | Working — progress reports against sanctioned scope |
| Reconciliation engine | Working — 3 rules, pure and fully tested |
| API layer | Working — client + mock backend with latency, validation, persistence |
| Unit tests | 82 passing |
| Browser verification | 40 checks passing, including a live pixel-level WCAG audit |
| Accessibility | 36/36 palette pairings meet WCAG AA |
| Production build | Clean (~110 kB gzipped) |
| **Real server** | **Not implemented — the API layer is an in-browser mock** |
| **Demo video** | **Not made — see `VIDEO_SHOTLIST.md`** |

Two things this project does *not* have, stated up front: there is **no server**
— the API layer is a mock that runs in the browser — and there is **no assembled
video**. Everything else listed above is implemented and verified.

---

## Quick start

Requires Node 18+.

```bash
npm install
npm run dev          # http://localhost:3002
```

You land on the public homepage. To reach the working portals, sign in with a
seeded ward account or create your own:

| Role | Email | Password |
|---|---|---|
| Ward Officer | `officer@jandrishti.in` | `ward12` |
| Field Inspector | `inspector@jandrishti.in` | `ward12` |
| Contractor | `contractor@jandrishti.in` | `ward12` |

These are also offered as one-click entries on the sign-in page, so a reviewer can
move between roles without typing. Accounts created through the sign-up form are
stored by the API and behave identically.

Other scripts:

```bash
npm test             # 82 unit tests
npm run contrast     # WCAG audit of the palette; exits 1 on regression
npm run build        # production build
npm run verify       # browser verification (needs dev server running)
npm run verify:full  # tests + contrast + build + browser verification
```

`npm run verify` drives a real Chrome through the whole product — landing,
sign-in, guards, the full reconciliation loop, the public record, sign-up and sign
-out — and writes screenshots to `screenshots/`. It uses a browser already
installed on the machine rather than downloading one.

---

## How the application is put together

```
Public                                  Signed in
────────────────────────────            ──────────────────────────────────────
/            homepage                   /ward               officer home
/login       sign in                    /ward/discrepancies review queue
/signup      create account             /ward/audit         audit trail
/record      public record              /field              inspector
                                        /works              contractor
```

The public record is reachable without an account on purpose: a resident should
not have to register to see how their ward's money was spent. Everything else is
guarded by both session and role, and a signed-in user who lacks a role is sent
to what they *can* do rather than shown a 403.

**The API is a real boundary.** Every screen talks to `src/api/client.js`, which
delegates to `src/api/mockBackend.js`. The mock has latency, validates input,
returns HTTP-like errors, and holds state server-side. Replacing it with a real
server means writing a module with the same method names and changing one import
— no screen, store, or component changes.

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
├── api/
│   ├── client.js           the only module that talks to a backend
│   └── mockBackend.js      the backend: latency, validation, auth, persistence
├── domain/                 framework-free, pure
│   ├── reconcile.js            reconciliation rules and formatting
│   ├── seed.js                 the ward's opening records
│   └── selectors.js            raw records -> view-ready values
├── store/
│   └── StoreProvider.jsx   session + records; a client, not an owner
├── components/
│   ├── ui.jsx              primitives; owns every status colour
│   ├── feedback.jsx        toasts, modals, confirm dialog
│   ├── AppShell.jsx        chrome, role-based navigation, user menu
│   ├── DeliveryChart.jsx   delivery-against-sanction bars
│   ├── EvidenceChain.jsx   the four-step explanation
│   └── ProjectDetail.jsx   one project's record
└── pages/                  public site, auth, and the working portals
```

**Derived values are never stored.** Milestone and project status are computed
from the evidence on every render. Keeping a status field alongside the evidence
would create two sources of truth that can disagree — the exact failure this
product exists to detect.

**The store is a client, not an owner.** Records come from the API and are held
for rendering; after every write the relevant collections are re-read from the
backend. Nothing is mutated locally and hoped to match.

**Explanations are computed, not written into components.** The sentences that
explain a shortfall come from `deliveryProgress()` and `projectSummary()` in
`src/domain/reconcile.js`, so every screen explains the same facts the same way,
and the wording is unit-tested rather than reviewed by eye.

---

## The API layer, and what it is not

`src/api/mockBackend.js` stands in for a server, and is shaped like one: endpoints
return JSON envelopes, mutate a server-side store rather than React state,
validate input, throw HTTP-like errors, and take 120–320 ms so that loading states
are real rather than theoretical.

It is **not a server**, and the honest consequences are:

- State lives in `localStorage`, so it is per-browser, not shared between users.
- Sessions live in `sessionStorage` and are not signed or verified remotely.
- Passwords are digested with a non-cryptographic hash. The *flow* is real; the
  security is not. Real credentials would be verified server-side against a proper
  password hash.
- Reads are public and writes are role-checked, but the check runs in the browser,
  so it is product behaviour rather than a security boundary.

Replacing it with a real server means writing a module with the same method names
and changing the import in `src/api/client.js`. Nothing else moves.

### Seeded state

Three projects, one per lifecycle state, so every branch of the logic is visible
without any setup:

| Project | State | What it demonstrates |
|---|---|---|
| T Nagar Main Road Resurfacing | **Flagged** | Reported 500 m, measured 320 m — the case study |
| Anna Nagar West Storm Drain | **Verified** | Report and measurement agree within tolerance |
| Saidapet Bridge Pavement | **Awaiting measurement** | Report on file, nothing measured yet |

Saidapet is the natural first thing to try: sign in as an inspector, measure it
below the reported figure, and watch a discrepancy open immediately.

---

## The interface

The primary visual is a **delivery chart**. Each project is drawn as a bar
measured against what was sanctioned, and the bar stops where an independent
inspection found the work to end. Anything between that point and the contractor's
reported figure is drawn as a hatched outline, because it is an assertion rather
than a measured fact.

```
T Nagar Main Road Resurfacing                          ! Flagged
████████████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
Sanctioned 500 m · reported 500 m · measured 320 m · not delivered 180 m
Short by 180 m. Contractor claims 500 m but inspection found only 320 m —
64% of the sanctioned 500 m.
```

Three deliberate choices make it legible rather than decorative:

- **Length carries the magnitude.** Colour only marks reconciliation state, so the
  chart survives greyscale, colourblindness, and a bad projector.
- **The reported-but-not-delivered span is an outline**, never a solid fill. It is
  the difference between what somebody asserted and what was verified.
- **Every row carries a plain-language sentence.** If the chart does not land, the
  sentence still does — and vice versa.

Selecting a project opens a four-step explanation of how the conclusion was
reached:

1. **Approved and paid for** — the sanctioned benchmark
2. **Contractor reported complete** — an assertion, attributed and dated
3. **Independent inspection** — what was measured on site
4. **System comparison** — the rule applied, its tolerance, and the real variance

then the conclusion written as a sentence, and any finding with its disposition.
The tolerance is shown as working, so a reader who disagrees with a flag can see
exactly which rule fired and by how much.

### Why there is no map

An earlier version drew projects as stations on a transit network over a cadastral
grid. It was removed because it encoded the wrong thing: a transit diagram
expresses *sequence and connection*, and this data has neither. The projects were
not stops on a line, the connecting line meant nothing, and the stations sat in a
row because that was the only way to arrange them. The visual implied structure
that did not exist, which is why it explained nothing.

### Why the theme is light

Chosen on measurement, not taste. The status red that failed AA as text on a dark
ground (4.26:1) reaches **4.58:1** on white, and the green needs far less
darkening. Status colours carry **dark** text here: white on these fills measures
2.06–4.17:1, below AA. That is also why the original 1.75:1 pairing was a defect
rather than a style preference.

The ground is a warm off-white rather than a cool grey. The app is a document
surface, and warm neutrals read as paper; a cool grey reads as a form control.

---

## Accessibility

The original palette failed five WCAG AA pairings. The worst was porcelain text on
the amber fill at **1.75:1**, against a 4.5:1 requirement. An early status report
recorded this correctly; a later delivery summary reclassified it as an
"intentional design choice". It was not — it was unreadable.

The palette now separates a colour's **fill** role from its **text** role. Text
tones are derived by [`tools/palette-light.mjs`](tools/palette-light.mjs) and
[`tools/solve-warm.mjs`](tools/solve-warm.mjs), which search for the lightest
variant of each brand hue that clears AA on the *darkest* ground in use — chosen
by measurement, not by eye.

All **36 pairings** the app actually renders pass, verified two ways: statically
via `npm run contrast`, and against the live DOM by `npm run verify`.

Status is never conveyed by colour alone — every status surface carries a label
and a distinct glyph, so the interface survives both colourblindness and a
greyscale screenshot.

---

## Testing

**82 unit tests** cover the reconciliation rules, the API contract (authentication,
authorisation, validation, persistence), the derived selectors, and the
explainability copy. They run in under a second.

**40 browser checks** ([`tools/verify-browser.mjs`](tools/verify-browser.mjs))
cover what unit tests cannot: that the public site renders and reads as a product,
that the auth pages work including failure cases, that protected routes are
actually protected, that the palette passes AA *in rendered pixels*, and that the
accountability loop closes end to end —

> contractor reports progress → inspector measures a conflicting figure → a
> discrepancy opens automatically → a Ward Officer upholds it with a written
> reason → the decision appears in the public record.

Eight real bugs were found by these checks rather than by unit tests. All are
recorded in [`DECISIONS.md`](DECISIONS.md); the most instructive was a read
endpoint (`me()`) that cleared the stored token when it could not resolve a
session, so a second concurrent boot during React's StrictMode double-mount
destroyed valid sessions and every reload appeared to sign the user out.

---

## Scope

**Target:** municipal road repair and resurfacing in one ward. Chosen because
worksites are observable, locations are mappable, quantities are measurable, and
before/after evidence is understandable.

**Explicitly out of scope:** replacing GeM, CPGRAMS, or existing procurement
systems; payment authorisation; automated fraud determination; facial recognition
or Aadhaar processing.

**Product principles**

1. Evidence before claims — completion must be supported by proof
2. Independent verification — contractor and inspector data stay distinguishable
3. Traceability — full audit trail with timestamps and actors
4. Explainability — show what was expected, submitted, observed, and why it was flagged
5. Human accountability — software flags, humans decide

---

## Roadmap

1. **Real server** — replace `mockBackend.js` with HTTP endpoints; Postgres +
   PostGIS, row-level security per role, storage for evidence, proper password
   hashing verified server-side
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
