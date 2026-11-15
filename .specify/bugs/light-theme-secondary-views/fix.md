# Bug Fix: Incomplete Light Theme Design System Migration Across Search, Secondary Views, and Modals

- **Slug**: light-theme-secondary-views
- **Fixed**: 2026-11-15T01:27:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Migrated all secondary views, search inputs, deduplication summary indicators, auxiliary modals, and viewer toolbars from the legacy dark theme (`zinc-900`, `zinc-950`, `border-zinc-800`, `text-zinc-100`) to the Emil Kowalski / Apple-inspired light design system (`#F8F9FA` canvas, clean white container cards, slate-900 accents, and semantic pastel metric badges).

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/SearchBar.tsx` | modified | Converted dark floating box to white container (`bg-white border-slate-200/80 rounded-2xl shadow-xs`), slate-900 search action button, and slate-400 icons |
| `frontend/src/App.tsx` | modified | Replaced dark deduplication badge with soft pastel alert (`bg-indigo-50 border-indigo-100/90 text-indigo-900 rounded-xl`) and updated empty search state to light cards |
| `frontend/src/components/FitScoreBadge.tsx` | modified | Updated match tiers to light pastel styles (`emerald-50`, `amber-50`, `slate-100`) matching `PastelMetricGrid` |
| `frontend/src/components/PipelineView.tsx` | modified | Converted container, columns, and cards to `bg-white border-slate-200/80 rounded-2xl` with soft pastel status chips and slate action controls |
| `frontend/src/components/ResumeLibraryView.tsx` | modified | Switched view typography to `font-sans`, cards to white with `border-slate-200/80 rounded-2xl`, refined empty state, and modern slate buttons |
| `frontend/src/components/MasterProfileEditor.tsx` | modified | Modernized modal overlay (`bg-slate-900/40 backdrop-blur-sm`), white modal container, light line-number gutter (`bg-slate-50`), light textarea, and side drawer |
| `frontend/src/components/AvatarUploader.tsx` | modified | Converted dark avatar uploader card to `bg-white border-slate-200/80 rounded-xl` with light buttons and status badges |
| `frontend/src/components/RoleArchetypeModal.tsx` | modified | Modernized overlay, white modal container, light inputs, tag badges, and slate-900 submit action |
| `frontend/src/components/VacancyTailorModal.tsx` | modified | Converted modal container to white with light summary card, light completeness alert, and slate-900 submit action |
| `frontend/src/components/SyncImprovementsModal.tsx` | modified | Replaced pitch-black diff modal with white container, light comparison panes, and slate-900 confirmation action |
| `frontend/src/components/LiveCVViewer.tsx` | modified | Converted top toolbar to `bg-white/90 backdrop-blur-md border-slate-200`, light template switcher, light copy dropdown, and light status bars |
| `frontend/src/components/templates/CVPageSheet.tsx` | modified | Replaced dark divider between page 1 and page 2 with light slate divider |
| `frontend/src/components/ProfileManagerModal.tsx` | modified | Modernized modal container to white with light privacy notice, upload zone, and profile card list |
| `frontend/tests/components/SearchBar.test.tsx` | added test | Verifies light styling tokens and form submission |
| `frontend/tests/components/PipelineView.test.tsx` | added test | Verifies light container, pastel status chips, and application status update/removal flows |
| `frontend/tests/components/ResumeLibraryView.test.tsx` | modified | Added assertions for `font-sans`, white card styling, and light empty state |
| `frontend/tests/components/MasterProfileEditor.test.tsx` | modified | Added assertions for light overlay and white modal container |

## Diff Highlights (optional)

```tsx
// SearchBar.tsx
- <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 focus-within:border-emerald-500/60 transition-colors shadow-lg">
+ <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white border border-slate-200/80 rounded-2xl p-2 focus-within:border-slate-400 transition-colors shadow-xs">

// App.tsx
- <div className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded flex items-center justify-between">
+ <div className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-100/90 px-3.5 py-2 rounded-xl flex items-center justify-between shadow-xs">

// PipelineView.tsx
- { id: "saved", label: "Guardadas", icon: Bookmark, color: "text-amber-400 border-amber-800 bg-amber-950/40" },
+ { id: "saved", label: "Guardadas", icon: Bookmark, color: "text-amber-800 border-amber-200 bg-amber-50" },
```

## Tests Added or Updated

- `frontend/tests/components/SearchBar.test.tsx::SearchBar Light Theme & Functionality Tests` — Verifies light container, input text, and submit button styles.
- `frontend/tests/components/PipelineView.test.tsx::PipelineView Light Theme & Interaction Tests` — Verifies light containers, pastel status badges, status change comboboxes, and empty states.
- `frontend/tests/components/ResumeLibraryView.test.tsx` — Verifies card containers have `bg-white` and `border-slate-200/80`, and empty state has `bg-white/60`.
- `frontend/tests/components/MasterProfileEditor.test.tsx` — Verifies modal backdrop has `bg-slate-900/40` and modal container has `bg-white` and `border-slate-200`.

## Local Verification

- Commands run:
  - `cd frontend && npm test -- --run` → 22 test files passed, 159 tests passed (0 failed).
  - `.venv/bin/pytest backend/tests/ -v` → 56 passed in 8.84s (0 failed).
- Manual checks:
  - Verified no residual `zinc-` background or text colors remain in `frontend/src/` outside the printed CV templates (`ClassicATS.tsx`, `ModernExecutive.tsx`, `TechnicalHighDensity.tsx`).

## Deviations from Assessment

None. All files specified in the preferred remediation plus adjacent modal components (`ProfileManagerModal.tsx`, `CVPageSheet.tsx`, `FitScoreBadge.tsx`) were cohesively updated.

## Follow-ups

- None. Ready for testing via `/speckit-bug-test slug=light-theme-secondary-views`.
