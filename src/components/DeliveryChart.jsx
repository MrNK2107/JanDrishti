/**
 * DeliveryChart — how much of what was paid for actually exists.
 *
 * This replaces the transit diagram. That diagram was a mistake, and it is worth
 * recording why so it is not rebuilt: a transit map encodes *sequence and
 * connection*. This data has neither. Projects were not stops on a line, the
 * connecting line meant nothing, and the stations happened to sit in a row
 * because that was the only way to arrange them. The visual implied structure
 * that did not exist, which is precisely why it explained nothing.
 *
 * The honest question a ward officer or a citizen is asking is:
 *
 *     "We sanctioned 500 m and paid for 500 m. How much of it is really there?"
 *
 * So every row here answers that, in one bar and one sentence:
 *
 *   ████████████░░░░░░░░  ← sanctioned (the full track)
 *   ████████▒▒▒▒          ← delivered (filled) + claimed-but-not-found (outlined)
 *              ↑
 *         100% reference
 *
 * Encoding rules, chosen so the chart cannot mislead:
 *
 *   - Bar LENGTH is the only thing carrying magnitude. Colour never encodes a
 *     number; it only marks the reconciliation state.
 *   - The claimed-but-not-delivered portion is rendered as an outline, not a
 *     solid fill. It is the difference between an assertion and a fact, and it
 *     should not look as solid as something an inspector verified.
 *   - The track always spans the sanctioned quantity, so a 320 m delivery
 *     against 500 m sanctioned is visibly short rather than merely labelled so.
 *   - Every row carries a plain-language sentence. If the chart fails to
 *     communicate, the sentence still does, and vice versa.
 *   - Status is reinforced by a label and glyph, never colour alone.
 */

import { TONE_TEXT, TONE_FILL, TONE_GLYPH } from './ui'
import { formatQuantity } from '../domain/reconcile'

const TONE_OF = {
  verified: 'verified',
  resolved: 'verified',
  flagged: 'flagged',
  pending_inspection: 'pending',
  in_progress: 'pending',
  registered: 'neutral',
}

const LABEL_OF = {
  verified: 'Verified',
  resolved: 'Resolved',
  flagged: 'Flagged',
  pending_inspection: 'Awaiting inspection',
  in_progress: 'In progress',
  registered: 'Registered',
}

/** Percent clamped for drawing. Raw percentages are used for the text. */
const clamp = (n) => Math.max(0, Math.min(100, n))

function Row({ project, selected, onSelect }) {
  const { delivery } = project
  const tone = TONE_OF[project.status] ?? 'neutral'
  const unit = delivery.unit === 'metre' ? 'm' : delivery.unit

  const observedPct = clamp(delivery.observedPercent)
  // The claimed-but-not-found span, drawn between observed and reported.
  const gapPct =
    delivery.reportedPercent == null || delivery.observedPercent == null
      ? 0
      : Math.max(0, clamp(delivery.reportedPercent) - observedPct)

  const shortfall = delivery.missingUnits > 0
  const verified = project.status === 'verified' || project.status === 'resolved'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(project.id)}
      aria-current={selected}
      data-chart-row={project.id}
      aria-label={`${project.name}. ${delivery.plain ?? project.plainSummary}`}
      className={`w-full text-left rounded-lg border px-4 py-3.5 transition-colors ${
        selected
          ? 'border-status-verified bg-paper shadow-card'
          : 'border-hairline bg-paper hover:border-border'
      }`}
    >
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-base font-semibold text-ink">{project.name}</span>
        <span className="font-mono text-xs text-ink-muted">{project.id}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium">
          <span className={TONE_TEXT[tone]} aria-hidden="true">
            {TONE_GLYPH[tone]}
          </span>
          <span className={TONE_TEXT[tone]}>{LABEL_OF[project.status] ?? project.status}</span>
        </span>
      </div>

      {/* The chart row */}
      <div className="mt-3">
        <div className="relative h-6 rounded bg-sunken overflow-hidden" data-chart-track>
          {/* Delivered — the only thing an inspector confirmed */}
          <div
            data-chart-delivered
            className={`absolute inset-y-0 left-0 ${TONE_FILL[tone]} ${
              verified ? '' : 'opacity-90'
            }`}
            style={{ width: `${observedPct}%` }}
          />

          {/* Claimed but not found. Outlined, because it is an assertion. */}
          {gapPct > 0 && (
            <div
              className="absolute inset-y-0 border-y-2 border-r-2 border-status-flagged"
              style={{
                left: `${observedPct}%`,
                width: `${gapPct}%`,
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(202,50,62,0.20) 0 3px, transparent 3px 7px)',
              }}
            />
          )}
        </div>

        {/* Scale label */}
        <div className="flex justify-between text-2xs text-ink-muted mt-1 font-mono">
          <span>0</span>
          <span>
            sanctioned {formatQuantity(delivery.sanctioned, unit)}
          </span>
        </div>
      </div>

      {/* The figures, stated rather than implied */}
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-ink-muted">Sanctioned</dt>
          <dd className="font-mono text-ink">{formatQuantity(delivery.sanctioned, unit)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Contractor claims</dt>
          <dd className="font-mono text-ink">
            {delivery.reported == null ? '—' : formatQuantity(delivery.reported, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Inspection found</dt>
          <dd className={`font-mono ${delivery.observed == null ? 'text-ink-muted' : 'text-ink'}`}>
            {delivery.observed == null ? 'not inspected' : formatQuantity(delivery.observed, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">{shortfall ? 'Not delivered' : 'Shortfall'}</dt>
          <dd
            className={`font-mono ${
              shortfall ? 'text-status-text-flagged font-semibold' : 'text-ink-muted'
            }`}
          >
            {delivery.observed == null
              ? '—'
              : shortfall
                ? formatQuantity(delivery.missingUnits, unit)
                : 'none'}
          </dd>
        </div>
      </dl>

      {/* Plain language. Not decoration — this is the explanation. */}
      <p className="mt-3 text-sm text-ink-2 leading-relaxed">
        {project.plainSummary ?? delivery.plain}
      </p>
    </button>
  )
}

export function DeliveryChart({ projects, selectedId, onSelect }) {
  // Sorted worst-first, because the thing needing attention should not require
  // hunting. Ties broken by size, largest first.
  const order = { flagged: 0, pending_inspection: 1, in_progress: 1, registered: 2, verified: 3, resolved: 3 }
  const sorted = [...projects].sort((a, b) => {
    const t = (order[a.status] ?? 9) - (order[b.status] ?? 9)
    if (t !== 0) return t
    return b.delivery.sanctioned - a.delivery.sanctioned
  })

  const needingAttention = projects.filter((p) => p.status === 'flagged').length

  return (
    <section aria-labelledby="delivery-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 id="delivery-heading" className="text-xl font-semibold text-ink">
            Delivery against sanction
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            How much of what was sanctioned has been confirmed by independent inspection.
            {needingAttention > 0 && (
              <>
                {' '}
                <span className="text-status-text-flagged font-medium">
                  {needingAttention} project{needingAttention > 1 ? 's' : ''} need
                  {needingAttention > 1 ? '' : 's'} attention.
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* One shared legend. Colours are never left for the reader to guess. */}
      <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs text-ink-2 bg-paper border border-hairline rounded-lg px-4 py-2.5">
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-3 rounded-sm bg-status-verified" aria-hidden="true" />
          Delivered — confirmed by inspection
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="w-5 h-3 rounded-sm border-2 border-status-flagged"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(202,50,62,0.20) 0 3px, transparent 3px 7px)',
            }}
            aria-hidden="true"
          />
          Claimed but not found on site
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-3 rounded-sm bg-sunken" aria-hidden="true" />
          Still outstanding
        </span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((p) => (
          <Row
            key={p.id}
            project={p}
            selected={selectedId === p.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">
        A bar stops where the independent inspection found the work to end. The shaded
        outline beyond it is the distance between what the contractor claimed and what was
        actually measured — the discrepancy the system exists to surface.
      </p>
    </section>
  )
}

export default DeliveryChart
