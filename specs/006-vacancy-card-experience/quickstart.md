# Quickstart Validation Guide: Specific Experience Requirement on Vacancy Cards

**Feature**: `006-vacancy-card-experience`  
**Date**: 2026-11-13  
**Status**: Ready for Implementation  

---

## 1. Prerequisites

- Node.js 20+ and npm installed.
- Repository dependencies installed (`cd frontend && npm install`).

---

## 2. Automated Test Validation (Vitest)

Run the component test suite offline to verify formatting and rendering across all experience levels:

```bash
cd frontend
npm test -- tests/components/VacancyCard.test.tsx --run
```

### Expected Test Assertions

1. **Zero Experience (0 años)**:
   - Given a vacancy with `years_required_min: 0`, the card renders text `"0 años de exp"`.
2. **Single Year Experience (1 año)**:
   - Given a vacancy with `years_required_min: 1`, the card renders text `"1 año de exp"` (strictly singular).
3. **Multiple Years Experience (2+ años)**:
   - Given a vacancy with `years_required_min: 3`, the card renders text `"3 años de exp"` (strictly plural).
4. **Metadata Icon Presence**:
   - The `Briefcase` icon is rendered within the metadata row.

---

## 3. End-to-End Visual Verification

1. Start the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open `http://localhost:5173` in a browser.
3. Observe the search feed results:
   - Every vacancy card displays its required experience in the metadata row between Salary and Relative Time (e.g. `📍 Guadalajara, JAL  💵 $18,000 MXN /mes  💼 1 año de exp  🕒 Hace 2 días`).
   - Cards with `primer_empleo` or zero required experience show `💼 0 años de exp`.
   - Cards with `junior` roles requiring 1 year show `💼 1 año de exp`.
   - Cards with `mid` or `senior` roles show their exact required number (e.g., `💼 3 años de exp`, `💼 5 años de exp`).
4. Resize viewport to mobile (375px width):
   - Confirm metadata row wraps cleanly across lines without horizontal scrolling or card action button overflow.
