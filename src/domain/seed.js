/**
 * Ward 12 — initial dataset.
 *
 * The records the application starts from: three sanctioned projects, their
 * reported figures, and the inspections on file. In a deployed system this would
 * arrive from the municipal works register; here it is the starting state the
 * mock backend loads into its store.
 *
 * The three projects are chosen to exercise the full lifecycle, one state each:
 *
 *   T Nagar    — FLAGGED.   Contractor reported 500m, inspection observed 320m.
 *   Anna Nagar — VERIFIED.  Report and observation agree within tolerance.
 *   Saidapet   — AWAITING.  Report on file, no inspection yet.
 *
 * Timestamps are fixed rather than relative to `Date.now()`. Records whose dates
 * shift on every run make output non-reproducible, which breaks both tests and
 * screenshots.
 */

export const SEED_TIMESTAMP = '2026-11-06T14:30:00+05:30'

/** Reference point for records created by user actions. Fixed for reproducibility. */
export const RECORD_NOW = '2026-11-06T18:00:00+05:30'

const t = (hoursFromSeed) => {
  const base = new Date(SEED_TIMESTAMP).getTime()
  const next = new Date(base + hoursFromSeed * 3600 * 1000)
  return next.toISOString()
}

export function createSeedState() {
  return {
    /** Audit trail. Every state transition appends here; nothing is edited. */
    auditLog: [
      {
        id: 'AUD-0001',
        at: t(-72),
        actor: 'Ward 12 Registry',
        role: 'admin',
        action: 'project_registered',
        subject: 'JDT-2026-0143',
        note: 'Project registered from approved works estimate.',
      },
      {
        id: 'AUD-0002',
        at: t(-70),
        actor: 'Ward 12 Registry',
        role: 'admin',
        action: 'project_registered',
        subject: 'JDT-2026-0138',
        note: 'Project registered from approved works estimate.',
      },
      {
        id: 'AUD-0003',
        at: t(-68),
        actor: 'Ward 12 Registry',
        role: 'admin',
        action: 'project_registered',
        subject: 'JDT-2026-0152',
        note: 'Project registered from approved works estimate.',
      },
      {
        id: 'AUD-0004',
        at: t(-30),
        actor: 'Sri Venkatesh Constructions',
        role: 'contractor',
        action: 'milestone_reported',
        subject: 'JDT-2026-0143 / MS-1',
        note: 'Claimed 500 m of resurfacing complete.',
      },
      {
        id: 'AUD-0005',
        at: t(-26),
        actor: 'Insp. R. Karthikeyan',
        role: 'inspector',
        action: 'inspection_recorded',
        subject: 'JDT-2026-0143 / MS-1',
        note: 'Observed 320 m. Flagged for reconciliation.',
      },
      {
        id: 'AUD-0006',
        at: t(-24),
        actor: 'System',
        role: 'system',
        action: 'discrepancy_opened',
        subject: 'DSC-0001',
        note: 'Observed quantity 36% below claim; exceeds 5% tolerance.',
      },
      {
        id: 'AUD-0007',
        at: t(-12),
        actor: 'Sri Balaji Infra',
        role: 'contractor',
        action: 'milestone_reported',
        subject: 'JDT-2026-0152 / MS-1',
        note: 'Claimed 200 m of pavement work complete. Awaiting inspection.',
      },
    ],

    projects: [
      {
        id: 'JDT-2026-0143',
        name: 'T Nagar Main Road Resurfacing',
        ward: 'Ward 12',
        zone: 'C',
        location: 'T Nagar Main Road, between Thanikachalam Rd and GN Chetty Rd',
        contractor: 'Sri Venkatesh Constructions',
        budget: 800000,
        sanctionedOn: '2026-09-14',
        category: 'road_resurfacing',
        /** Cadastral map position, in the diagram's own coordinate space. */
        mapPosition: { x: 350, y: 150 },
        milestones: [
          {
            id: 'MS-1',
            sequence: 1,
            title: 'Resurfacing — stretch 1',
            commitment: { quantity: 500, unit: 'metre' },
            report: {
              id: 'RPT-0001',
              claimedQuantity: 500,
              reportedAt: t(-30),
              reportedBy: 'Sri Venkatesh Constructions',
              evidenceHash: 'sha256:9f2c4a1e…b7d1',
              evidenceLabel: 'site-north.jpg',
              note: 'Full stretch completed ahead of schedule.',
            },
            inspection: {
              id: 'INS-0001',
              observedQuantity: 320,
              inspectedAt: t(-26),
              inspectedBy: 'Insp. R. Karthikeyan',
              evidenceHash: 'sha256:4d81bb02…c93a',
              evidenceLabel: 't-nagar-verify-01.jpg',
              note:
                'Measured from Thanikachalam Rd junction. Resurfacing ends ' +
                'approximately 180 m short of the sanctioned limit; the ' +
                'remainder is still milled surface.',
            },
          },
        ],
      },
      {
        id: 'JDT-2026-0138',
        name: 'Anna Nagar West Storm Drain Repair',
        ward: 'Ward 12',
        zone: 'A',
        location: 'Anna Nagar West Extension, 3rd Avenue',
        contractor: 'Sri Balaji Infra',
        budget: 350000,
        sanctionedOn: '2026-09-02',
        category: 'storm_drain',
        mapPosition: { x: 200, y: 150 },
        milestones: [
          {
            id: 'MS-1',
            sequence: 1,
            title: 'Drain segment replacement',
            commitment: { quantity: 120, unit: 'metre' },
            report: {
              id: 'RPT-0002',
              claimedQuantity: 120,
              reportedAt: t(-48),
              reportedBy: 'Sri Balaji Infra',
              evidenceHash: 'sha256:77aa10fe…2b40',
              evidenceLabel: 'drain-complete.jpg',
              note: 'Segment replaced and cured.',
            },
            inspection: {
              id: 'INS-0002',
              observedQuantity: 119,
              inspectedAt: t(-44),
              inspectedBy: 'Insp. R. Karthikeyan',
              evidenceHash: 'sha256:1c09ea77…5510',
              evidenceLabel: 'anna-nagar-drain-01.jpg',
              note: 'One metre tolerance at the junction box; within allowance.',
            },
          },
        ],
      },
      {
        id: 'JDT-2026-0152',
        name: 'Saidapet Bridge Pavement Work',
        ward: 'Ward 12',
        zone: 'B',
        location: 'Saidapet Bridge, northern approach',
        contractor: 'Sri Balaji Infra',
        budget: 520000,
        sanctionedOn: '2026-10-01',
        category: 'pavement',
        mapPosition: { x: 500, y: 150 },
        milestones: [
          {
            id: 'MS-1',
            sequence: 1,
            title: 'Approach pavement — northern span',
            commitment: { quantity: 200, unit: 'metre' },
            report: {
              id: 'RPT-0003',
              claimedQuantity: 200,
              reportedAt: t(-12),
              reportedBy: 'Sri Balaji Infra',
              evidenceHash: 'sha256:aa31c7d9…0e18',
              evidenceLabel: 'saidapet-north.jpg',
              note: 'Pavement laid across the full northern approach.',
            },
            // No inspection on file. This is the live walkthrough entry point.
            inspection: null,
          },
        ],
      },
    ],

    /**
     * Discrepancies are records, not derived values. Once the system flags
     * something a human owns it, and the record must outlive any recomputation.
     * The seeded one corresponds to the T Nagar case.
     */
    discrepancies: [
      {
        id: 'DSC-0001',
        projectId: 'JDT-2026-0143',
        milestoneId: 'MS-1',
        kind: 'quantity_shortfall',
        severity: 'high',
        status: 'open',
        openedAt: t(-24),
        openedBy: 'System',
        detail:
          'Contractor reported 500 m against an approved 500 m. Independent ' +
          'inspection observed 320 m — a shortfall of 180 m (36%), well beyond ' +
          'the 5% tolerance.',
        note: '',
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
      },
    ],
  }
}
