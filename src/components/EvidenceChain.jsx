/**
 * EvidenceChain — why something was flagged, in four steps a non-expert can follow.
 *
 * The problem this solves: the previous interface presented a table of three
 * numbers and expected the reader to work out the relationship themselves. A
 * field labelled "Inspector Observed: 320m" next to "Contractor Reported: 500m"
 * only explains something if you already know what the system does with them.
 *
 * So this walks the chain in the order it actually happened, with each step
 * stating what it means before moving on:
 *
 *     1  Sanctioned   — what was approved and paid for
 *     2  Claimed      — what the contractor says was done
 *     3  Observed     — what an independent inspection actually found
 *     4  Compared     — the difference, and whether it breaches tolerance
 *
 * Every step is numbered, states its figures in plain words, and is attributed
 * to somebody. The conclusion is written as a sentence, not a badge.
 *
 * The tolerance is shown as the working, not hidden: a reader who disagrees with
 * the flag should be able to see exactly which rule fired and by how much.
 */

import { Callout, StatusBadge, TONE_TEXT } from './ui'
import {
  formatQuantity,
  formatRupees,
  TOLERANCE,
  DISCREPANCY_KIND_META,
} from '../domain/reconcile'

const STEP_ICON = {
  sanctioned: '§',
  claimed: '✎',
  observed: '◎',
  compared: '≠',
  concluded: '✓',
}

function Step({ n, kind, title, who, when, figure, meaning, tone = 'neutral', children }) {
  const toneText = tone === 'neutral' ? 'text-ink-2' : TONE_TEXT[tone]
  return (
    <li className="relative pl-11 pb-5 last:pb-0">
      {/* Connector */}
      <span
        aria-hidden="true"
        className="absolute left-[13px] top-7 bottom-0 w-px bg-hairline last:hidden"
      />
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 w-7 h-7 rounded-full grid place-items-center text-xs font-bold border bg-paper ${toneText} ${
          tone === 'neutral' ? 'border-border' : 'border-current'
        }`}
      >
        {STEP_ICON[kind] ?? n}
      </span>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs font-semibold text-ink-muted tabular-nums">{n}</span>
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {who && <span className="text-xs text-ink-muted">· {who}</span>}
        {when && <span className="text-xs text-ink-muted">· {when}</span>}
      </div>

      {figure && (
        <div className={`mt-1.5 font-mono text-lg tabular-nums ${toneText}`}>{figure}</div>
      )}

      {meaning && <p className="mt-1.5 text-sm text-ink-2 leading-relaxed">{meaning}</p>}
      {children}
    </li>
  )
}

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

export function EvidenceChain({ milestone, project }) {
  if (!milestone) return null

  const unit = milestone.commitment.unit === 'metre' ? 'm' : milestone.commitment.unit
  const { commitment, report, inspection } = milestone
  const observedCheck = milestone.checks?.find((c) => c.observedVariance !== null)
  const noObsCheck = milestone.checks?.find((c) => c.kind === 'no_observation')
  const duplicate = milestone.checks?.find((c) => c.kind === 'duplicate_evidence')

  const sanctioned = commitment.quantity
  const claimed = report?.claimedQuantity ?? null
  const observed = inspection?.observedQuantity ?? null

  // The conclusion, as a sentence rather than a status code.
  let verdictTone = 'pending'
  let verdictTitle = ''
  let verdictBody = ''

  if (observed != null && claimed != null) {
    const shortfall = claimed - observed
    const pct = Math.abs((shortfall / claimed) * 100)
    const breached = Math.abs(observedCheck?.observedVariance ?? 0) > TOLERANCE.observedVsReported

    if (shortfall > 0 && breached) {
      verdictTone = 'flagged'
      verdictTitle = 'Flagged — the claimed work is not on the ground'
      verdictBody =
        `The contractor claimed ${claimed}${unit} and the inspection found ${observed}${unit}. ` +
        `That is ${shortfall}${unit} less than claimed — a ${pct.toFixed(0)}% difference, well beyond ` +
        `the ${Math.round(TOLERANCE.observedVsReported * 100)}% tolerance this system allows. ` +
        `A discrepancy was opened and is waiting for an officer's decision.`
    } else if (shortfall > 0 && !breached) {
      verdictTone = 'verified'
      verdictTitle = 'Verified — the difference is within tolerance'
      verdictBody =
        `The inspection found ${observed}${unit} against a claim of ${claimed}${unit}. ` +
        `The ${shortfall}${unit} difference is inside the ${Math.round(
          TOLERANCE.observedVsReported * 100
        )}% tolerance, so no discrepancy was raised.`
    } else if (shortfall === 0) {
      verdictTone = 'verified'
      verdictTitle = 'Verified — the claim matches the site exactly'
      verdictBody = `The claim of ${claimed}${unit} was confirmed by independent measurement.`
    } else {
      verdictTone = 'info'
      verdictTitle = 'Recorded — more was found than claimed'
      verdictBody =
        `The inspection found ${observed}${unit}, which is ${Math.abs(shortfall)}${unit} more than ` +
        `the ${claimed}${unit} claimed. This is recorded for completeness.`
    }
  } else if (claimed != null && observed == null) {
    verdictTone = 'pending'
    verdictTitle = 'Waiting for an independent inspection'
    verdictBody =
      `A claim of ${claimed}${unit} has been filed, but nobody has measured the site yet. ` +
      `Nothing is confirmed and nothing is disputed until an inspector records what is ` +
      `physically there. A contractor's own report cannot verify itself.`
  } else {
    verdictTone = 'neutral'
    verdictTitle = 'Nothing reported yet'
    verdictBody = `No completion claim has been filed against this ${sanctioned}${unit} of sanctioned work.`
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-ink mb-1">What happened, step by step</h3>
      <p className="text-sm text-ink-muted mb-5 leading-relaxed">
        Three different parties report three different things. The system compares them and
        says plainly whether they agree.
      </p>

      <ol className="relative">
        <Step
          n="1"
          kind="sanctioned"
          title="Approved and paid for"
          who={project?.ward ?? 'Ward office'}
          when={fmtDate(project?.sanctionedOn)}
          figure={formatQuantity(sanctioned, unit)}
          meaning={
            <>
              The sanctioned scope for <strong className="font-semibold">{milestone.title}</strong>,
              budgeted at {formatRupees(project?.budget ?? 0)}. This is the benchmark every
              later figure is measured against.
            </>
          }
        />

        <Step
          n="2"
          kind="claimed"
          title="Contractor reported complete"
          who={report?.reportedBy}
          when={fmtDate(report?.reportedAt)}
          figure={claimed == null ? 'No claim filed' : formatQuantity(claimed, unit)}
          meaning={
            report ? (
              <>
                {report.note ? `“${report.note}” ` : ''}This is an <em>assertion</em> — it has not
                been checked by anyone independent.
                {report.evidenceLabel && (
                  <>
                    {' '}
                    Evidence supplied: <span className="font-mono text-xs">{report.evidenceLabel}</span>.
                  </>
                )}
              </>
            ) : (
              'The contractor has not reported any completion against this milestone yet.'
            )
          }
        />

        <Step
          n="3"
          kind="observed"
          title="Independent inspection"
          who={inspection?.inspectedBy}
          when={fmtDate(inspection?.inspectedAt)}
          figure={observed == null ? 'Not yet inspected' : formatQuantity(observed, unit)}
          tone={observed == null ? 'neutral' : 'verified'}
          meaning={
            inspection ? (
              <>
                Measured on site, separately from the contractor.{' '}
                {inspection.note && <>Inspector&rsquo;s note: “{inspection.note}”</>}
              </>
            ) : (
              <>
                No officer has measured this site yet. Until somebody does, the claim above
                stands unverified — the system will not treat it as delivered.
              </>
            )
          }
        />

        <Step
          n="4"
          kind="compared"
          title="System comparison"
          who="JanDrishti"
          figure={
            observedCheck?.observedVariance == null
              ? 'Nothing to compare yet'
              : `${observedCheck.observedVariance >= 0 ? '+' : ''}${(
                  observedCheck.observedVariance * 100
                ).toFixed(1)}% difference`
          }
          tone={
            observedCheck?.deviates ? 'flagged' : observedCheck?.deviates === false ? 'verified' : 'neutral'
          }
          meaning={
            observedCheck ? (
              <>
                The rule applied compares the inspection against the claim and allows a{' '}
                <strong className="font-semibold">
                  ±{Math.round(TOLERANCE.observedVsReported * 100)}%
                </strong>{' '}
                difference. A gap wider than that is treated as a discrepancy and referred to
                a person.
              </>
            ) : (
              'No comparison is possible until both a claim and an inspection exist.'
            )
          }
        >
          {noObsCheck && (
            <div className="mt-2 text-xs text-status-text-pending">
              Also noted: no independent observation is on record, so the claim cannot be
              corroborated.
            </div>
          )}
          {duplicate && (
            <div className="mt-2 text-xs text-status-text-flagged">
              Also noted: the contractor&rsquo;s evidence and the inspection reference the same
              image file, so they are not independent records.
            </div>
          )}
        </Step>
      </ol>

      {/* The conclusion, stated as a sentence */}
      <div className="mt-5">
        <Callout tone={verdictTone} title={verdictTitle}>
          {verdictBody}
        </Callout>
      </div>

      {/* Findings, each with its own plain-language explanation */}
      {milestone.discrepancies.length > 0 && (
        <div className="mt-5">
          <h4 className="text-2xs uppercase tracking-wide text-ink-muted mb-2">
            Findings raised against this milestone
          </h4>
          <ul className="space-y-2">
            {milestone.discrepancies.map((d) => (
              <li
                key={d.id}
                className="border border-hairline rounded-lg px-3.5 py-3 bg-canvas"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                  <span className="text-sm font-medium text-ink">
                    {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge
                      tone={
                        d.status === 'resolved'
                          ? 'verified'
                          : d.status === 'dismissed'
                            ? 'neutral'
                            : 'flagged'
                      }
                      label={d.status === 'under_review' ? 'under review' : d.status}
                    />
                  </span>
                </div>
                <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">{d.detail}</p>
                {d.resolution && (
                  <p className="text-sm text-ink-2 mt-2 pt-2 border-t border-hairline leading-relaxed">
                    <span className="text-ink-muted">Decision: </span>
                    {d.resolution}
                    <span className="text-ink-muted"> — {d.resolvedBy}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default EvidenceChain
