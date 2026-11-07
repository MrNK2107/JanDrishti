import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectStation } from './ProjectStation'

/**
 * Repaired from the original suite.
 *
 * Two defects were fixed rather than papered over:
 *   1. it called `vi.fn()` without importing `vi`
 *   2. it asserted `bg-flagged`, the pre-split palette class. The palette now
 *      separates a color's fill role (`bg-status-flagged`) from its text role
 *      (`text-status-text-flagged`), because serving both from one hex value is
 *      what produced the 1.75:1 contrast failure.
 */

const project = (over = {}) => ({
  id: 'test-1',
  name: 'Test Project',
  status: 'flagged',
  coords: { x: 100, y: 100 },
  ...over,
})

describe('ProjectStation', () => {
  it('renders a station marked with its status', () => {
    const { container } = render(<ProjectStation project={project()} />)
    const station = container.querySelector('[data-status="flagged"]')

    expect(station).toBeInTheDocument()
  })

  it('paints the status fill using the fill-role token, not the text token', () => {
    const { container } = render(<ProjectStation project={project()} />)
    const dot = container.querySelector('[data-status="flagged"] > span')

    expect(dot).toHaveClass('bg-status-flagged')
    expect(dot).not.toHaveClass('text-status-text-flagged')
  })

  it('shows the project name', () => {
    render(<ProjectStation project={project({ name: 'Road Resurface' })} />)
    expect(screen.getByText('Road Resurface')).toBeInTheDocument()
  })

  it('falls back to location when a station has no name', () => {
    render(<ProjectStation project={project({ name: undefined, location: 'MG Road' })} />)
    expect(screen.getByText('MG Road')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<ProjectStation project={project()} onClick={handleClick} />)

    screen.getByTestId('station').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when not clicked', () => {
    const handleClick = vi.fn()
    render(<ProjectStation project={project()} onClick={handleClick} />)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('marks the selected station for assistive technology', () => {
    render(<ProjectStation project={project()} selected />)
    expect(screen.getByTestId('station')).toHaveAttribute('aria-pressed', 'true')
  })

  it('carries an accessible label naming the project and its status', () => {
    render(<ProjectStation project={project({ name: 'T Nagar' })} />)
    expect(screen.getByTestId('station')).toHaveAttribute(
      'aria-label',
      'T Nagar, flagged'
    )
  })

  it('maps every project status onto a known tone', () => {
    // A station must never render unstyled because a status was added.
    const statuses = [
      'verified',
      'resolved',
      'flagged',
      'pending_inspection',
      'in_progress',
      'registered',
    ]
    for (const status of statuses) {
      const { container, unmount } = render(
        <ProjectStation project={project({ status })} />
      )
      const dot = container.querySelector(`[data-status="${status}"] > span`)
      expect(dot.className, `status ${status} produced no fill class`).toMatch(
        /bg-(status-|porcelain)/
      )
      unmount()
    }
  })

  it('positions itself from map coordinates when present', () => {
    const { container } = render(
      <ProjectStation project={project({ mapPosition: { x: 42, y: 84 } })} />
    )
    const station = container.querySelector('[data-status="flagged"]')

    expect(station.style.left).toBe('42px')
    expect(station.style.top).toBe('84px')
  })
})
