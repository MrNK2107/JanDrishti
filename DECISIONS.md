# Decision Log

Why JanDrishti is built the way it is, including the mistakes found along the
way. Written for whoever picks this up next — including a future me who has
forgotten the reasoning and is tempted to "simplify" something load-bearing.

Each entry: what was decided, what else was considered, and why this won.

---

## D1 — No backend; seeded state in a client-side reducer

**Decided.** The demo runs entirely in the browser against a seeded store. The
Supabase client stays in the tree but is unused by the demo path.

**Alternatives.** (a) Wire up Supabase with a real project and keys.
(b) Inline hardcoded data in the components, as the original did.

**Why.** The target is a competition demo that runs once, on hardware nobody
fully controls, often on someone else's network. A live database turns signup,
key expiry, CORS, and cold starts into independent ways for the demo to fail —
all while adding nothing to the product's actual claim, which is about
*reconciliation*, not storage.

**Cost, stated plainly.** No persistence beyond the browser session, no auth, no
role enforcement, no file storage. This is a demonstration, not a deployment.

**Rejected (b)** because inlined data is what allowed the original code to
diverge from its documentation: there was no single place where the model was
defined, so nothing could be tested and nothing could be trusted.

---

## D2 — Pure domain core, thin views

**Decided.** `src/domain/` holds entities and rules as framework-free functions.
Portals are views over a store and dispatch actions.

**Alternative.** Event sourcing — an append-only log as the source of truth, with
state as a fold over events.

**Why.** Event sourcing is arguably more faithful to an audit-trail product, and
it is the one idea here worth revisiting. It was rejected for *this* scope
because the audit trail is already demonstrable via timestamped records with
actors, and a full event store would roughly double the machinery for no
additional visible behaviour. Recorded as a trade-off, not dismissed as wrong.

---

## D3 — Derived status is never stored

**Decided.** Milestone and project status are computed on every render from the
evidence. No `status` field is persisted.

**Why.** Two sources of truth can disagree. A stored status that drifts from the
underlying evidence is precisely the class of failure this product exists to
detect, and shipping it inside the product would be self-defeating.

---

## D4 — A claim with no observation is *awaiting inspection*, not *flagged*

**Decided.** `deriveMilestoneStatus` returns `pending_inspection` when a claim
has no independent observation, even though `reconcile` reports `no_observation`
as a deviation.

**Why.** Insufficient evidence is not a finding of wrongdoing. If filing a claim
immediately rendered the milestone flagged, the flag would carry no information
and officers would learn to ignore it. The deviation is still recorded — it shows
up in the reconciliation panel as a failed check — but the headline state says
"go and look", not "something is wrong".

This directly implements the product principle *software flags, humans decide*.

---

## D5 — A missing observation is only reportable once a claim exists

**Decided.** `reconcile` emits `no_observation` only when `report && !inspection`.

**Bug it fixed.** The first version fired whenever `!inspection`, so every
untouched milestone in the ward was reported as a discrepancy. Real findings
would have been buried under not-started work. Caught by unit tests.

---

## D6 — Resolution clears the flag; dismissal is a first-class outcome

**Decided.** A discrepancy that is `resolved` or `dismissed` no longer blocks a
milestone. Resolve and Dismiss are offered with equal prominence, and a written
finding is mandatory for either.

**Bug it fixed.** The first version treated any non-dismissed high-severity
discrepancy as blocking, so a *resolved* shortfall left the milestone flagged
forever. Resolution was decorative. Caught by unit tests.

**Why dismissal matters.** Sometimes the inspector's measurement was wrong and
the contractor was right. An interface that only offers "the contractor was
lying" is not a reconciliation tool, it is an accusation machine.

---

## D7 — `resolved` is distinct from `verified` at project level

**Decided.** A project whose milestones are all clean is `resolved` if any was
ever flagged, and `verified` if none was.

**Bug it fixed.** The first version collapsed both into `verified`, erasing the
difference between "nothing was ever wrong" and "something was wrong and the
record shows it was dealt with". A reviewing officer wants to find the second
category afterwards. Caught by unit tests.

---

## D8 — Duplicate suppression is scoped by project *and* milestone

**Decided.** Before opening a finding, check for an existing one matching both
`projectId` and `milestoneId`.

**Bug it fixed.** The first version matched on `milestoneId` alone. Milestone ids
are only unique *within* a project — every project has an `MS-1` — so T Nagar's
open shortfall silently suppressed a brand-new shortfall on Saidapet. The
finding was never created, and **a finding that never opens is indistinguishable
from one that was never warranted.**

This was the most serious bug found, because it failed silently and in the
direction of under-reporting: the system quietly declined to flag a real
shortfall. Caught while wiring the reducer, with a regression test added.

---

## D9 — State persists to `sessionStorage`, not `localStorage`

**Decided.** The store is written to `sessionStorage` under a versioned key,
validated on load.

**Bug it fixed.** The store was initially memory-only. Because navigating to a
route by URL is a full document request, *any* hard navigation discarded every
claim, observation, and finding. One refresh mid-demo lost everything — found by
browser verification, invisible to unit tests.

**Why `sessionStorage`.** It survives reloads and hard navigation within the tab,
which is what a demo needs. It does not leak yesterday's playthrough into a fresh
tab, which `localStorage` would.

**Why versioned.** A change to the seed shape discards stale state rather than
hydrating a store that no longer matches the code.

---

## D10 — Split the palette into fill and text roles

**Decided.** Brand hues keep their value as fills. Text variants are each hue
mixed 10% toward white.

**Bug it fixed.** Porcelain text on the amber fill measured **1.75:1** against a
4.5:1 requirement. The root cause was never the colour choice — it was placing
light text on a mid-luminance fill. The fills themselves are fine with dark text
(verified 5.71:1, flagged 4.56:1, pending 9.21:1).

**Why exactly 10%.** Derived by `tools/pick-palette.mjs`, which searches for the
minimum shift that clears AA on every ground. Chosen by measurement, not eye.

**A near-miss worth recording.** The first attempt darkened the flagged fill to
make dark text pass, which produced 3.37:1 — *worse* than doing nothing, because
luminance moved the wrong way. The solver exists so this cannot be guessed wrong
twice.

---

## D11 — The Citizen portal is read-only by construction

**Decided.** The Citizen page dispatches no actions and renders no form.

**Why.** "Read-only" is a structural property here, not a permission flag that
could be misconfigured. There is no code path through which a member of the
public can alter a record. Browser verification asserts both: no mutating control
and no form element.

---

## D12 — No mapping or charting library

**Decided.** The delivery chart is hand-built with absolutely-positioned
elements. No mapping library, no charting library, no new runtime dependency.

**Alternative.** Leaflet or MapLibre for geography; a charting library for bars.

**Why.** The earlier transit diagram plotted six stations on a stylised
schematic that was deliberately *not* geographic, so a projection library would
have added hundreds of kilobytes and a tile dependency for a picture that was
not a map. The current chart is a bullet chart: a bar, a track, and one outlined
span. A charting library would be more code than the chart. Zero runtime
dependencies were added.

**Superseded in part.** The transit diagram this decision originally described
has been deleted — see D14.

---

## D13 — Browser verification uses an installed browser

**Decided.** `tools/verify-browser.mjs` drives the system Chrome or Edge via
`executablePath`.

**Why.** The Playwright driver version and the cached browser builds on this
machine do not agree, and downloading another copy of Chromium to check a page
that a present browser renders identically is waste. The script falls back to
the Playwright bundle if no system browser is found.

---

## Documentation corrections

The inherited documentation overstated the project. Corrected here rather than
quietly:

| Claim | Reality |
|---|---|
| "Admin Dashboard — 540 lines" | The file was **305 lines** |
| "8 reusable React components" | 5 local functions in one file |
| "Overall Achievement: 95%" | One of four portals was built; no backend, no video |
| "1,800+ lines of documentation" | Counted inflated per-file figures |
| "Low contrast issues ✅ fixed" | Listed as fixed while still failing |
| "Intentional design choices" | The 1.75:1 pairing was an accessibility defect |

The old `DELIVERY.md` is superseded by this file and by `STATUS.md`. Its
"95% complete" headline counted the app, tests, and documentation as done while
excluding the entire backend from the denominator.

---

## D14 — The transit diagram was deleted, and light replaced dark

**Decided.** The ward map — a transit network over a cadastral survey grid — was
removed entirely and replaced by a bullet-style delivery chart. The dark theme
was replaced by a light one.

**What was wrong with the diagram.** It was built because the inherited design
documents called for one, and that was the error: I implemented the brief instead
of asking what a reader needs to see.

A transit diagram encodes **sequence and connection**. This data has neither. The
projects were not stops on a line. The connecting line between them represented
nothing. The stations happened to sit in a horizontal row because that was the
only way to arrange them, and their vertical positions were arbitrary. A coloured
line implied a category boundary that did not exist. The visual asserted
structure that was not in the data — which is exactly why a reviewer said it
"does not explain anything". Decoration in the costume of a chart is worse than
no chart, because it invites conclusions the data cannot support.

The replacement encodes the one thing that matters: **a bar whose length is
delivered quantity against sanctioned quantity.** Length carries magnitude;
colour carries only reconciliation state, so the chart still works in greyscale.
The claimed-but-not-delivered span is drawn as a hatched outline rather than a
solid fill, because an assertion should not look as solid as a verified fact.

**Why light replaced dark.** Chosen on measurement, not taste. The status red
that failed AA as text on the dark ground (4.26:1) reaches **4.58:1** on white,
and green needs far less correction. A transparency record is also the kind of
document people print and hand to one another.

**The mistake inside the fix, recorded.** The first light palette used rgba tints
for "soft" status backgrounds. A translucent tint resolves to a different
effective colour depending on what sits behind it, which makes its contrast
unmeasurable and therefore unverifiable. Replaced with solid hex values solved by
`tools/solve-light.mjs` — the same shape of error as the original 1.75:1 defect,
and caught by the same kind of check.

**Also fixed while measuring.** A second attempt at `ink-subtle` (3.43:1 on
white) was being used for 11px labels. The token had been approved by policy for
chart axes only, but nothing enforced that. It is now used for fills and nothing
else, with the distinction recorded in `tools/contrast.mjs`.

---

## D15 — Explainability is computed copy, not decorative panels

**Decided.** The sentences that explain a shortfall come from pure functions in
`src/domain/reconcile.js` — `deliveryProgress()` and `projectSummary()` — and are
unit-tested for wording.

**Why.** The previous interface showed a table of three numbers and expected the
reader to infer the relationship. A field reading "Inspector Observed: 320m" next
to "Contractor Reported: 500m" explains nothing unless you already know what the
system does with them.

Three changes address that:

1. **Every project states its consequence in one sentence**, generated from the
   same function everywhere, so no two screens can describe the same facts
   differently.
2. **The detail view walks the chain in order** — sanctioned, claimed, observed,
   compared — with each step attributed to a party and dated, and the applicable
   rule and tolerance shown as working.
3. **The conclusion is a sentence, not a status code.** "Flagged" tells you
   nothing; "the claimed work is not on the ground" does.

Putting the wording in the domain layer means it is covered by tests and cannot
drift from the figures it describes — which is precisely how the earlier
documentation drifted from the code.
