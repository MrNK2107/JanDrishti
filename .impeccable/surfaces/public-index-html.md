---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["admin-dashboard"]
---

# Admin Dashboard

## Scope

Primary admin interface for government project administrators to register projects, monitor status, and manage the accountability workflow.

## Mode

Operate

## Audience & Job

Municipal engineers and government officials managing public works projects. They need to register projects with specifications, assign contractors and inspectors, monitor progress across multiple projects, identify discrepancies, and track resolution.

## Direction contract

**THESIS:** The admin dashboard organizes project accountability as a network diagram where each project is a station, status flows as colored lines, and discrepancies appear as interchange alerts. This refuses the category default of flat tables or card grids that hide dependencies and status relationships.

**OWN-WORLD:** Midnight-blue enamel ground (#0A1929) with porcelain station markers, scarlet (#E63946) for flagged discrepancies, cobalt (#2A9D8F) for verified projects, amber (#F4A261) for pending inspection. Humanist sans (Inter) at fixed 13px labels, diagram discipline with 45/90-degree angles only. Lines burn brightest for active flows.

**STORY:** Administrator opens to network view showing all ward projects as stations on status lines. Clicking a station reveals the project's commitment → contractor report → inspector observation → resolution chain. Discrepancies glow as interchange alerts. The pattern teaches: green verified line flows freely, red flagged line demands attention, project connections show dependencies.

**FIRST VIEWPORT:** Left rail (260px) with nav, main area splits: network diagram (left, flex) showing projects as stations with status-colored connecting lines (verified green, flagged red, pending amber), right panel (380px) with live stats and recent activity list. The 500m road mismatch project glows red at T Nagar station with "Quantity Mismatch" flag visible on hover.

**FORM:** Midnight transit diagram adapted for project workflow. From catalog world "wayfinding-cartography-signage-midnight-transit-diagram". Station = project location, Line = status flow, Interchange = discrepancy point, Corridor focus = selected project chain.

**SEED:** seed:5809e0f481c0e146

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

