/**
 * A project as a station on the transit diagram.
 *
 * This component exists as a standalone export because the dashboard's original
 * inline `Station` function could not be tested or reused — a test file was
 * written against `./ProjectStation` that never resolved, and the suite failed
 * on import for as long as it existed.
 *
 * The `data-status` attribute is part of the component's contract, not just a
 * test hook: it lets the cadastral/transit overlay address stations by status
 * and it is what the accessibility audit selects on.
 */

import { TONE_CLASS, TONE_FILL } from './ui'

const STATUS_TONE = {
  verified: 'verified',
  resolved: 'verified',
  flagged: 'flagged',
  pending_inspection: 'pending',
  in_progress: 'pending',
  registered: 'neutral',
}

/** Ring drawn around the selected station so selection is not color-only. */
const RING = {
  verified: 'ring-status-verified',
  flagged: 'ring-status-flagged',
  pending: 'ring-status-pending',
  neutral: 'ring-porcelain-100',
}

export function ProjectStation({ project, selected = false, onClick, showLabel = false }) {
  const tone = STATUS_TONE[project.status] ?? 'neutral'
  const label = project.name || project.location

  return (
    <button
      type="button"
      data-testid="station"
      data-status={project.status}
      aria-label={`${label}, ${project.status}`}
      aria-pressed={selected}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer bg-transparent border-0 p-0"
      style={{ left: project.mapPosition?.x ?? project.coords?.x, top: project.mapPosition?.y ?? project.coords?.y }}
    >
      <span
        className={`block w-3.5 h-3.5 rounded-full border-3 border-midnight-800 ${TONE_FILL[tone]} ${
          selected ? `ring-2 ring-offset-2 ring-offset-midnight-800 ${RING[tone]}` : ''
        }`}
      />

      <span
        className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-1 rounded bg-midnight-950 border border-midnight-700 ${TONE_CLASS[tone]} transition-opacity duration-240 ${
          showLabel || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

export default ProjectStation
