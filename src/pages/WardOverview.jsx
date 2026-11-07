/**
 * Ward overview — the officer's home.
 *
 * Answers three questions in order: is anything wrong, how bad is each project,
 * and what happened on this one. The delivery chart carries the first two at a
 * glance; selecting a project opens the four-step explanation beneath it.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import {
  PROJECT_STATUS_META,
  formatRupees,
  formatRupeesShort,
} from '../domain/reconcile'
import { DeliveryChart } from '../components/DeliveryChart'
import { ProjectDetail } from '../components/ProjectDetail'
import { EmptyState, Metric, Skeleton } from '../components/ui'

export default function WardOverview() {
  const { projectViews, summary, loading, data } = useStore()
  const [selectedId, setSelectedId] = useState(
    () => projectViews.find((p) => p.status === 'flagged')?.id ?? projectViews[0]?.id
  )

  const selected =
    projectViews.find((p) => p.id === selectedId) ?? projectViews[0]

  if (loading && data.projects.length === 0) {
    return <OverviewSkeleton />
  }

  if (projectViews.length === 0) {
    return (
      <EmptyState title="No projects in this ward yet">
        Sanctioned projects appear here once they are registered against the ward.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {summary.openDiscrepancies === 0
            ? 'No discrepancies need a decision'
            : summary.openDiscrepancies === 1
              ? 'One discrepancy needs a decision'
              : `${summary.openDiscrepancies} discrepancies need a decision`}
        </h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Each project is measured against what was sanctioned. A bar stops where an
          independent inspection found the work to end — anything beyond that is a
          claim the site does not support.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label="Projects tracked"
          value={summary.projects}
          detail={`${formatRupeesShort(summary.totalBudget)} sanctioned in total`}
          emphasis
        />
        <Metric
          label="Open discrepancies"
          value={summary.openDiscrepancies}
          tone={summary.openDiscrepancies > 0 ? 'flagged' : 'verified'}
          detail={
            summary.highSeverity > 0
              ? `${summary.highSeverity} high severity`
              : 'None high severity'
          }
          emphasis
        />
        <Metric
          label="Awaiting inspection"
          value={summary.awaitingInspection}
          tone={summary.awaitingInspection > 0 ? 'pending' : 'verified'}
          detail="Claimed but unverified"
          emphasis
        />
        <Metric
          label="Fully verified"
          value={summary.verified}
          tone="verified"
          detail="Inspection matched the claim"
          emphasis
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
        <DeliveryChart
          projects={projectViews}
          selectedId={selected?.id}
          onSelect={setSelectedId}
        />
        {selected ? (
          <ProjectDetail project={selected} />
        ) : (
          <EmptyState title="Select a project" />
        )}
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
