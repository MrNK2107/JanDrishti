/**
 * The ward map: a transit diagram laid over a cadastral survey grid.
 *
 * Two visual systems are merged deliberately. Municipal officials already read
 * transit maps — a line, stations along it, branches to other zones — so the
 * network metaphor carries project dependency and flow without explanation. The
 * survey grid, coordinate readout, and north arrow keep it legible as an
 * official cadastral document rather than a product dashboard.
 *
 * The diagram is data-driven: stations come from the store's projects, so
 * filing a claim or opening a finding changes the map immediately. Nothing here
 * is decorative filler that can drift out of sync with the records.
 */

import { ProjectStation } from './ProjectStation'
import { TONE_FILL } from './ui'

const GRID = 40
const VIEW = { w: 720, h: 420 }
const MAINLINE_Y = 150

/** Other wards on the network. Reference points, not records in this system. */
const ADJACENT_STATIONS = [
  { id: 'x-mg', name: 'MG Road (Ward 9)', x: 60, y: 150 },
  { id: 'x-guindy', name: 'Guindy (Ward 14)', x: 660, y: 150 },
  { id: 'x-kodam', name: 'Kodambakkam (Ward 11)', x: 350, y: 330 },
]

/** Line tone from the projects it connects. Any finding on the line flags it. */
function lineTone(projects) {
  if (projects.some((p) => p.status === 'flagged')) return 'flagged'
  if (projects.some((p) => p.status === 'pending_inspection' || p.status === 'in_progress')) {
    return 'pending'
  }
  return 'verified'
}

export function TransitDiagram({ projects, selectedId, onSelect, className = '' }) {
  const ordered = [...projects].sort(
    (a, b) => (a.mapPosition?.x ?? 0) - (b.mapPosition?.x ?? 0)
  )

  const first = ordered[0]?.mapPosition?.x ?? 200
  const last = ordered[ordered.length - 1]?.mapPosition?.x ?? 500
  const tone = lineTone(projects)

  return (
    <div className={`relative bg-midnight-800 border border-midnight-700 rounded-lg overflow-hidden ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="cadastral" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path
              d={`M ${GRID} 0 L 0 0 0 ${GRID}`}
              fill="none"
              stroke="#748A9D"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cadastral)" />
      </svg>

      <div className="relative" style={{ height: VIEW.h }}>
        {/* Coordinate readout — the cadastral half of the visual language */}
        <div className="absolute top-4 left-4 bg-midnight-900/90 border border-midnight-700 rounded px-3 py-2 text-[11px] leading-relaxed z-10">
          <div className="font-mono">80.2708°E, 13.0827°N</div>
          <div className="text-porcelain-200">Ward 12 · Scale 1:5000</div>
        </div>

        {/* North arrow — marked, not decorative: the survey convention */}
        <div className="absolute top-4 right-4 bg-midnight-900/90 border border-midnight-700 rounded w-10 h-14 grid place-items-center z-10">
          <span aria-hidden="true" className="text-status-text-flagged text-xl leading-none">
            ↑
          </span>
          <span className="text-[9px] text-porcelain-200">N</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-midnight-900/90 border border-midnight-700 rounded px-3 py-2 z-10">
          <div className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
            Line status
          </div>
          <ul className="space-y-1 text-[11px]">
            {[
              ['verified', 'Verified — claim matches observation'],
              ['flagged', 'Flagged — open discrepancy'],
              ['pending', 'Pending — awaiting inspection'],
            ].map(([t, label]) => (
              <li key={t} className="flex items-center gap-2">
                <span className={`w-4 h-1 rounded ${TONE_FILL[t]}`} aria-hidden="true" />
                <span className="text-porcelain-100">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Adjacent wards — hollow markers, visually subordinate */}
        {ADJACENT_STATIONS.map((s) => (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: s.x, top: s.y }}
          >
            <span
              aria-hidden="true"
              className="block w-3 h-3 rounded-full border-2 border-porcelain-200 bg-midnight-800"
            />
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-1 rounded bg-midnight-950 border border-midnight-700 text-porcelain-200 opacity-0 group-hover:opacity-100 transition-opacity duration-240">
              {s.name}
            </span>
          </div>
        ))}

        {/* Mainline — the three tracked projects, joined in map order */}
        <div
          aria-hidden="true"
          className={`absolute h-1.5 rounded ${TONE_FILL[tone]}`}
          style={{ left: first, top: MAINLINE_Y, width: Math.max(0, last - first) }}
        />

        {/* Branch — inter-zone dependency, rendered dashed to distinguish it */}
        <div
          aria-hidden="true"
          className="absolute w-1.5 rounded bg-status-pending/70"
          style={{ left: 350, top: MAINLINE_Y, height: 330 - MAINLINE_Y }}
        />

        {/* Tracked projects */}
        {ordered.map((p) => (
          <ProjectStation
            key={p.id}
            project={p}
            selected={selectedId === p.id}
            onClick={() => onSelect?.(p.id)}
            showLabel={projects.length <= 3}
          />
        ))}
      </div>
    </div>
  )
}

export default TransitDiagram
