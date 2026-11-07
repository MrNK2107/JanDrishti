/**
 * JanDrishti domain model — framework-free.
 *
 * Nothing in this directory imports React, the DOM, or the network. That is
 * deliberate: the reconciliation rules are the product's actual claim, so they
 * must be testable in isolation and readable without a component tree around
 * them.
 *
 * The central idea: a project's completion is never a single number. It is
 * three independently-attested numbers — what was approved, what the
 * contractor reported, and what an inspector observed — plus the tolerances
 * used to decide when their divergence matters.
 *
 * @typedef {'registered'|'in_progress'|'pending_inspection'|'verified'|'flagged'|'resolved'} ProjectStatus
 * @typedef {'open'|'under_review'|'resolved'|'dismissed'} DiscrepancyStatus
 * @typedef {'quantity_shortfall'|'quantity_overrun'|'no_observation'|'duplicate_evidence'} DiscrepancyKind
 * @typedef {'low'|'medium'|'high'} Severity
 */

/**
 * Reconciliation tolerances. These are policy, not physics, so they live in one
 * named place and are surfaced in the UI — an official must be able to see the
 * rule that flagged them.
 */
export const TOLERANCE = Object.freeze({
  /** Reported may differ from approved by this fraction before it matters. */
  reportVsApproved: 0.02,
  /** Observed may differ from reported by this fraction before it matters. */
  observedVsReported: 0.05,
  /** Beyond this fraction short, the shortfall is treated as high severity. */
  highSeverityShortfall: 0.25,
})

export const UNIT_LABELS = Object.freeze({
  metre: 'm',
  square_metre: 'm²',
  each: 'nos',
  kilometre: 'km',
})

export const PROJECT_STATUS_META = Object.freeze({
  registered: { label: 'Registered', tone: 'neutral' },
  in_progress: { label: 'In Progress', tone: 'pending' },
  pending_inspection: { label: 'Awaiting Inspection', tone: 'pending' },
  verified: { label: 'Verified', tone: 'verified' },
  flagged: { label: 'Flagged', tone: 'flagged' },
  resolved: { label: 'Resolved', tone: 'verified' },
})

export const DISCREPANCY_STATUS_META = Object.freeze({
  open: { label: 'Open', tone: 'flagged' },
  under_review: { label: 'Under Review', tone: 'pending' },
  resolved: { label: 'Resolved', tone: 'verified' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
})

export const DISCREPANCY_KIND_META = Object.freeze({
  quantity_shortfall: { label: 'Quantity Shortfall', tone: 'flagged' },
  quantity_overrun: { label: 'Quantity Overrun', tone: 'pending' },
  no_observation: { label: 'No Independent Observation', tone: 'pending' },
  duplicate_evidence: { label: 'Duplicate Evidence', tone: 'pending' },
})

const pct = (fraction) => `${Math.round(fraction * 100)}%`

/**
 * Round to 3 decimal places to keep floating-point noise out of comparisons and
 * snapshots. Quantities in this domain are metres and counts; 1mm precision is
 * far beyond what any of it needs.
 */
export const round3 = (n) => Math.round(n * 1000) / 1000

/**
 * Compare what was approved against what was reported against what was seen.
 *
 * Pure: same inputs always produce the same checks. No clock, no randomness.
 * Returns one entry per tolerance rule, each carrying the numbers that decided
 * it so the UI can explain the flag rather than merely assert it.
 *
 * @param {{ quantity: number, unit: string }} commitment approved scope
 * @param {{ claimedQuantity: number, reportedAt: string, reportedBy: string }|null} report
 * @param {{ observedQuantity: number, inspectedAt: string, inspectedBy: string }|null} inspection
 * @returns {{ kind: DiscrepancyKind, severity: Severity, detail: string,
 *             deviates: boolean, reportedVariance: number|null,
 *             observedVariance: number|null }[]}
 */
export function reconcile(commitment, report, inspection) {
  const checks = []

  // Rule 1 — did the contractor claim materially more than was approved?
  if (report) {
    const reportedVariance =
      (report.claimedQuantity - commitment.quantity) / commitment.quantity
    checks.push({
      kind: reportedVariance > 0 ? 'quantity_overrun' : 'quantity_shortfall',
      severity: 'low',
      deviates: Math.abs(reportedVariance) > TOLERANCE.reportVsApproved,
      reportedVariance,
      observedVariance: null,
      detail: report
        ? `Contractor reported ${report.claimedQuantity}${UNIT_LABELS[commitment.unit] ?? ''} ` +
          `against an approved ${commitment.quantity}${UNIT_LABELS[commitment.unit] ?? ''} ` +
          `(${reportedVariance >= 0 ? '+' : ''}${pct(reportedVariance)}).`
        : '',
    })
  }

  // Rule 2 — the rule that matters. Is the independent observation consistent
  // with the claim?
  //
  // Note the `report &&` guard. A missing observation is reportable *only once
  // something has been claimed*. A milestone nobody has touched yet is simply
  // not started, and must not be surfaced as a discrepancy — flagging it would
  // bury the real findings in noise. Silence is not verification, but it is
  // also not a claim in need of verifying.
  if (report && !inspection) {
    checks.push({
      kind: 'no_observation',
      severity: 'medium',
      deviates: true,
      reportedVariance: null,
      observedVariance: null,
      detail:
        'No independent physical observation is on record for this milestone. ' +
        'A contractor claim alone does not satisfy the evidence requirement.',
    })
  } else if (inspection && report) {
    const observedVariance =
      (inspection.observedQuantity - report.claimedQuantity) / report.claimedQuantity
    const shortfall = observedVariance < 0 ? Math.abs(observedVariance) : 0
    checks.push({
      kind: observedVariance < 0 ? 'quantity_shortfall' : 'quantity_overrun',
      severity:
        shortfall > TOLERANCE.highSeverityShortfall
          ? 'high'
          : shortfall > 0
            ? 'medium'
            : 'low',
      deviates: Math.abs(observedVariance) > TOLERANCE.observedVsReported,
      reportedVariance: null,
      observedVariance,
      detail:
        `Contractor reported ${report.claimedQuantity}${UNIT_LABELS[commitment.unit] ?? ''}; ` +
        `independent inspection observed ${inspection.observedQuantity}${UNIT_LABELS[commitment.unit] ?? ''} ` +
        `(${observedVariance >= 0 ? '+' : ''}${pct(observedVariance)}).`,
    })
  }

  // Rule 3 — identical evidence hashes across two claims usually mean one
  // photograph was submitted twice. Only fire when both reports exist.
  if (report?.evidenceHash && inspection?.evidenceHash && report.evidenceHash === inspection.evidenceHash) {
    checks.push({
      kind: 'duplicate_evidence',
      severity: 'high',
      deviates: true,
      reportedVariance: null,
      observedVariance: null,
      detail:
        'The contractor submission and the inspection record reference an ' +
        'identical evidence hash. These are not independent observations.',
    })
  }

  return checks
}

/**
 * Convenience wrapper: return only the checks that breached tolerance.
 *
 * @returns {ReturnType<typeof reconcile>}
 */
export function deviations(commitment, report, inspection) {
  return reconcile(commitment, report, inspection).filter((c) => c.deviates)
}

/**
 * The headline outcome for a milestone, in priority order.
 *
 * Priority is not arbitrary, and the order here is load-bearing:
 *
 *   1. A claim with no observation is `pending_inspection`, not `flagged`.
 *      `reconcile` does report `no_observation` as a deviation, but that is a
 *      statement about evidence sufficiency — not a finding of wrongdoing.
 *      Showing the milestone as flagged the instant a contractor files would
 *      make the flag meaningless, and would contradict the product principle
 *      that "software flags, humans decide".
 *   2. Once an observation exists, a live discrepancy flags it.
 *   3. A closed discrepancy is what clears the flag. Checking only
 *      `status !== 'dismissed'` meant a *resolved* shortfall left the milestone
 *      flagged forever, so resolution could never take effect.
 *
 * @param {{ severity: Severity, status: DiscrepancyStatus }[]} openDiscrepancies
 * @param {{ reportedAt: string }|null} report
 * @param {{ inspectedAt: string }|null} inspection
 * @returns {ProjectStatus}
 */
export function deriveMilestoneStatus(openDiscrepancies, report, inspection) {
  const blocking = openDiscrepancies.filter(
    (d) => d.status === 'open' || d.status === 'under_review'
  )
  if (blocking.length > 0) return 'flagged'

  if (!report) return 'registered'
  if (!inspection) return 'pending_inspection'

  if (openDiscrepancies.some((d) => d.status === 'resolved')) return 'resolved'
  return 'verified'
}

/**
 * Roll milestone outcomes up to a project.
 *
 * A project is flagged if any of its milestones is flagged — one unresolved
 * quantity mismatch is not diluted by nine clean milestones.
 *
 * `resolved` is kept distinct from `verified` rather than collapsed into it.
 * "Nothing was ever wrong" and "something was wrong and the record shows it was
 * dealt with" are different facts, and a project that had a finding is exactly
 * what a reviewing officer wants to be able to find afterwards.
 */
export function deriveProjectStatus(milestones) {
  if (milestones.length === 0) return 'registered'
  if (milestones.some((m) => m.status === 'flagged')) return 'flagged'

  const done = (s) => s === 'verified' || s === 'resolved'
  if (milestones.every((m) => done(m.status))) {
    return milestones.some((m) => m.status === 'resolved') ? 'resolved' : 'verified'
  }

  if (milestones.some((m) => m.status === 'pending_inspection')) return 'pending_inspection'
  if (milestones.some((m) => m.status === 'in_progress')) return 'in_progress'
  return 'registered'
}

/**
 * Physical completion against the approved scope, from independent observation
 * where available and from the contractor claim only as a fallback.
 *
 * @returns {{ approved: number, attested: number, basis: 'observed'|'reported'|'none',
 *             percent: number }}
 */
export function completionAgainstCommitment(commitment, report, inspection) {
  const approved = commitment.quantity
  if (inspection) {
    return {
      approved,
      attested: inspection.observedQuantity,
      basis: 'observed',
      percent: approved === 0 ? 0 : round3((inspection.observedQuantity / approved) * 100),
    }
  }
  if (report) {
    return {
      approved,
      attested: report.claimedQuantity,
      basis: 'reported',
      percent: approved === 0 ? 0 : round3((report.claimedQuantity / approved) * 100),
    }
  }
  return { approved, attested: 0, basis: 'none', percent: 0 }
}

/**
 * Format a quantity with its unit label, for display.
 */
export function formatQuantity(value, unit) {
  const label = UNIT_LABELS[unit] ?? unit ?? ''
  const n = Number.isInteger(value) ? value : round3(value)
  return `${n.toLocaleString('en-IN')} ${label}`.trim()
}

/**
 * Format Indian currency. Budget figures in this domain are rupees and are
 * conventionally grouped in lakh/crore, which is why this does not use the
 * default western grouping.
 */
export function formatRupees(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

/**
 * A compact lakh/crore rendering for chart axes and tight labels.
 * ₹8,00,000 is hard to scan at a glance; ₹8.0L is not.
 */
export function formatRupeesShort(amount) {
  const n = Number(amount)
  if (n >= 1e7) return `₹${round3(n / 1e7)}Cr`
  if (n >= 1e5) return `₹${round3(n / 1e5)}L`
  if (n >= 1e3) return `₹${round3(n / 1e3)}K`
  return `₹${n}`
}

/**
 * How far through delivery this milestone actually is, expressed as a
 * percentage of the sanctioned quantity, with the basis named.
 *
 * This exists to make one question answerable without arithmetic: *did we get
 * what we paid for?* Three figures are involved — sanctioned, reported,
 * observed — and the difference between the last two is the entire product.
 *
 * `observedPercent` is the honest number. `reportedPercent` is what the
 * contractor asserts. `gapPercent` is the difference, and it is positive when
 * the claim exceeds reality. Percentages are clamped at 0 for display but the
 * gap is computed from raw values, so an overrun reads as a negative gap.
 *
 * @returns {{
 *   sanctioned: number, reported: number|null, observed: number|null,
 *   reportedPercent: number|null, observedPercent: number|null,
 *   gapPercent: number|null,
 *   basis: 'observed'|'reported'|'none',
 *   shortfallUnits: number|null,
 *   plain: string
 * }}
 */
export function deliveryProgress(commitment, report, inspection) {
  const sanctioned = commitment.quantity
  const unit = UNIT_LABELS[commitment.unit] ?? ''

  const pctOf = (v) => (sanctioned === 0 ? 0 : round3((v / sanctioned) * 100))

  const reported = report ? report.claimedQuantity : null
  const observed = inspection ? inspection.observedQuantity : null

  const reportedPercent = reported == null ? null : pctOf(reported)
  const observedPercent = observed == null ? null : pctOf(observed)

  // The gap is only meaningful once both figures exist.
  const gapPercent =
    reported != null && observed != null ? round3(pctOf(reported) - pctOf(observed)) : null

  const shortfallUnits = reported != null && observed != null ? round3(reported - observed) : null

  const basis = observed != null ? 'observed' : reported != null ? 'reported' : 'none'

  // One sentence a non-expert can read. Deliberately written in plain language
  // and avoided wherever a shorter label will do.
  let plain
  if (basis === 'none') {
    plain = `Nothing reported yet against ${sanctioned}${unit ? ' ' + unit : ''} sanctioned.`
  } else if (basis === 'reported') {
    plain =
      `Contractor reports ${reported}${unit ? ' ' + unit : ''} of ` +
      `${sanctioned}${unit ? ' ' + unit : ''} sanctioned. Not yet independently inspected, ` +
      `so this figure is a claim, not a verified result.`
  } else if (shortfallUnits === 0) {
    plain =
      `Fully delivered. Independent inspection confirms all ` +
      `${sanctioned}${unit ? ' ' + unit : ''} sanctioned.`
  } else if (shortfallUnits > 0) {
    plain =
      `Short by ${shortfallUnits}${unit ? ' ' + unit : ''}. Contractor claims ` +
      `${reported}${unit ? ' ' + unit : ''} but inspection found only ` +
      `${observed}${unit ? ' ' + unit : ''} — ${observedPercent}% of the sanctioned ` +
      `${sanctioned}${unit ? ' ' + unit : ''}.`
  } else {
    plain =
      `Delivered ${observed}${unit ? ' ' + unit : ''} against ` +
      `${sanctioned}${unit ? ' ' + unit : ''} sanctioned — more than sanctioned.`
  }

  return {
    sanctioned,
    reported,
    observed,
    reportedPercent,
    observedPercent,
    gapPercent,
    basis,
    shortfallUnits,
    plain,
  }
}

/**
 * A single plain-language sentence describing a project's overall standing,
 * for the top of a detail panel. Written for someone who has never seen the
 * system before.
 */
export function projectSummary({ name, status, milestones = [], discrepancies = [] }) {
  const live = discrepancies.filter((d) => d.status === 'open' || d.status === 'under_review')
  const first = milestones[0]

  if (status === 'flagged') {
    const high = live.filter((d) => d.severity === 'high').length
    const what = high > 0 ? 'a significant discrepancy' : 'a discrepancy'
    const progress = first
      ? deliveryProgress(first.commitment, first.report, first.inspection)
      : null
    return progress && progress.shortfallUnits > 0
      ? `${name} has ${what} open. ${progress.plain}`
      : `${name} has ${what} open and awaiting an officer's decision.`
  }

  if (status === 'pending_inspection') {
    return `${name} has been reported complete by the contractor but not yet independently inspected. The claim is unverified until an inspector measures the site.`
  }

  if (status === 'resolved') {
    return `${name} had a discrepancy that has since been resolved. The finding and its resolution are recorded below.`
  }

  if (status === 'verified') {
    return `${name} is verified. Independent inspection confirms the work matches what was sanctioned.`
  }

  return `${name} is registered with no progress reported yet.`
}

