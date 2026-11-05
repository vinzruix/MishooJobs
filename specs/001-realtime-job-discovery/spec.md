# Feature Specification: Real-Time Mexican Job Discovery & Verification for Juniors (MishooJobs)

**Feature Branch**: `001-realtime-job-discovery`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Specification: MishooJobs... NO DEBE TENER DATOS PRECARGADOS TODA LA INFORMACION DEBE SER REAL Y AL MOMENTO DE LA CONSULTA CON LINKS FUNCIONALES A LAS VACANTES"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Job Sourcing with Functional Direct Links (Priority: P1)

As a Mexican student or recent graduate seeking early-career employment, I want to search for active junior and internship vacancies across Mexican job portals on-demand, receiving only real-time listings with working direct application links and absolutely no preloaded or dummy mock data, so that I can immediately apply to real, active job opportunities without wasting time on phantom or expired postings.

**Why this priority**: Core value delivery. If job postings are preloaded, synthetic, or have broken links, the platform fails its primary mission of connecting job seekers to real opportunities.

**Independent Test**: Perform a search query for a specific Mexican city (e.g., "Guadalajara") and role type (e.g., "Becario Frontend"). Verify that all returned results are freshly fetched from external job boards, contain active direct URLs that open the actual job listing, and contain zero static sample/mock entries.

**Acceptance Scenarios**:

1. **Given** a user inputs search parameters (role keywords, location, modality), **When** they initiate the search, **Then** the system queries external Mexican job portals in real time and returns exclusively live, active vacancies without using preloaded or mock records.
2. **Given** a list of search results, **When** the user clicks on any job listing's application link, **Then** the link navigates directly to the original live job posting on the source portal.
3. **Given** an identical vacancy published simultaneously across multiple job portals, **When** results are retrieved, **Then** the system consolidates the posting into a single entry displaying all available valid source links.

---

### User Story 2 - Privacy-First Resume Profile Matching & Skill Gap Analysis (Priority: P1)

As a candidate targeting specific roles (e.g., Backend Developer vs. Data Analyst), I want to load my resume (PDF or Markdown) and switch between profiles without creating an account or logging in, so that I receive an instant compatibility score (0–100%) and a clear breakdown of matching skills and missing competencies for each live vacancy while keeping my personal data private.

**Why this priority**: Students need personalized guidance to know if they qualify for a role before spending time applying, without surrendering their personal data or creating accounts.

**Independent Test**: Load two distinct resume files (e.g., Python Backend vs. Frontend React) and evaluate the same live vacancy list. Verify that the compatibility scores, matching skills, and identified skill gaps immediately update to reflect the active profile, with all profile data remaining local.

**Acceptance Scenarios**:

1. **Given** a user loads a resume without creating an account, **When** they inspect a discovered vacancy, **Then** the system calculates a 0–100% compatibility score categorized as High Fit (80–100%), Moderate Fit (50–79%), or Low Fit (<50%).
2. **Given** an evaluated vacancy, **When** the user views the match breakdown, **Then** the system presents a distinct list of matched technical skills and actionable skill gaps needed for the role.
3. **Given** multiple resume profiles loaded locally, **When** the user switches the active profile, **Then** all compatibility scores and skill comparisons recalculate based on the newly selected profile without page reload or data loss.

---

### User Story 3 - Predatory & Scam Vacancy Detection for Mexican Labor Context (Priority: P2)

As an inexperienced job seeker in Mexico, I want fraudulent, exploitative, and predatory job listings flagged with prominent visual warnings and clear explanations, so that I avoid pyramid schemes (MLMs), 100% commission traps disguised as salaried roles, unpaid full-time labor, and illegal candidate fees.

**Why this priority**: Early-career Mexican students and recent graduates are prime targets for predatory employment schemes. Proactive warnings safeguard their time, finances, and safety.

**Independent Test**: Run a search that encounters listings with known predatory indicators (e.g., "excelentes ingresos semanales por actividades administrativas sencillas", commission-only compensation disguised as base pay, or demands for training material payments). Verify that a high-contrast warning badge is prominently displayed alongside the specific risk category.

**Acceptance Scenarios**:

1. **Given** a job listing with language indicative of multi-level marketing (MLM) or pyramid schemes, **When** displayed to the user, **Then** the system affixes a prominent warning badge (e.g., `[POSIBLE FRAUDE / PIRAMIDAL]`) explaining the risk.
2. **Given** a listing advertising full-time work disguised as an unpaid internship or requiring upfront candidate payments (uniforms, background checks, training), **When** displayed, **Then** the system clearly flags the listing with an exploitation warning (e.g., `[TRABAJO NO REMUNERADO / COBRO A CANDIDATO]`).
3. **Given** a listing claiming a fixed salary but whose compensation terms reveal 100% commission-only pay, **When** evaluated, **Then** the system highlights the compensation disparity with a visible warning.

---

### User Story 4 - Dynamic Filtering by Mexican Modality & Early-Career Role Types (Priority: P2)

As a university student who needs to balance classes, I want to filter live opportunities by Mexican academic/entry-level formats (*becario, prácticas profesionales, residencias profesionales, servicio social, dualidad, trainee, junior*) and modality (remote, hybrid, on-site within specific Mexican states), so that I only see positions compatible with my university schedule and legal situation.

**Why this priority**: Generic job filters do not distinguish between student internships (*prácticas*) and standard employment, flooding students with irrelevant full-time positions.

**Independent Test**: Apply the filter "Prácticas Profesionales" and "Modalidad: Remoto". Confirm that all retrieved results specifically match Mexican student internship conventions, are eligible for Mexican residents, and exclude international listings requiring foreign legal authorization (e.g., "US Citizen / Green Card only").

**Acceptance Scenarios**:

1. **Given** a user selects specific Mexican internship or early-career categories, **When** search results load, **Then** only vacancies explicitly matching those formats or early-career experience levels (<2 years) are displayed.
2. **Given** a user filters for remote positions, **When** results are evaluated, **Then** any international remote posting requiring foreign citizenship or foreign work visas is excluded.
3. **Given** a user specifies a target Mexican state or city, **When** the query runs, **Then** physical and hybrid vacancies are restricted to that geographic jurisdiction.

---

### User Story 5 - Local Application State Tracking & Management (Priority: P3)

As an active applicant, I want to mark vacancies with statuses such as Saved, Applied, Interviewing, or Ignored, so that I can track my application pipeline locally and avoid reviewing or applying to the same job twice.

**Why this priority**: Job hunting requires organization. Storing application status locally ensures seamless continuity across sessions without requiring server-side candidate account creation.

**Independent Test**: Mark a live listing as `APPLIED`. Execute a new search query that returns the same vacancy. Verify that the listing displays its `APPLIED` badge and is excluded from the unreviewed view.

**Acceptance Scenarios**:

1. **Given** a discovered vacancy, **When** the user changes its status (e.g., to `Saved`, `Applied`, or `Ignored`), **Then** the status persists locally on the user's workstation.
2. **Given** subsequent search executions, **When** previously processed vacancies reappear in search feeds, **Then** the system visually reflects their existing tracking state and excludes `Ignored` or `Applied` listings from the fresh pipeline view.
3. **Given** a user wants to view their active applications, **When** they navigate to their tracking view, **Then** all saved and applied positions are displayed with their functional external links, company names, and dates.

---

### Edge Cases

- **Slow or Unresponsive Job Portal**: When one external portal experiences latency or timeouts during live search, the system must continue retrieving and displaying results from responding portals without crashing, alerting the user to which source experienced a delay.
- **External Anti-Bot / Temporary Rate Limits**: If an external portal temporarily restricts access, the system must degrade gracefully, present all successfully fetched live results, and provide a clear status notification rather than failing silently.
- **Expired or Inactive External Job Postings**: If an external job posting was removed moments before the user clicks its direct link, the system must provide a link-health verification check or advise the user that the external board marked the listing as closed.
- **Zero Results for Overly Narrow Queries**: If an extreme combination of filters yields zero live listings, the system must suggest widening the search (e.g., expanding to adjacent Mexican states or related role keywords) rather than displaying an empty blank screen.
- **Unformatted or Scanned Resumes**: If an uploaded resume is an image-only PDF without selectable text or has unsupported formatting, the system must notify the user with clear instructions to provide a text-based PDF or Markdown file.
- **Misleading "Remote" Listings Requiring Foreign Work Visas**: If an employer marks a position as "Remote" but specifies "Must be legally authorized to work in the United States without sponsorship" or "US Citizen only", the system must detect and filter it out of the Mexican candidate feed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Zero Preloaded/Mock Data)**: The system MUST NEVER return preloaded, dummy, or synthetic mock listings in search results. All presented job data MUST be fetched dynamically from real external job portals at the time of the query.
- **FR-002 (Live Functional Links)**: Every discovered job vacancy MUST include an active, functional, direct URL linking directly to the listing on the hosting job portal.
- **FR-003 (Multi-Portal Mexican Sourcing)**: The system MUST query major job boards operating in Mexico (including Computrabajo, Indeed México, and OCC Mundial) to aggregate live early-career opportunities.
- **FR-004 (Cross-Portal Deduplication)**: The system MUST identify identical vacancies published across multiple portals (matching company, role title, and core description) and consolidate them into a single record with all valid source links.
- **FR-005 (Graceful Degradation on Ingestion)**: If any individual job portal fails to respond, times out, or blocks requests, the system MUST report the source status cleanly and display all successfully retrieved vacancies from surviving sources.
- **FR-006 (Zero Mandatory Account Creation)**: The system MUST NOT require users to register, create accounts, or enter authentication credentials to search jobs, upload resumes, or track applications.
- **FR-007 (Local Candidate Privacy)**: Candidate resumes, parsed profile data, and personal application statuses MUST remain stored strictly locally on the user's workstation.
- **FR-008 (Resume Format Parsing)**: The system MUST support parsing candidate profiles from both text-based PDF and Markdown formats, extracting target roles, technical skills, coursework, and personal projects.
- **FR-009 (Multi-Profile Resume Switching)**: Users MUST be able to store multiple specialized resume profiles locally and switch between them dynamically, triggering immediate recalculation of match scores.
- **FR-010 (Compatibility Fit Scoring)**: The system MUST evaluate candidate fit against each live vacancy on a 0–100% scale, categorizing results into High Fit (80–100%), Moderate Fit (50–79%), and Low Fit (<50%).
- **FR-011 (Skill Match & Gap Breakdown)**: For each evaluated vacancy, the system MUST display a clear breakdown separating verified matching competencies from missing skill gaps.
- **FR-012 (Predatory Pattern Flagging)**: The system MUST inspect job descriptions for predatory patterns common in the Mexican labor market, including:
  - 100% commission compensation disguised as base salary.
  - Demands for candidate payments (training materials, uniforms, background checks, psychometrics).
  - Multi-level marketing (MLM) and pyramid recruitment schemes.
  - Unpaid full-time internships or labor disguised as academic placements without stipends or statutory benefits.
- **FR-013 (High-Contrast Warning Badges)**: When a predatory or exploitative condition is identified, the system MUST display a prominent, high-contrast warning badge detailing the exact risk factors found.
- **FR-014 (Mexican Modality & Program Filtering)**: The system MUST support filtering by specific Mexican early-career classifications (*becario, prácticas profesionales, residencias profesionales, estadías, formación dual, trainee, junior*) and work modality (remote, hybrid, on-site).
- **FR-015 (Strict Mexican Geolocation Filter)**: The system MUST enforce that 100% of presented vacancies are either physically located within Mexico or are remote roles explicitly open to candidates residing in Mexico.
- **FR-016 (Foreign Visa Restriction Filtering)**: The system MUST detect and exclude remote listings that mandate foreign legal residency or foreign work authorization (e.g., US Green Card, H-1B, EU work permit).
- **FR-017 (Local Application Pipeline Tracking)**: Users MUST be able to assign and persist application tracking states (`New`, `Saved`, `Applied`, `Interviewing`, `Rejected`, `Ignored`) to any vacancy, preventing previously processed vacancies from cluttering future searches.
- **FR-018 (Mexican Currency Normalization)**: All advertised compensation figures MUST be displayed in Mexican Pesos (MXN, $), explicitly highlighting whether the listed pay is weekly, bi-weekly (*quincenal*), or monthly (*mensual*).

---

### Key Entities

- **Candidate Profile**: Represents a candidate's resume and qualifications. Contains target job titles, technical skills list, educational background, personal projects, and preferred modalities. Stored locally without cloud synchronization.
- **Job Vacancy**: Represents a single real-world job posting retrieved in real time. Contains unique canonical identifier, title, company name, location/state, modality, description text, compensation details (in MXN), publication date, source portals list, and direct functional application URLs.
- **Compatibility Evaluation**: Represents the assessment result comparing a Candidate Profile against a Job Vacancy. Contains numerical fit score (0–100%), fit category (High/Moderate/Low), list of matched skills, list of skill gaps, and evaluation timestamp.
- **Scam Risk Report**: Represents the safety assessment of a Job Vacancy. Contains risk severity flag (Safe, Warning, Critical), identified predatory categories (MLM, Unpaid, Commission-only, Candidate fee), and human-readable explanatory notes.
- **Application Record**: Represents the user's interaction state with a Job Vacancy. Contains reference to canonical vacancy ID, status (`New`, `Saved`, `Applied`, `Interviewing`, `Rejected`, `Ignored`), application date, and user notes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Zero Synthetic Data)**: 100% of discovered vacancies in search results correspond to live, externally verifiable job postings; zero preloaded or synthetic mock records appear in user results.
- **SC-002 (Link Functionality)**: 100% of generated vacancy cards provide a direct, functional URL that opens the active listing on the host job portal.
- **SC-003 (Geographical Integrity)**: 100% of presented positions are verified to be located within Mexican territory or eligible for remote work by Mexican residents.
- **SC-004 (Scam Detection Accuracy)**: Identified predatory patterns (MLM schemes, upfront fees, 100% commission disguised as salary) trigger a prominent warning badge in 100% of occurrences where keywords or compensation structures violate fair-practice guidelines.
- **SC-005 (Deduplication Efficiency)**: At least 95% of cross-posted identical vacancies originating from multiple job portals are consolidated into a single unified card.
- **SC-006 (Search Responsiveness)**: The system returns the first batch of verified live vacancies in under 15 seconds from the moment a user submits search criteria.
- **SC-007 (Frictionless Onboarding)**: Users can complete their entire discovery, CV match evaluation, and tracking workflow without registering an account or entering personal credentials.
- **SC-008 (Profile Switch Immediacy)**: Switching between active resume profiles recalculates and updates all vacancy compatibility scores and skill breakdowns in under 2 seconds.

---

## Assumptions

- **Target Audience**: The primary users are Mexican university students, technical institute students (*tecnológicos/politécnicos*), recent graduates, and self-taught junior developers with 0–2 years of formal corporate experience.
- **Public Availability**: The target Mexican job boards (Computrabajo, Indeed México, OCC Mundial) provide publicly accessible vacancy listings that can be retrieved via automated query workflows.
- **Network Dependency**: Live job discovery requires active internet access during query execution.
- **Privacy Boundary**: No candidate personal identifiable information (PII) is transmitted to third-party databases; all resume parsing, matching, and tracking data reside exclusively on the user's workstation.
- **Currency & Labor Standards**: Listings are assumed to follow Mexican Federal Labor Law (*Ley Federal del Trabajo*) conventions regarding statutory benefits (*prestaciones de ley*), salary quotation periods, and internship terminology.
