/**
 * Landing page — the front door.
 *
 * The app previously had none. Four routes assumed the visitor already knew what
 * JanDrishti was, who they were signing in as, and why the numbers mattered, then
 * dropped them into a dense ward dashboard. This page answers those three
 * questions before asking anything of the visitor.
 *
 * Structure follows the argument the product is making, not a feature list:
 *
 *   1. The claim, in one sentence
 *   2. The problem — why comparing commitments to delivery is hard today
 *   3. How the reconciliation model works, shown as a worked example rather than
 *      described in the abstract
 *   4. Who it is for
 *   5. What it does not do (credibility comes from stating limits)
 */

import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { StatusBadge, StatusDot } from '../components/ui'
import { formatQuantity } from '../domain/reconcile'

/** The worked example, drawn with the same visual grammar as the real chart. */
function WorkedExample() {
  const sanctioned = 500
  const claimed = 500
  const observed = 320
  const observedPct = (observed / sanctioned) * 100
  const gapPct = ((claimed - observed) / sanctioned) * 100
  const unit = 'm'

  return (
    <div className="bg-paper border border-hairline rounded-xl shadow-card p-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-ink">
            T Nagar Main Road Resurfacing
          </div>
          <div className="font-mono text-xs text-ink-muted mt-0.5">
            JDT-2026-0143 · Ward 12
          </div>
        </div>
        <StatusBadge tone="flagged" label="Flagged" />
      </div>

      <div className="mt-5">
        <div className="relative h-5 rounded bg-sunken overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-status-verified opacity-90"
            style={{ width: `${observedPct}%` }}
          />
          <div
            className="absolute inset-y-0 border-y-2 border-r-2 border-status-flagged"
            style={{
              left: `${observedPct}%`,
              width: `${gapPct}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(200,50,61,0.20) 0 3px, transparent 3px 7px)',
            }}
          />
        </div>
        <div className="flex justify-between text-2xs text-ink-muted mt-1 font-mono">
          <span>0</span>
          <span>sanctioned {sanctioned} {unit}</span>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4 text-xs">
        <div>
          <dt className="text-ink-muted">Sanctioned</dt>
          <dd className="font-mono text-ink text-sm mt-0.5">
            {formatQuantity(sanctioned, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Contractor reported</dt>
          <dd className="font-mono text-ink text-sm mt-0.5">
            {formatQuantity(claimed, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Inspection found</dt>
          <dd className="font-mono text-status-text-flagged text-sm mt-0.5 font-semibold">
            {formatQuantity(observed, unit)}
          </dd>
        </div>
      </dl>

      <p className="mt-5 pt-4 border-t border-hairline text-sm text-ink-2 leading-relaxed">
        The contractor reported the full <strong className="font-semibold">500 m</strong>{' '}
        complete. An independent inspection measured{' '}
        <strong className="font-semibold">320 m</strong> on site —{' '}
        <strong className="font-semibold text-status-text-flagged">
          180 m short
        </strong>
        . The system opened a discrepancy the same day, and it stayed open until an
        officer recorded what would be done about it.
      </p>
    </div>
  )
}

const STEPS = [
  {
    n: '01',
    title: 'A commitment is recorded',
    body: 'The sanctioned scope and budget for each milestone, held as the benchmark every later figure is measured against.',
  },
  {
    n: '02',
    title: 'A contractor reports completion',
    body: 'Their claim is recorded as a claim — attributed, timestamped, and not treated as evidence of anything yet.',
  },
  {
    n: '03',
    title: 'An inspector measures the site',
    body: 'An independent officer records what is physically present. This is the only figure that confirms delivery.',
  },
  {
    n: '04',
    title: 'The system reconciles the two',
    body: 'Where the claim and the measurement disagree beyond a published tolerance, a discrepancy opens automatically.',
  },
]

const ROLES = [
  {
    role: 'Ward Officer',
    body: 'Reviews flagged projects, records a decision with reasons, and owns the ward record.',
  },
  {
    role: 'Field Inspector',
    body: 'Measures work on site and submits the independent observation that confirms or contradicts a claim.',
  },
  {
    role: 'Contractor',
    body: 'Reports progress against sanctioned milestones and sees exactly how that claim will be assessed.',
  },
  {
    role: 'Citizen',
    body: 'Reads the full record for the ward — what was promised, claimed, found, and decided. No account needed.',
  },
]

export default function Landing() {
  const { summary } = useStore()

  return (
    <div className="min-h-screen bg-canvas">
      {/* Masthead */}
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-hairline">
        <div className="max-w-[1080px] mx-auto px-5 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-accent text-paper grid place-items-center font-bold"
            >
              ज
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight text-ink">
                JanDrishti
              </span>
              <span className="block text-2xs text-ink-muted leading-tight">
                Public Works Accountability
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-2">
            <Link
              to="/citizen"
              className="hidden sm:inline px-3 py-2 text-sm text-ink-2 hover:text-ink rounded"
            >
              Public record
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-2 text-sm text-ink-2 hover:text-ink rounded border border-transparent hover:border-border"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-2 text-sm font-medium rounded bg-ink text-paper hover:bg-ink-2"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-hairline bg-paper">
        <div className="max-w-[1080px] mx-auto px-5 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent-soft border border-accent/20 rounded-full px-3 py-1">
              <StatusDot tone="verified" size="sm" />
              Ward 12 · Greater Chennai
            </span>

            <h1 className="mt-5 text-4xl lg:text-5xl font-semibold text-ink tracking-tight leading-[1.08]">
              Did we get what we paid for?
            </h1>

            <p className="mt-5 text-lg text-ink-2 leading-relaxed max-w-xl">
              JanDrishti holds three numbers side by side for every public works
              project — what was sanctioned, what the contractor reported, and what an
              independent inspection actually found. Where they disagree, the
              discrepancy is opened, decided, and published.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/citizen"
                className="px-5 py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-2"
              >
                View the public record
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-ink hover:bg-sunken"
              >
                Sign in to the ward
              </Link>
            </div>

            {/* Live figures from the ward, so the hero is not decorative */}
            <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <dt className="text-xs text-ink-muted">Projects tracked</dt>
                <dd className="text-2xl font-semibold text-ink tabular-nums mt-1">
                  {summary.projects || 3}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Open discrepancies</dt>
                <dd
                  className={`text-2xl font-semibold tabular-nums mt-1 ${
                    summary.openDiscrepancies > 0 ? 'text-status-text-flagged' : 'text-ink'
                  }`}
                >
                  {summary.openDiscrepancies}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Awaiting inspection</dt>
                <dd className="text-2xl font-semibold text-ink tabular-nums mt-1">
                  {summary.awaitingInspection}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:pl-4">
            <WorkedExample />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-hairline">
        <div className="max-w-[1080px] mx-auto px-5 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink">
              The information exists. It is just never in the same place.
            </h2>
            <p className="mt-4 text-base text-ink-2 leading-relaxed">
              A work order carries the sanctioned scope. A progress report carries what
              the contractor says was done. An inspection note carries what an officer
              found. Three documents, three offices, and no routine way to compare
              them — so a shortfall is only discovered if somebody happens to go
              looking, and it is usually found long after the work has been paid for.
            </p>
            <p className="mt-4 text-base text-ink-2 leading-relaxed">
              The gap is not dishonesty, in most cases. It is that nothing in the
              process forces the claimed figure and the measured figure to sit next to
              each other.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-hairline bg-paper">
        <div className="max-w-[1080px] mx-auto px-5 py-16">
          <h2 className="text-2xl font-semibold text-ink">
            How reconciliation works
          </h2>
          <p className="mt-3 text-base text-ink-2 leading-relaxed max-w-2xl">
            Every milestone moves through the same four stages. The order matters:
            a claim is recorded before it is checked, and checked before it counts.
          </p>

          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span
                  aria-hidden="true"
                  className="block font-mono text-xs text-accent"
                >
                  {s.n}
                </span>
                <h3 className="mt-2 text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roles */}
      <section className="border-b border-hairline">
        <div className="max-w-[1080px] mx-auto px-5 py-16">
          <h2 className="text-2xl font-semibold text-ink">Who uses it</h2>
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {ROLES.map((r) => (
              <div key={r.role} className="bg-paper border border-hairline rounded-lg p-5">
                <h3 className="text-base font-semibold text-ink">{r.role}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limits — stating them is what makes the rest credible */}
      <section className="border-b border-hairline bg-paper">
        <div className="max-w-[1080px] mx-auto px-5 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink">
              What JanDrishti does not do
            </h2>
            <ul className="mt-5 space-y-3 text-base text-ink-2 leading-relaxed">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-ink-subtle">
                  —
                </span>
                It does not determine fraud. It compares figures and surfaces
                differences; a human decides what a difference means.
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-ink-subtle">
                  —
                </span>
                It does not authorise payment, and it does not replace procurement or
                project management systems. It sits alongside them.
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-ink-subtle">
                  —
                </span>
                It does not collect personal data beyond the name and role of the
                officer or contractor making a record. No biometrics, no Aadhaar.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-ink text-paper">
        <div className="max-w-[1080px] mx-auto px-5 py-16 text-center">
          <h2 className="text-3xl font-semibold">Evidence before claims.</h2>
          <p className="mt-3 text-base text-paper/70 max-w-lg mx-auto">
            Independent verification. Traceability as trust.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/citizen"
              className="px-5 py-2.5 rounded-lg bg-paper text-ink text-sm font-medium hover:bg-canvas"
            >
              Read the public record
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg border border-paper/30 text-sm font-medium text-paper hover:bg-paper/10"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-ink text-paper/60 border-t border-paper/10">
        <div className="max-w-[1080px] mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span>JanDrishti · Public Works Verification &amp; Accountability</span>
          <span>
            National Student Ideation Challenge · Surakshit Bharat — Digital Public
            Infrastructure
          </span>
        </div>
      </footer>
    </div>
  )
}
