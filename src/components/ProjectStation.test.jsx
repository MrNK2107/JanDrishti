import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectStation } from './ProjectStation'

describe('ProjectStation', () => {
  it('renders a project station with correct status color', () => {
    const project = {
      id: 'test-1',
      name: 'Test Project',
      status: 'flagged',
      coords: { x: 100, y: 100 }
    }

    const { container } = render(<ProjectStation project={project} />)
    const station = container.querySelector('[data-status="flagged"]')

    expect(station).toBeInTheDocument()
    expect(station).toHaveClass('bg-flagged')
  })

  it('shows project name on hover', () => {
    const project = {
      id: 'test-1',
      name: 'Road Resurface',
      status: 'verified',
      coords: { x: 100, y: 100 }
    }

    render(<ProjectStation project={project} />)
    const label = screen.getByText('Road Resurface')

    expect(label).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    const project = {
      id: 'test-1',
      name: 'Test',
      status: 'pending',
      coords: { x: 100, y: 100 }
    }

    const { container } = render(<ProjectStation project={project} onClick={handleClick} />)
    const station = container.querySelector('[data-testid="station"]')

    station.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
