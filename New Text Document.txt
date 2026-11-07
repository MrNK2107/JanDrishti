# National Student Ideation Challenge — Application

## 01. Submission Identity

**Title of the solution**

JanDrishti – Public Works Verification & Accountability Platform

**Theme**

Surakshit Bharat – Digital Public Infrastructure

**Problem Statement**

Lack of transparent, evidence-based verification of publicly funded infrastructure projects, resulting in gaps between approved commitments, reported completion and actual on-ground delivery.

**Track**

Track A – Product or Technology

---

## 02. Problem and Solution

### 1. What problem are you solving?
*Maximum 500 words*

Public infrastructure projects are funded using taxpayers' money, yet citizens often lack a reliable way to verify whether the promised work has actually been delivered.

The project lifecycle involves multiple stakeholders, including government departments, contractors, field inspectors and implementing agencies. However, project approvals, work orders, contractor progress reports, inspection records and completion certificates are frequently maintained across different documents and systems.

This fragmentation creates a significant accountability gap. A contractor may report a project as completed, but the reported work may differ from the approved specifications or actual site conditions. Field inspection findings may not be systematically connected to contractor submissions, and defects discovered after completion may not be traceable to the original project record.

Citizens also struggle to understand how much was allocated to a project, what work was promised, what has been completed and whether outstanding issues have been resolved.

Existing project tracking and grievance mechanisms do not necessarily provide a unified, evidence-backed comparison of approved commitments, reported progress and independent field observations.

The problem is not simply the absence of project information. It is the absence of a consistent mechanism to reconcile that information with independently observed outcomes.

JanDrishti addresses this gap by creating a traceable accountability record for public infrastructure projects, connecting project commitments to execution evidence, independent verification and eventual resolution.

### 2. What is your proposed solution?
*Maximum 1,000 words*

JanDrishti is a digital public infrastructure platform designed to make publicly funded infrastructure projects independently traceable and easier to verify.

It connects three critical information sources: approved project commitments, contractor-reported progress and independent field observations. Instead of treating a submitted completion report as proof of successful delivery, JanDrishti maintains a distinction between reported progress and verified outcomes.

The platform consists of six interconnected capabilities:

**1. Public Project Registry**

Every project receives a unique JanDrishti Project ID. Its record contains the approved budget, project location, implementing agency, work specifications, expected completion date, work-order reference and defined milestones. This becomes the central reference for the project's lifecycle.

**2. Project Lifecycle and Milestone Tracking**

Projects progress through defined stages, from approval and work commencement to inspection, verification, completion and maintenance. Each project is divided into measurable milestones with expected deliverables and quantities. Every status transition retains its timestamp, responsible actor and supporting record.

**3. Contractor Evidence Submission**

Contractors submit milestone progress, completion percentages, work quantities, photographs, videos and supporting documents. Submissions remain marked as pending verification until independently reviewed.

**4. Independent Field Verification**

Field inspectors use a mobile-friendly interface to capture site photographs, GPS coordinates, timestamps, observed quantities, inspection checklists and defects. Evidence can be captured offline and synchronized when connectivity returns. Contractor submissions and independent observations remain separately identifiable.

**5. Evidence Reconciliation and Discrepancy Detection**

This is JanDrishti's core intelligence capability. A validation engine compares approved specifications, contractor submissions and field observations.

Rule-based checks identify missing evidence, duplicate file hashes, inconsistent milestone sequences, location mismatches and differences between reported and inspected quantities. Computer vision techniques can additionally assist with visually similar image detection and before-and-after comparisons.

Every alert explains the expected condition, submitted evidence, observed condition and reason for the discrepancy. Automated alerts support human verification; they do not independently accuse stakeholders or make official decisions.

**6. Discrepancy Resolution and Citizen Transparency**

Identified discrepancies receive unique issue records, responsible owners, response deadlines, supporting evidence and resolution histories. Authorities can track corrective actions, while citizens can access publicly disclosable project information, verification outcomes and outstanding issues. Citizens can also submit observations for authorized review.

The initial implementation will focus on municipal road repair and resurfacing projects within a selected ward. This provides a manageable environment to demonstrate the complete accountability cycle.

JanDrishti is proposed as a web platform with a mobile-friendly Progressive Web App. Its planned architecture uses React, Supabase, PostgreSQL, PostGIS and evidence-validation services.

The solution is currently at the concept and requirements-definition stage, with a proposed MVP scope. The objective is to build and validate one complete project-verification workflow before expanding to other public infrastructure categories.

### 3. Who is affected, and where does the problem occur?
*Maximum 300 words*

The problem affects citizens, municipal authorities, public works departments, contractors, field inspectors and independent auditors involved in publicly funded infrastructure projects.

Citizens are the ultimate beneficiaries of public infrastructure but often lack accessible information to compare promised work with actual delivery. Municipal engineers and administrators must reconcile information distributed across project documents, progress reports and inspection records. Field inspectors face difficulties maintaining consistent evidence and connecting observations to the original project specifications. Contractors and implementing agencies also need a structured mechanism to submit evidence and respond to discrepancies.

The problem occurs across urban and rural public infrastructure development, including road construction, road resurfacing, drainage systems, public facilities and other municipal works.

JanDrishti's initial deployment context is an urban local body, beginning with road repair projects within a selected municipal ward. The proposed pilot can be adapted to municipal bodies in Tamil Nadu and subsequently extended to other regions.

### 4. What is innovative or different about your solution?
*Maximum 300 words*

JanDrishti's innovation lies in connecting project commitments, contractor-reported progress and independent field observations into one traceable accountability workflow.

Unlike a conventional project dashboard that primarily displays reported progress, JanDrishti distinguishes between what was approved, what was claimed, what was independently observed and what was ultimately resolved.

Its key differentiators are:

1. **Commitment-to-outcome traceability:** Every milestone is linked to approved specifications and measurable deliverables.
2. **Evidence reconciliation:** Contractor submissions are systematically compared against independent field observations.
3. **Explainable discrepancy detection:** Alerts identify specific mismatches and explain why further verification is required.
4. **Resolution accountability:** Each discrepancy has an assigned owner, response history and evidence-backed closure.
5. **Longitudinal verification:** Project records can retain post-completion defects, corrective work and maintenance history.
6. **Citizen-readable transparency:** Complex project records are translated into accessible project histories.

The platform does not claim to invent geotagging, project tracking or grievance reporting. Its proposed innovation is integrating these capabilities into a consistent commitment-to-verification-to-resolution framework.

Automated detection supports human decision-making rather than making allegations or official certification decisions.

### 5. How does your solution work?
*Maximum 300 words*

1. **Project registration:** An authorized administrator creates a project record containing its approved budget, location, specifications, work-order reference and milestones.
2. **Progress reporting:** The contractor submits milestone completion details, quantities, photographs and supporting documents.
3. **Evidence validation:** The system checks mandatory submissions, file hashes, milestone sequence, reported quantities and location metadata.
4. **Independent inspection:** An authorized inspector visits the worksite and records GPS-linked observations, photographs, observed quantities and defects.
5. **Evidence reconciliation:** The validation engine compares approved commitments, contractor submissions and inspection findings to identify potential discrepancies.
6. **Issue management:** Discrepancies are assigned to responsible stakeholders for explanations, corrective action and follow-up inspection.
7. **Verified resolution:** An authorized inspector records the final finding with supporting evidence.
8. **Public transparency:** Citizens view the permitted project details, reported progress, independent verification status and resolution history.

The technology stack includes React, Supabase, PostgreSQL, PostGIS, Supabase Storage, rule-based validation, cryptographic file hashing and OpenCV-based image comparison. Human authorization remains essential for official verification decisions.

### 6. What stage is your solution at?

**Select:** Idea

**Additional notes on your stage**
*Maximum 300 words*

JanDrishti is currently at the concept and product requirements-definition stage. The problem, target stakeholders, product modules, user workflows, proposed architecture, core data model, MVP scope and validation strategy have been documented.

The proposed MVP will focus on municipal road repair projects and demonstrate the complete workflow from project registration and contractor evidence submission to independent inspection, discrepancy identification, resolution and citizen-facing transparency.

The next development milestone is to build a functional prototype using sample project records and controlled discrepancy scenarios. Subsequent stages will involve stakeholder feedback, field validation with appropriate permissions and assessment of integration requirements.

No official government deployment, institutional partnership or field-tested prototype is being claimed at this stage.

### 7. Who will benefit and what impact will it create?
*Maximum 300 words*

**Citizens:** Gain accessible information about publicly funded projects, their approved commitments, reported progress, verification findings and unresolved issues.

**Government departments and municipal authorities:** Gain a consolidated project record, improved evidence traceability and a structured way to identify and resolve discrepancies.

**Field inspectors and auditors:** Receive standardized inspection workflows and an organized record of observations, evidence and verification decisions.

**Contractors and implementing agencies:** Benefit from clearly defined milestone requirements, structured evidence submission and transparent discrepancy-resolution processes.

**Communities:** Can gain greater visibility into infrastructure delivery and the status of reported defects.

The expected social impact is improved public accountability and more accessible information about infrastructure delivery. Operationally, the platform aims to reduce the effort required to reconcile fragmented project records and improve the traceability of inspection findings and corrective actions.

Over time, longitudinal maintenance records could also help authorities identify recurring infrastructure defects and prioritize corrective work.

These are intended outcomes that must be evaluated through a controlled pilot rather than assumed improvements.

### 8. What is the estimated cost of your solution?
*Maximum 300 words*

The estimated initial cost of developing and demonstrating the JanDrishti MVP is approximately ₹20,000–₹40,000.

Indicative allocation:

- Frontend development and deployment: ₹2,000–₹5,000.
- Database, authentication and cloud storage: ₹0–₹5,000 using available free tiers and limited usage.
- Domain and deployment-related expenses: ₹1,000–₹2,000.
- Evidence processing and image-validation infrastructure: ₹3,000–₹8,000.
- Testing, devices, connectivity and demonstration expenses: ₹4,000–₹8,000.
- Contingency and miscellaneous expenses: ₹10,000–₹12,000.

The estimate assumes development by a student team using open-source technologies, existing laptops and limited sample project data. It excludes developer salaries, government integration costs, large-scale cloud infrastructure and extensive field operations.

A real municipal pilot would require a separate budget based on the number of projects, users, evidence storage requirements, field visits and institutional deployment requirements.

### 9. How can the solution be implemented and scaled?
*Maximum 300 words*

Implementation will follow a phased approach.

**Phase 1 – Controlled MVP:** Develop the project registry, milestone tracker, contractor evidence submission, field inspection interface, rule-based discrepancy engine and citizen-facing project pages.

**Phase 2 – Ward-level validation:** Select one municipal ward and use 5–10 sample road repair projects. Demonstrate missing evidence, location mismatch and reported-versus-observed quantity discrepancies. Obtain appropriate permissions before inspecting actual worksites.

**Phase 3 – Institutional pilot:** Engage municipal engineering departments and relevant local authorities to evaluate the platform using authorized project records and field observations. Measure verification coverage, alert precision, resolution time and evidence completeness.

**Phase 4 – Geographic and functional expansion:** Extend the platform to additional wards, municipalities and infrastructure categories such as drainage, public facilities and road construction.

The modular architecture and PostgreSQL/PostGIS foundation will support geographic expansion. Role-based access, configurable milestone templates and standardized evidence workflows will allow adaptation to different departments.

Integration with existing government systems can be explored through authorized APIs or approved data-sharing mechanisms. JanDrishti is intended to complement existing systems rather than replace them.

### 10. What evidence do you have?

**Suggested checkbox:** Other

**Describe your evidence**
*Maximum 300 words*

The current evidence consists of a documented product concept and a detailed Product Requirements Document (PRD).

The PRD defines the problem statement, stakeholder roles, product modules, user workflows, functional and non-functional requirements, technical architecture, core database entities, MVP scope, success metrics, risks and validation plan.

A detailed demonstration scenario has also been specified using a hypothetical municipal road repair project: a contractor reports 500 metres completed, while an independent inspection records approximately 320 metres resurfaced. The proposed system identifies the quantity discrepancy, creates an issue record and tracks its resolution.

This scenario illustrates the intended system behaviour and is not claimed as a real-world test result.

The next evidence milestone is a functional prototype tested against controlled discrepancy scenarios, followed by stakeholder feedback and authorized field validation.

### 11. Who could adopt or implement the solution?
*Maximum 300 words*

Potential adopters and implementation partners include:

- Urban local bodies and municipal corporations responsible for public infrastructure projects.
- Municipal engineering and public works departments.
- State-level municipal administration and urban development departments.
- Local government institutions responsible for road maintenance and infrastructure delivery.
- Government audit and independent verification bodies, subject to their mandates and approval.
- Academic institutions and civic-technology organizations supporting public accountability initiatives.
- Authorized technology implementation partners working with government departments.

In Tamil Nadu, potential institutional stakeholders include the Greater Chennai Corporation and the relevant municipal corporations and urban local bodies.

The initial adoption pathway would involve discussions with a municipal engineering department to understand existing project inspection workflows, identify a suitable pilot category and obtain permission to use relevant project records.

These organizations are potential adopters, not confirmed partners.

### 12. What support do you need to take the solution forward?
*Maximum 300 words*

JanDrishti requires the following support to progress from concept to a validated prototype and potential institutional pilot:

1. **Technical mentorship:** Guidance on evidence integrity, geospatial validation, secure system architecture and computer vision-assisted discrepancy detection.
2. **Government and institutional access:** Opportunities to interact with municipal engineers, public works officials and field inspectors to understand existing verification processes.
3. **Pilot access:** Permission to study selected municipal road repair projects, inspect appropriate worksites and validate the proposed workflows.
4. **Domain expertise:** Guidance on public works specifications, milestone measurement, inspection standards and project documentation.
5. **Funding:** Support for prototype development, cloud infrastructure, evidence processing, testing and field validation.
6. **Partnerships:** Connections with civic-technology organizations, academic institutions and local government bodies interested in transparent infrastructure delivery.

The most important immediate requirement is access to domain experts and a suitable pilot environment to validate whether JanDrishti addresses a real operational gap in existing public works verification processes.