# Contract: Brand Logo Header & Browser Favicon

**Feature**: `009-custom-logo-primer-empleo`  
**Scope**: `frontend/src/components/Header.tsx`, `frontend/index.html`, `frontend/src/assets/mishoojobs-logo.png`, `frontend/public/favicon.svg`, `frontend/public/favicon.png`

## 1. Header Component Contract (`Header.tsx`)

### Props Interface (Unchanged)
```ts
interface HeaderProps {
  activeTab: "search" | "pipeline" | "resumes";
  setActiveTab: (tab: "search" | "pipeline" | "resumes") => void;
  onOpenMasterProfile: () => void;
  resumesCount?: number;
}
```

### Brand Element Requirements
1. **Interactive Brand Trigger**:
   - The brand logo badge and `"MishooJobs"` wordmark MUST be wrapped in a semantic `<button type="button">` element (`data-testid="brand-home-btn"`, `aria-label="MishooJobs - Ir a Vacantes"`).
   - Clicking the button MUST call `setActiveTab("search")`, which in `App.tsx` resets `activeTab` to `"search"` and clears `viewingResumeId` (`null`) so users return directly to the primary `"Vacantes"` view from `"Postulaciones"`, `"CVs"`, or `LiveCVViewer`.
2. **Mascot Badge Container**:
   - MUST render the cleaned custom mascot asset (`mishoojobs-logo.png`) inside an `<img>` element (`alt="Logo de MishooJobs"`, `className="w-full h-full object-contain"`).
   - MUST replace the legacy Lucide `<Briefcase />` brand icon; `<Briefcase>` MUST NOT be imported or rendered in `Header.tsx`.
   - Badge container MUST use a subtle light rounded-square treatment with thin border (e.g., `w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0`).
3. **Interaction & Responsive Ergonomics**:
   - Button MUST apply `shrink-0`, subtle tactile press feedback (`transition-transform duration-150 ease-out active:scale-[0.98]`), and keyboard focus ring (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-xl`).
   - On narrow mobile viewports (`<768px` / `375px`) and desktop viewports, the logo badge MUST preserve its 1:1 aspect ratio without clipping, overlapping navigation controls, or wrapping the brand title onto extra lines.

## 2. Document Head & Favicon Contract (`frontend/index.html`)

- MUST remove `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`.
- MUST declare:
  ```html
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  ```
- Both `/favicon.svg` and `/favicon.png` MUST frame the cleaned suited black cat mascot on a light/white rounded-square backing badge (`#FFFFFF`/`#F8FAFC` with thin `#E2E8F0` border) so the dark cat remains legible on dark-mode and light-mode browser tabs.
