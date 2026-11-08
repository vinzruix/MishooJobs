# Bug Assessment: Vacancy Count Discrepancy Across Portal Status Badges and Deduplication Summary

- **Slug**: vancancies-count-dismatch
- **Created**: 2026-11-08T18:51:00Z
- **Source**: pasted text & user-uploaded screenshot (`media_1794163318915_dacc847e.png`)
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> When i search vacancies it always says that each job seeker found 15 vacancies. slug=vancancies-count-dismatch

The attached screenshot demonstrates a visible numerical contradiction across live discovery metrics:
- **Portales en Vivo status badges**:
  - `Computrabajo MX: 15 verificadas (2.3s)`
  - `Indeed México: 15 verificadas (1.5s)`
  - `OCC Mundial: 15 verificadas (2.0s)`
  - Total reported across portals: **45** ($15 + 15 + 15$)
- **Deduplication metric badge**:
  - `⚡ Se combinaron 1 vacantes duplicadas entre bolsas de trabajo.`
  - `Total extraídas: 39`
- **Seniority filter counters**:
  - `Todos 38` ($39 - 1 = 38$)
  - Breakdown: `Primer Empleo Real: 4`, `Pasantía / Prácticas: 1`, `Junior: 16`, `Mid: 14`, `Senior: 3` (Sum: $4 + 1 + 16 + 14 + 3 = 38$)

The user observes two interrelated anomalies:
1. Every standard query consistently reports exactly 15 verified vacancies per portal ("each job seeker found 15 vacancies").
2. The arithmetic across UI elements is broken: $15 + 15 + 15 = 45$ vacancies reported by portals, but the deduplication badge reports `Total extraídas: 39` and `1 duplicada combinada` resulting in 38 unique vacancies. 6 vacancies vanish without explanation.

## Symptom

When performing a search, the portal status bar displays `15 verificadas` for each of the three active portals (summing to 45), but the deduplication banner immediately below claims `Total extraídas: 39` with only 1 duplicate merged, and the feed shows 38 vacancies.

**Expected Behavior**:
1. All displayed counts must be mathematically coherent: if portals report a sum of $N$ verified listings, `Total extraídas` must equal $N$, and `Total extraídas - Duplicadas combinadas` must equal the unique vacancy count rendered in `Todos` (e.g., $45 \text{ extraídas} - 7 \text{ combinadas} = 38 \text{ únicas}$). Alternatively, each portal status badge must reflect the net unique listings contributed by that portal to the stream.
2. Distinct anonymous or confidential employer postings (e.g. "Empresa Confidencial") must not collide into identical SHA-256 fingerprints and be discarded inadvertently.
3. The UI should make transparent why 15 listings per portal are scraped (e.g., streaming batch limit for live responsiveness) or accurately reflect actual portal yields.

## Reproduction

1. Open MishooJobs at `http://localhost:5173`.
2. Search for any common technology or role (e.g., `Python Junior` or `Desarrollador`).
3. Observe the `Portales en Vivo` progress badges:
   - Computrabajo reports `15 verificadas`
   - Indeed reports `15 verificadas`
   - OCC reports `15 verificadas`
   - Total expected: $15 \times 3 = 45$.
4. Observe the deduplication badge and category counts:
   - Deduplication badge reports: `Se combinaron 1 vacantes duplicadas` and `Total extraídas: 39`.
   - Seniority pill `Todos` shows `38`.
5. **Observed**: $45 - 39 = 6$ vacancies are unaccounted for in the deduplication metric, creating a noticeable visual mismatch between the portal badges and the feed totals.

## Suspected Code Paths

- `backend/src/mishoojobs/api/sse.py:199-234` (`job_search_stream_generator`) — Emits `PortalStatusEvent` with `count=len(verified_vacs)` (15), but immediately runs intra-portal `deduplicator.deduplicate_batch(verified_vacs)` which silently reduces the batch size before adding to `all_extracted_vacancies`. The intra-portal duplicate count is discarded (`_`), causing `all_extracted_vacancies` to have fewer items (e.g., 39 instead of 45).
- `backend/src/mishoojobs/api/sse.py:236-243` (`deduplication_summary`) — Computes `summary = deduplicator.deduplicate_batch(all_extracted_vacancies)`, setting `summary.total_extracted = len(all_extracted_vacancies)` (39). This ignores the 6 listings already merged during intra-portal deduplication.
- `backend/src/mishoojobs/services/deduplicator.py:41-47` (`generate_fingerprint`) — Computes canonical SHA-256 hash using `norm_company:norm_title:norm_state`. When scrapers encounter unbranded or confidential listings, `company_name` defaults to `"Empresa Confidencial"`. Multiple distinct job openings with the same title and jurisdiction collide into the same fingerprint and are erroneously merged as duplicates.
- `backend/src/mishoojobs/services/deduplicator.py:92-115` (`deduplicate_batch`) — Sets `total_extracted = len(vacancies)`, which only reflects the list passed into that specific invocation rather than cumulative scraped listings.
- `backend/src/mishoojobs/schemas/job.py:166` (`SearchParams.limit_per_portal`) & `backend/src/mishoojobs/api/routes/jobs.py:15` — Enforces `limit_per_portal: int = Query(default=15, ge=1, le=15)`, capping scrapers to 15 items per portal. Scrapers slice `[:limit]`, ensuring general queries virtually always yield exactly 15 verified results per portal.
- `frontend/src/components/PortalStatusBar.tsx:32` — Displays `{label}: {count} verificadas`, which renders the pre-deduplication count without qualifying that it is the initial batch count.

## Root Cause Hypothesis

There are two primary root causes contributing to the observed behavior:

1. **Broken Multi-Stage Deduplication Accounting in `sse.py`**:
   The SSE generator executes two distinct deduplication phases:
   - *Phase 1 (Intra-portal)*: `deduped_portal_vacs, _ = deduplicator.deduplicate_batch(verified_vacs)`. Here, `verified_vacs` (15 items) has its intra-portal duplicates merged into `deduped_portal_vacs` (e.g., 9 items). The duplicate count from this step is discarded (`_`), while `portal_status` previously broadcast `count=15`.
   - *Phase 2 (Cross-portal)*: `unique_vacancies, summary = deduplicator.deduplicate_batch(all_extracted_vacancies)`. Here, `all_extracted_vacancies` only contains the already-deduplicated 39 items ($9 + 15 + 15$). `summary.total_extracted` is computed as `len(all_extracted_vacancies) = 39`, and `duplicates_merged = 1` only reflects Phase 2.
   Because Phase 1 duplicates (6 items) are never added to `duplicates_merged` and are missing from `all_extracted_vacancies`, `PortalStatusBar` reports 45 verified while the summary reports 39 extracted, creating a 6-vacancy discrepancy.

2. **Fingerprint Collision on Anonymous Employers ("Empresa Confidencial")**:
   Scrapers default missing company names to `"Empresa Confidencial"`. The fingerprint formula `sha256("empresa confidencial:title:state")` causes distinct confidential postings to collide and collapse into a single listing during Phase 1 intra-portal deduplication. Furthermore, the hardcoded per-portal scraping limit (`limit_per_portal = 15`) guarantees that almost all queries return exactly 15 raw results per portal.

Confidence: **High**.

## Proposed Remediation

**Preferred**:
1. **Synchronize Deduplication Accounting in `backend/src/mishoojobs/api/sse.py`**:
   - Track cumulative raw verified vacancies (`total_verified_count = sum(len(verified_vacs)) = 45`) across all completed portals.
   - Accumulate total duplicates merged across both intra-portal and cross-portal passes (`total_duplicates_merged = intra_merged + cross_merged`).
   - In `deduplication_summary`, emit:
     - `total_extracted = total_raw_verified` (45)
     - `duplicates_merged = total_duplicates_merged` (7)
     - `unique_vacancies = len(unique_vacancies)` (38)
     Mathematical invariant satisfied: $\text{total\_extracted} - \text{duplicates\_merged} = \text{unique\_vacancies}$ ($45 - 7 = 38$).
2. **Align Portal Status Badge Counts**:
   - Update `PortalStatusEvent` in `sse.py` to either emit the net delivered vacancies (`len(deduped_portal_vacs)`) or clarify the status label. If net delivered is used, the sum of portal status badges will directly match `total_extracted` in the deduplication summary.
3. **Prevent Anonymous Employer Fingerprint Collisions in `deduplicator.py`**:
   - When `norm_company` belongs to generic confidential placeholders (`"empresa confidencial"`, `"confidencial"`, `"importante empresa"`), differentiate fingerprints using distinct vacancy attributes (e.g. include direct URL domain/path hash or description signature) so distinct job offers from anonymous recruiters are preserved rather than collapsed.
4. **Clarify Batch Limits in UI (`PortalStatusBar.tsx` & `App.tsx`)**:
   - Provide clear tooltip or badge styling explaining that results reflect the live verified batch (up to 15 per portal) to avoid user confusion about why 15 listings are returned per source.

**Alternatives**:
- *Option B (Single Global Deduplication Pass)*: Collect all `verified_vacs` directly into `all_extracted_vacancies` without performing an intermediate intra-portal deduplication step, running a single `deduplicator.deduplicate_batch(all_extracted_vacancies)` at the end. This natively preserves `total_extracted = 45` and captures all duplicates in a single summary.

**Files likely to change**:
- `backend/src/mishoojobs/api/sse.py`
- `backend/src/mishoojobs/services/deduplicator.py`
- `frontend/src/components/PortalStatusBar.tsx`
- `frontend/src/App.tsx`
- `backend/tests/integration/test_sse_stream.py`
- `backend/tests/unit/test_deduplicator.py`

**Tests to add or update**:
- Test in `test_deduplicator.py`: Verify that multiple postings with `"Empresa Confidencial"` and distinct URLs do not collide into a single fingerprint.
- Test in `test_sse_stream.py`: Verify that `total_extracted` in `deduplication_summary` equals the sum of portal status `count`s, and that $\text{total\_extracted} - \text{duplicates\_merged} = \text{unique\_vacancies}$.
- Frontend tests in `PortalStatusBar.test.tsx` and `App.test.tsx`: Verify count consistency and badge rendering.

## Risks & Considerations

- **Backwards Compatibility**: Modifying `DeduplicationSummary` values must preserve existing schema contracts consumed by `frontend/src/services/sse.ts` and `App.tsx`.
- **Database Upsert**: Preserving confidential postings by incorporating a disambiguator in their fingerprint ensures valid jobs are not dropped, but requires that identical re-scraped jobs remain idempotent.

## Open Questions

- None. The mathematical discrepancy and root causes in `sse.py` and `deduplicator.py` are confirmed by code analysis and reproducible behavior.
