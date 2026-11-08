# Bug Assessment: Vacancy Card Header Badge Overflow & Awkward Wrapping

- **Slug**: vacancy-card-badge-overflow
- **Created**: 2026-11-08T02:14:00Z
- **Source**: pasted text & user-uploaded screenshot (`media_1794103777152_728bda01.png`)
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> It seems that in the cards of vacancies due to the amount of tags theres is not enough space for all.
> Attached screenshot shows a vacancy card ("Soporte y Programación Jr" - Human Staff, Monterrey, NL) where `PRESENCIAL` and `[ 0 EXP PRELIMINAR ]` consume the top row, and `NUEVA` wraps into an orphaned second row above the title, beside the `41% Compatibilidad` score box.

## Symptom

When a vacancy has multiple active status badges (e.g. modality `PRESENCIAL`, preliminary seniority `[ 0 EXP PRELIMINAR ]`, recency `NUEVA`, or discrepancy alerts), the badges exceed the available horizontal width beside the two-line `Compatibilidad` score box. This forces trailing badges like `NUEVA` to awkwardly wrap into an orphaned second row, creating uneven vertical card heights, cognitive clutter, and visual fragmentation in the feed.

**Expected Behavior**: Badges on the vacancy card should be concise, visually balanced, and layout-optimized so that standard combinations (Modality + Seniority + Recency + Discrepancy) fit cleanly without unsightly wrapping or excessive card header expansion.

## Reproduction

1. Open MishooJobs at `http://localhost:5173`.
2. Search for `Python` or `Soporte`.
3. Locate a card published within the last 48 hours (so `NUEVA` is rendered) with modality `PRESENCIAL` and seniority `primer_empleo` (`[ 0 EXP PRELIMINAR ]`).
4. **Observed**: On standard viewport and multi-column grid widths, the first row only fits `PRESENCIAL` and `[ 0 EXP PRELIMINAR ]`, while `NUEVA` breaks into a line by itself, creating an unbalanced gap above the job title. If `[ REQUISITOS DISCREPANTES ]` is also present, it creates 3 rows of badges.

## Suspected Code Paths

- `frontend/src/components/VacancyCard.tsx:63-112` — Card header tags container (`<div className="flex flex-wrap items-center gap-1.5">`) containing verbose badge strings.
- `frontend/src/components/VacancyCard.tsx:72-80` — Overly verbose labels for card view: `[ 0 EXP PRELIMINAR ]` (20 characters) and `[ ✓ AUDITADO 0 EXP ]` (20 characters).
- `frontend/src/components/VacancyCard.tsx:98-105` — Overly verbose discrepancy label: `[ REQUISITOS DISCREPANTES ]` (26 characters).
- `frontend/src/components/VacancyCard.tsx:115-127` — Multi-line Fit Score box (`{fitScore}% \n Compatibilidad`) fixed at top right, taking ~90–100px of header width.

## Root Cause Hypothesis

In `VacancyCard.tsx`, all badges are rendered using desktop/modal-length text inside a `flex flex-wrap` container that shares a single row with the ~100px wide `Fit Score` box. Because badges like `[ 0 EXP PRELIMINAR ]` (20 chars) and `[ REQUISITOS DISCREPANTES ]` (26 chars) are unusually wide, having more than one badge immediately exceeds the remaining horizontal space (~200–250px) on standard grid cards, kicking `NUEVA` or discrepancy tags onto orphaned lines.

Confidence: **High**.

## Proposed Remediation

**Preferred**:
1. **Calibrate Badge Wording for Cards (Card vs. Modal Specialization)**:
   - For `primer_empleo`:
     - Preliminary: `[ 0 EXP ]` (or `[ 0 EXP PRELIMINAR ]` abbreviated to `[ 0 EXP ]` with title tooltip "0 Exp Preliminar — Requiere auditoría").
     - Verified: `[ ✓ 0 EXP ]` (with title tooltip "✓ Auditado 0 Experiencia").
     - Detail modal retains the full verbose badge `[ ✓ AUDITADO 0 EXP ]` / `[ 0 EXP PRELIMINAR ]`.
   - For discrepancy alert:
     - Shorten from `[ REQUISITOS DISCREPANTES ]` (26 chars) to `[ REQ. DISCREPANTES ]` or `[ DISCREPANCIA ]` (15 chars) on the card, retaining the full explanation in tooltip and detail modal.
2. **Streamline Recency Badge (`NUEVA`)**:
   - Reduce padding (`px-1.5 py-0.5 text-[9px]`) or integrate the recency badge cleanly so it does not compete with primary seniority tags.
3. **Compact Fit Score Badge**:
   - Modernize the Fit Score box into a single-line sleek monospace badge (e.g. `41% MATCH` or `41% FIT`) with `px-2 py-0.5 text-[10px]`, reducing width by ~30% and freeing up valuable horizontal space for tags.
4. **Header Alignment**:
   - Use `items-start` on the header flex container so that if tags wrap on narrow mobile viewports, the layout aligns cleanly without vertical center-stretching.

**Alternatives**:
- *Hide `NUEVA` badge when `0 EXP` is shown*: Rejected because recency (<48h) is valuable information for early-career applicants.
- *Move all badges below the title*: Rejected because badges are the primary visual anchor for scanning roles in the Midudev-inspired monospace aesthetic.

**Files likely to change**:
- `frontend/src/components/VacancyCard.tsx`
- `frontend/tests/components/VacancyCard.test.tsx`

**Tests to add or update**:
- Update `VacancyCard.test.tsx` to assert new compact badge strings (`[ 0 EXP ]`, `[ ✓ 0 EXP ]`, `[ REQ. DISCREPANTES ]`) and ensure accessibility tooltips and modal contracts remain intact.

## Risks & Considerations

- **Visual Consistency**: Ensure the color coding (`emerald` for 0 Exp, `cyan` for Pasantía, `violet` for JR, `amber` for Mid/Discrepancy, `rose` for SR) is strictly preserved while saving ~40% of character width.
- **Full Detail Preservation**: The `VacancyDetailModal` must continue to display the full explanatory texts (`[ ✓ AUDITADO 0 EXP ]`, full reasoning, and complete discrepancy alerts).

## Open Questions

- None. The screenshot provides definitive evidence of the wrapping issue and the proposed shortening solves the overflow directly.
