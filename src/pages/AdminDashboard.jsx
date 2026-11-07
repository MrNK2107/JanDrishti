import { useState } from 'react'

// Sample project data including the 500m road case
const sampleProjects = [
  {
    id: 'JDT-2026-0143',
    name: 'Road Resurface 500m',
    location: 'T Nagar Main Road',
    zone: 'C',
    budget: '₹8,00,000',
    contractor_reported: '500m',
    inspector_observed: '320m',
    status: 'flagged',
    issue: 'Quantity Mismatch',
    coords: { x: 350, y: 150 }
  },
  {
    id: 'JDT-2026-0138',
    name: 'Storm Drain Repair',
    location: 'Anna Nagar West Ext',
    zone: 'A',
    budget: '₹3,50,000',
    status: 'verified',
    coords: { x: 200, y: 150 }
  },
  {
    id: 'JDT-2026-0152',
    name: 'Pavement Work 200m',
    location: 'Saidapet Bridge',
    zone: 'B',
    budget: '₹5,20,000',
    status: 'pending',
    coords: { x: 500, y: 150 }
  }
]

export default function AdminDashboard() {
  const [selectedProject, setSelectedProject] = useState(sampleProjects[0])

  return (
    <div className="flex h-screen bg-midnight-900">
      {/* Left Rail Navigation */}
      <div className="w-[260px] bg-midnight-950 border-r border-midnight-700 flex flex-col">
        <div className="px-5 py-6 border-b border-midnight-700">
          <h1 className="text-lg font-semibold">JanDrishti</h1>
        </div>
        <nav className="flex-1 py-5">
          <NavItem icon="●" label="Project Map" active />
          <NavItem icon="■" label="Register Project" />
          <NavItem icon="▲" label="Inspections" />
          <NavItem icon="◆" label="Discrepancies" />
          <NavItem icon="○" label="Reports" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-midnight-950 border-b border-midnight-700 px-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ward 12 – Public Works</h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-midnight-800 border border-midnight-700 rounded-md text-sm hover:bg-midnight-700">
              Filter by Status
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 grid grid-cols-[1fr,380px] gap-6">
          {/* Map Area with Transit Diagram + Cadastral Grid */}
          <div className="bg-midnight-800 border border-midnight-700 rounded-lg p-8 relative">
            {/* Cadastral Grid Overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#748A9D" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Coordinate Labels */}
            <div className="absolute top-4 left-4 bg-midnight-800/95 border border-midnight-700 px-3 py-2 text-xs">
              <div className="font-mono">80.2708°E, 13.0827°N</div>
              <div className="text-porcelain-200 mt-1">Ward 12 | Scale 1:5000</div>
            </div>

            {/* North Arrow */}
            <div className="absolute top-4 right-4 w-10 h-14 bg-midnight-800/95 border border-midnight-700 flex items-center justify-center text-2xl text-flagged">
              ↑
            </div>

            {/* Transit Network Diagram */}
            <div className="relative h-full pt-20 px-12">
              {/* Transit Lines */}
              <TransitLine color="verified" start={{x:50, y:150}} end={{x:650, y:150}} />
              <TransitLine color="flagged" start={{x:350, y:150}} end={{x:350, y:450}} vertical />
              <TransitLine color="pending" start={{x:200, y:300}} end={{x:350, y:450}} diagonal />

              {/* Project Stations */}
              {sampleProjects.map(project => (
                <Station
                  key={project.id}
                  project={project}
                  selected={selectedProject?.id === project.id}
                  onClick={() => setSelectedProject(project)}
                />
              ))}

              {/* Additional stations */}
              <Station project={{id: 'x1', name: 'MG Road', coords: {x:50, y:150}, status: 'verified'}} />
              <Station project={{id: 'x2', name: 'Guindy', coords: {x:650, y:150}, status: 'registered'}} />
              <Station project={{id: 'x3', name: 'Kodambakkam', coords: {x:350, y:300}, status: 'pending'}} />
              <Station project={{id: 'x4', name: 'Vadapalani', coords: {x:350, y:450}, status: 'registered'}} />
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4">
            {/* Stats */}
            <StatCard label="Active Projects" value="23" change="+3 this month" />
            <StatCard label="Flagged" value="5" change="2 unresolved" color="flagged" />

            {/* Project Detail Card */}
            {selectedProject && (
              <div className="flex-1 bg-midnight-800 border border-midnight-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-wider text-porcelain-200 mb-3">
                  Recent Activity
                </div>
                <div className="space-y-3">
                  <ProjectListItem project={selectedProject} active />
                  {sampleProjects.filter(p => p.id !== selectedProject.id).map(p => (
                    <ProjectListItem key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                  ))}
                </div>

                {/* Selected Project Details */}
                {selectedProject.issue && (
                  <div className="mt-6 pt-6 border-t border-midnight-700">
                    <div className="text-xs uppercase tracking-wider text-porcelain-200 mb-3">
                      Discrepancy Details
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-porcelain-200">Project:</span>{' '}
                        <span className="font-mono">{selectedProject.id}</span>
                      </div>
                      <div>
                        <span className="text-porcelain-200">Location:</span> {selectedProject.location}
                      </div>
                      <div>
                        <span className="text-porcelain-200">Budget:</span> {selectedProject.budget}
                      </div>
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-porcelain-100"></div>
                          <span>Contractor Reported: {selectedProject.contractor_reported}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-verified"></div>
                          <span>Inspector Observed: {selectedProject.inspector_observed}</span>
                        </div>
                      </div>
                      <div className="pt-3">
                        <span className="inline-block px-3 py-1 bg-flagged/20 border border-flagged text-flagged text-xs uppercase tracking-wider rounded">
                          ⚠ {selectedProject.issue}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-l-3 ${
        active
          ? 'bg-midnight-800 border-l-flagged text-white'
          : 'border-l-transparent text-porcelain-100 hover:bg-midnight-800'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function TransitLine({ color, start, end, vertical, diagonal }) {
  const colors = {
    verified: 'bg-verified',
    flagged: 'bg-flagged',
    pending: 'bg-pending'
  }

  if (vertical) {
    return (
      <div
        className={`absolute w-1.5 ${colors[color]}`}
        style={{ left: start.x, top: start.y, height: end.y - start.y }}
      />
    )
  }

  if (diagonal) {
    const width = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI)
    return (
      <div
        className={`absolute h-1.5 ${colors[color]}`}
        style={{
          left: start.x,
          top: start.y,
          width: width,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 0'
        }}
      />
    )
  }

  return (
    <div
      className={`absolute h-1.5 ${colors[color]}`}
      style={{ left: start.x, top: start.y, width: end.x - start.x }}
    />
  )
}

function Station({ project, selected, onClick }) {
  const statusColors = {
    verified: 'bg-verified shadow-[0_0_0_4px_rgba(42,157,143,0.25)]',
    flagged: 'bg-flagged shadow-[0_0_0_4px_rgba(230,57,70,0.25)]',
    pending: 'bg-pending',
    registered: 'bg-porcelain-100'
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{ left: project.coords.x, top: project.coords.y }}
      onClick={onClick}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full border-3 border-midnight-800 ${statusColors[project.status]} ${
          selected ? 'ring-2 ring-porcelain-100' : ''
        }`}
      />
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {project.name || project.location}
      </div>
    </div>
  )
}

function StatCard({ label, value, change, color }) {
  const valueColor = color === 'flagged' ? 'text-flagged' : 'text-porcelain-100'

  return (
    <div className="bg-midnight-800 border border-midnight-700 rounded-lg p-6">
      <div className="text-xs uppercase tracking-wider text-porcelain-200 mb-3">{label}</div>
      <div className={`text-4xl font-semibold ${valueColor}`}>{value}</div>
      {change && (
        <div className={`text-xs mt-2 ${color === 'flagged' ? 'text-flagged' : 'text-verified'}`}>
          {change}
        </div>
      )}
    </div>
  )
}

function ProjectListItem({ project, active, onClick }) {
  const statusDots = {
    verified: 'bg-verified',
    flagged: 'bg-flagged',
    pending: 'bg-pending',
    registered: 'bg-porcelain-200'
  }

  return (
    <div
      className={`p-3.5 rounded border-l-3 cursor-pointer ${
        active
          ? 'bg-midnight-950 border-l-flagged'
          : 'border-l-transparent hover:bg-midnight-950'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-sm font-medium mb-1">
        <div className={`w-2 h-2 rounded-full ${statusDots[project.status]}`} />
        {project.name}
      </div>
      <div className="text-xs text-porcelain-200">
        {project.location} {project.issue && `• ${project.issue}`}
      </div>
    </div>
  )
}
