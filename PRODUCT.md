# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

**Intended:** React + Vite + Tailwind CSS + Supabase (PostgreSQL, PostGIS, Auth,
Storage). Chosen for rapid MVP delivery with modern DX, comprehensive backend
services, and geospatial support.

> **Read this as a design document, not a description of the build.** It records
> what the product was specified to be. As implemented, the frontend matches —
> React, Vite, Tailwind — but **Supabase is not wired up**: there is no database,
> auth, or storage in the running app. [`STATUS.md`](STATUS.md) states what
> actually exists; [`DECISIONS.md`](DECISIONS.md) explains why the backend was
> deferred.

## Users

**Government Project Administrator:** Municipal engineers and officials who register projects, approve specifications, assign roles, and monitor delivery. Work at a desk with stable internet. Need consolidated records and structured discrepancy workflows.

**Contractor / Implementing Agency:** Construction companies and agencies that submit milestone progress, upload evidence (photos/videos), report quantities, and respond to discrepancies. Mix of office and field work.

**Field Inspector:** Municipal or third-party inspectors who conduct independent site verification. Work on-site with mobile devices in variable connectivity. Capture GPS coordinates, photos, checklists, and observed quantities.

**Citizen:** General public viewing project information. Access via any device to understand what was promised, what was reported, what was verified, and how discrepancies were resolved.

## Product Purpose

JanDrishti makes every public works project traceable from commitment to delivery by connecting approved specifications, contractor-reported progress, independent field observations, and discrepancy resolution into one evidence-backed record.

The platform addresses a reconciliation gap: public project information exists across work orders, progress reports, and inspection records, but separate records are difficult to reconcile with independently observed outcomes. Citizens cannot easily compare commitments with actual delivery, and responsibility for discrepancies is unclear.

Success means authorities can identify and resolve mismatches between reported and observed work, and citizens can view the full accountability chain for taxpayer-funded infrastructure.

## Positioning

JanDrishti is an **accountability layer** that complements existing government project management and procurement systems rather than replacing them. The differentiator is **evidence reconciliation**: systematically comparing contractor evidence with independent field observations and generating explainable discrepancy alerts, rather than displaying reported progress alone.

Other systems track project status or handle grievances. JanDrishti specifically reconciles three sources of truth—approved commitment, contractor report, and inspector observation—and preserves the history of verification and resolution.

## Operating Context

**Workflows:**
1. Admin registers approved project (commitment baseline)
2. Contractor reports milestone completion with evidence
3. System validates submission (required fields, file hashes, milestone sequence, location metadata)
4. Inspector independently visits site and captures observations
5. System reconciles approved vs reported vs observed
6. Discrepancies create issue records with assignment and deadlines
7. Responsible party responds; corrective work and follow-up inspection recorded
8. Permitted information published to citizens

**Environments:** Admins and contractors work from offices with stable internet. Inspectors work on construction sites with variable mobile connectivity and need offline-capable capture with later sync. Citizens access from anywhere.

**Materials:** Work orders, project specifications, tender documents, completion certificates, photographs, videos, GPS coordinates, quantity measurements, inspection checklists.

## Capabilities and Constraints

**Capabilities:**
- Project registry with unique IDs, geospatial data, and milestone tracking
- Role-based authentication (4 user types with distinct permissions)
- Evidence management: photo/video upload with file hashing, timestamp, GPS metadata
- Independent field verification with mobile-friendly interface
- Automated reconciliation: rule-based checks (missing evidence, location mismatch, quantity differences, duplicate files, milestone sequence)
- Discrepancy resolution workflow with issue tracking, assignment, response history
- Citizen transparency portal with public project search and detail pages
- Interactive map showing project locations and status
- Complete audit trail (actor, action, timestamp)

**Constraints:**
- MVP scope: Municipal road repair and resurfacing within one ward (observable, mappable, measurable)
- Does NOT replace GeM, CPGRAMS, or municipal e-governance platforms
- Does NOT authorize or withhold payments
- Does NOT automatically determine corruption or fraud (software flags, humans decide)
- GPS metadata and device timestamps are signals, not proof of authenticity
- Requires manual project registration initially (no government API access yet)

**Terminology:**
- **Project:** A public works initiative with approved budget and specifications
- **Milestone:** A defined stage of project completion with deliverables
- **Evidence:** Photos, videos, documents submitted as proof of work
- **Reconciliation:** Comparing approved commitments vs contractor reports vs inspector observations
- **Discrepancy:** A flagged mismatch requiring explanation and resolution
- **Verification Status:** Independent inspector's assessment of milestone completion

## Brand Commitments

**Name:** JanDrishti (translates to "public view" or "people's vision")

**Voice:** Professional, government-appropriate, and accessible to non-specialists. Avoid technical jargon. Explanations should be clear enough for citizens while maintaining authority for official use.

**Theme:** Surakshit Bharat – Digital Public Infrastructure (part of National Student Ideation Challenge submission)

**Visual constraints:** Must work in Tamil and English initially. Government-appropriate aesthetic while staying modern and usable.

## Evidence on Hand

**Real content:**
- JanDrishti_Concept_Document.pdf: Complete product requirements, architecture, MVP scope, success metrics
- Hypothetical demonstration scenario: 500m road resurfacing project (₹8 lakh budget) where contractor reports 500m complete but independent inspection records 320m, triggering quantity mismatch discrepancy

**No fabricated content:** No real testimonials, municipal partnerships, or field test results exist yet. This is idea stage moving to prototype. Do not invent government approvals, pilot results, or deployment claims.

## Product Principles

1. **Evidence before claims:** Completion status must be supported by relevant evidence, not just reported progress.

2. **Independent verification:** Contractor submissions and inspector observations remain distinguishable throughout the system. Never auto-convert reported completion to verified completion.

3. **Explainable accountability:** When discrepancies are flagged, show what was expected, what was submitted, what was observed, why it was flagged, and what action is required. Software flags inconsistencies; authorized humans make official decisions.

4. **Traceability as trust:** Important updates retain their source, timestamp, and history. The audit trail is not optional—it's how the platform builds confidence.

5. **Citizen accessibility:** Public information is presented in understandable form. Technical compliance happens in the background; what citizens see must make sense without specialized knowledge.

## Accessibility & Inclusion

- Mobile-friendly inspector interface must work on devices inspectors actually carry (mid-range Android phones common in Indian government field work)
- Offline-capable evidence capture with later synchronization (field sites have variable connectivity)
- Bilingual support (Tamil and English initially) for accessibility in Tamil Nadu pilot context
- Public citizen portal must be understandable by non-specialists (no assumption of technical or bureaucratic literacy)
- Map-based project discovery as alternative to text search (accommodates varying literacy levels)
