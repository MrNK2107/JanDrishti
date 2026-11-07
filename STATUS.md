# Status

Current build state of JanDrishti, stated plainly. Every figure here was
measured; none is estimated. Where something is not done, it says so.

---

## Verified state

| Measure | Value | How it was measured |
|---|---|---|
| Unit tests | **82 passing** | `npm test` |
| Browser checks | **40 passing** | `npm run verify` (real Chrome) |
| Palette pairings | **36/36 meet WCAG AA** | `npm run contrast` + live-DOM audit |
| Production build | **clean, 110 kB gzipped** | `npm run build` |
| Runtime dependencies added | **0** | see `package.json` |

---

## What is implemented

**Public site** — [`src/pages/Landing.jsx`](src/pages/Landing.jsx). The claim, the
problem, a worked example using the ward's real figures, who uses it, and an
explicit statement of what the product does not do.

**Authentication** — [`src/pages/Auth.jsx`](src/pages/Auth.jsx),
[`src/App.jsx`](src/App.jsx). Sign in, sign up with role selection, sign out,
session restore on reload, and route guards that redirect anonymous visitors and
send wrong-role users to what they can do. Seeded ward accounts are offered as
one-click entries so a reviewer can experience every role without registering.

**Public record** — [`src/pages/PublicRecord.jsx`](src/pages/PublicRecord.jsx).
Readable without an account, read-only by construction: it renders no form and
dispatches nothing.

**Ward Officer** — [`src/pages/WardOverview.jsx`](src/pages/WardOverview.jsx),
[`Discrepancies.jsx`](src/pages/Discrepancies.jsx),
[`AuditTrail.jsx`](src/pages/AuditTrail.jsx). A delivery-against-sanction chart
ordered worst-first, a review queue where a decision requires a written reason and
a confirmation step, and an append-only audit trail.

**Field Inspector** — observation capture with the reconciliation verdict shown
on site, while re-measurement is still possible.

**Contractor** — progress reports against sanctioned scope, with the assessment
rule stated before submission rather than after.

**Reconciliation engine** — [`src/domain/reconcile.js`](src/domain/reconcile.js).
Three tolerance rules, pure, framework-free, fully tested.

**API layer** — [`src/api/client.js`](src/api/client.js),
[`src/api/mockBackend.js`](src/api/mockBackend.js). Every screen goes through one
client. The backend behind it has latency, validation, HTTP-like errors,
server-side state, and persistence.

**Interaction polish** — toasts, a confirmation modal for irreversible decisions,
skeleton loading states, inline validation, a global loading bar, mobile
navigation, and a user menu.

---

## What is not implemented

### No real server

`src/api/mockBackend.js` runs in the browser. It is shaped like a server and the
frontend treats it as one, but it is not one. Consequences:

- State is per-browser (`localStorage`), not shared between users.
- Sessions are `sessionStorage` values, not signed tokens.
- Passwords use a non-cryptographic digest. The flow is real; the security is not.
- The role check runs client-side, so it is product behaviour, not a security
  boundary.

Swapping in a real server means implementing the same method names and changing
one import in `src/api/client.js`.

### No demo video

Screen recording and assembly remain yours. The voiceover and a shot list exist.

### No evidence integrity

`evidenceHash` values are deterministic strings derived from the record, not real
content hashes. The duplicate-evidence rule works, but compares synthetic
identifiers.

### Not built

- Password reset and email verification
- Named assignment of findings to individuals
- Notifications beyond in-session toasts
- Export, reporting, or analytics
- Any integration with existing municipal systems

---

## Browser verification

[`tools/verify-browser.mjs`](tools/verify-browser.mjs) drives the whole product in
a real browser and writes screenshots to `screenshots/`:

> public site → sign-in (including a rejected password) → route guards → ward
> overview → report → measure → discrepancy opens → officer upholds it with a
> written reason → decision published in the public record → sign-up → sign-out →
> role separation

It also measures contrast on **129 rendered text nodes**, so accessibility is
verified in pixels rather than only in configuration.

Eight real bugs were found this way rather than by unit tests. The most
instructive: `me()` cleared the stored token when it could not resolve a session —
a read with a destructive side effect. React's StrictMode mounts effects twice in
development, so the second call destroyed a valid session and every reload
appeared to sign the user out.

The others: the backend handed out live internal arrays; an abort flag meant to
make boot idempotent left the app stuck loading forever; the confirm dialog
carried no finding id so decisions were rejected as "not found"; the public record
relied on the authenticated store and rendered empty for anonymous visitors; the
palette's warm ground pushed four status tones below AA; the transit diagram
encoded structure the data did not have; and the shot list described a UI that had
been replaced.

---

## Accessibility

Inherited palette failed five AA pairings; the worst was porcelain text on the
amber fill at **1.75:1**. It is now split into fill and text roles, with text
tones solved by script rather than chosen by eye, and all 36 rendered pairings
pass.

Status is never conveyed by colour alone — every status surface carries a label
and a glyph, so the interface survives colourblindness and greyscale.

---

## Honest assessment

**Working and verified:** the public site, authentication and its guards, all four
portals, the full accountability loop, accessibility, and build health.

**Weakest points, in order:**

1. **No real server.** The largest gap between what this demonstrates and what a
   pilot would require. The API boundary is real; the implementation behind it is
   not.
2. **Per-browser state.** Two judges on two laptops see independent data.
3. **Synthetic evidence hashes.** The duplicate-detection rule cannot catch a
   genuinely resubmitted photograph.
4. **No video.** The last deliverable for a submission whose format expects one.

**Ready for:** demo presentation, design review, stakeholder walkthrough.
**Needs before a pilot:** a real server, verified password hashing, evidence
storage, and field testing against actual municipal records.
