<!--
Sync Impact Report:
- Version change: Uninitialized (Template Default) → 1.0.0
- List of modified principles:
  - Added Principle I: Privacy & Zero Friction (Zero Barrier to Entry)
  - Added Principle II: Context & Localization: Strict Focus on Mexico
  - Added Principle III: Zero Scope Creep (No Web Bloat)
  - Added Principle IV: Architectural Simplicity (KISS & Web Performance)
  - Added Principle V: Zero Forced Cost for the Job-Seeker
  - Added Principle VI: Visual Transparency Against Predatory Postings
- Added sections:
  - Technical Constraints & Scope Boundaries
  - Enforcement Protocol & Quality Gates
  - Governance
- Removed sections: None (initialized from template placeholders)
- Follow-up TODOs: None
-->

# MishooJobs (Web Edition) Constitution

> **Hierarchy of Authority:** This constitution governs all design decisions, UI/UX choices, technical architecture, and code generation for MishooJobs. If any technical proposal, feature request, or AI-generated task conflicts with these principles, this constitution strictly prevails.

## Core Principles

### I. Privacy & Zero Friction (Zero Barrier to Entry)
The web application MUST be immediate, accessible, and respectful of the candidate's personal data:
- **No Mandatory Accounts**: In version 0 (v0), the user MUST NOT be forced to register, create accounts, manage passwords, or navigate onboarding funnels to upload their resume and search for jobs.
- **Resume Privacy**: Resumes and application tracking histories MUST be processed with strict privacy via client-side/local browser storage or user-controlled local processing. Candidate data MUST NEVER be shared, stored on untrusted remote servers, or harvested.
- **Credential Protection**: AI provider API keys and sensitive credentials MUST NEVER be exposed to the public client or committed into version control.
- **Rationale**: Students and early-career job seekers face high friction and application fatigue. Guaranteeing instant utility without account creation and assuring complete local privacy builds immediate trust.

### II. Context & Localization: Strict Focus on Mexico
MishooJobs is specifically calibrated for the Mexican early-career job market:
- **Language & Cultural Context**: The entire user interface, labels, filter options, and alert notifications MUST be in Spanish tailored to the Mexican labor context.
- **Academic & Employment Terminology**: The platform MUST recognize and prioritize Mexican academic and professional placement terms (*becario, prácticas profesionales, residencias profesionales, estadías, formación dual, esquema mixto, honorarios vs. nómina*).
- **Default Currency**: The default and exclusive currency MUST be the Mexican Peso (MXN, $).
- **Legitimate Remote Listings**: The engine MUST strictly filter out misleading "remote" listings that require foreign legal authorization (e.g., "US Citizen / Green Card required").
- **Rationale**: Generic global platforms fail junior job seekers in Mexico by cluttering results with inapplicable foreign legal requirements, mismatched terminology, and irrelevant foreign currencies.

### III. Zero Scope Creep (No Web Bloat)
AI agents and contributors frequently overengineer web applications. The following are strictly PROHIBITED from v0 implementation:
- Payment gateways (e.g., Stripe, PayPal), billing portals, or subscription paywalls.
- Automated application bots (*auto-apply*) or CAPTCHA-solving bypass mechanisms.
- Internal social networks, community feeds, messaging/chat systems, or multi-role administrative dashboards.
- Any unprompted feature MUST be documented in a future backlog—it MUST NOT be built in the active sprint.
- **Rationale**: Delivering a fast, robust, and reliable core tool requires fierce discipline against premature features and operational baggage.

### IV. Architectural Simplicity (KISS & Web Performance)
When evaluating competing technical solutions, contributors MUST always select the simpler, more lightweight, and easily maintainable approach:
- **No Distributed Overkill**: Microservices, distributed clusters, message brokers, and complex backend middleware layers are strictly prohibited for v0.
- **Performance & Responsiveness**: The web application MUST be fully responsive (optimized for mobile viewports and desktop browsers alike) with fast-loading, clean visual components.
- **Maintainability**: Code architecture MUST prioritize readability, standard web patterns, and minimal third-party dependencies.
- **Rationale**: Maintainability and speed of execution for a student-centric web app supersede complex enterprise architecture patterns.

### V. Zero Forced Cost for the Job-Seeker
Access to employment opportunities MUST NOT impose a financial burden on unemployed juniors or students:
- **No Commercial Scraping Overhead**: The system MUST NOT rely on paid commercial scraping APIs or pay-per-request proxy services.
- **Cost-Effective AI**: The AI evaluation engine MUST prioritize providers and models with generous free tiers or near-zero marginal cost (e.g., Google Gemini Flash API or local models).
- **Rationale**: An application serving juniors and university students must remain financially sustainable without passing costs or paywalls onto job-seekers.

### VI. Visual Transparency Against Predatory Postings
The UI/UX MUST proactively safeguard young candidates against labor exploitation:
- **Prominent Scam Warnings**: Red flags and scam warnings MUST NEVER be buried or hidden; they MUST be displayed with prominent, high-contrast visual badges (e.g., clear warning labels: *"Potential MLM / Pyramid Scheme"*, *"100% Commission Disguised as Salary"*, *"Unpaid Full-time Labor"*).
- **Instant Compatibility Breakdown**: The compatibility breakdown (matching skills vs. skill gaps) MUST be immediately readable at a glance on clean, interactive job cards.
- **Rationale**: Early-career candidates are especially vulnerable to predatory listings disguised as internships or entry-level opportunities.

## Technical Constraints & Scope Boundaries

The technical design for v0 must adhere to strict operational boundaries:
- **Data Persistence**: Client-side storage (e.g., IndexedDB, LocalStorage) or user-controlled local backend is required for candidate data in v0. Cloud database infrastructures requiring user tenant credentials are prohibited.
- **Credential Isolation**: Any required AI API keys or environment secrets must remain confined to backend environments or user-supplied secure configurations, never exposed in client bundles.
- **Frontend Architecture**: Modern, lightweight, responsive web components prioritizing low latency and minimal bundle size.

## Enforcement Protocol & Quality Gates

The enforcement of this constitution is continuous and non-negotiable:
- **Hierarchy of Authority**: This constitution governs all design decisions, UI/UX choices, technical architecture, and code generation for MishooJobs. If any technical proposal, feature request, or AI-generated task conflicts with these principles, this constitution strictly prevails.
- **Immediate Halt**: If an AI agent or contributor attempts to introduce cloud databases requiring credentials, mandatory auth walls, or heavy enterprise architectures that delay the release of v0, the proposal MUST be halted immediately and realigned with this constitution.
- **Verification Gates**: Every pull request, spec (`/speckit-specify`), and plan (`/speckit-plan`) must pass a constitution compliance check verifying zero mandatory accounts, Mexican market calibration, no scope bloat, and visual red-flag transparency.

## Governance

- **Supremacy**: This constitution supersedes all other documentation, practices, and informal agreements.
- **Amendments**: Amendments require explicit documentation, stakeholder consensus, and a migration plan.
- **Versioning Policy**: The constitution version follows Semantic Versioning (MAJOR.MINOR.PATCH):
  - **MAJOR**: Backward-incompatible governance or principle removals or redefinitions.
  - **MINOR**: New principle or section additions, or materially expanded guidance.
  - **PATCH**: Clarifications, wording refinements, and non-semantic typo corrections.
- **Compliance Review**: All project specifications, roadmaps, and PRs must reference and strictly conform to this document.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
