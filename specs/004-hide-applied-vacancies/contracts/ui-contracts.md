# UI Contracts: Hide Applied Vacancies & Search Feed Clean-Up

**Feature**: `004-hide-applied-vacancies`  
**Date**: 2026-11-08  
**Status**: Complete  

---

## 1. Toolbar Toggle Pill Contract

### Location
Positioned in the search results header toolbar (`VacancyList`), between the live count summary and the sorting dropdown.

### Visual States & Classes

#### Inactive State (`hideApplied === false`)
- **Label**: `Ocultar postuladas`
- **Icon**: `EyeOff` (`lucide-react`, `w-3 h-3 text-zinc-400`)
- **Counter Badge**: `(N)` rendered in `text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400`
- **Container Styling**:
  ```html
  <button
    type="button"
    title="Ocultar vacantes con postulación enviada (Atajo: H)"
    aria-pressed="false"
    class="px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
  >
    <EyeOff class="w-3.5 h-3.5 text-zinc-400" />
    <span>Ocultar postuladas</span>
    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
      {hiddenCount}
    </span>
  </button>
  ```

#### Active State (`hideApplied === true`)
- **Label**: `Ocultando postuladas`
- **Icon**: `Eye` (`lucide-react`, `w-3.5 h-3.5 text-emerald-400`)
- **Counter Badge**: `(N)` rendered in `text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-900/90 text-emerald-200 font-bold`
- **Container Styling**:
  ```html
  <button
    type="button"
    title="Mostrar vacantes con postulación enviada (Atajo: H)"
    aria-pressed="true"
    class="px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold shadow-xs shadow-emerald-500/20"
  >
    <Eye class="w-3.5 h-3.5 text-emerald-400" />
    <span>Ocultando postuladas</span>
    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-900/90 text-emerald-200 font-bold">
      {hiddenCount}
    </span>
  </button>
  ```

---

## 2. FilterDrawer Toggle Contract

### Location
Dedicated filter block within `FilterDrawer.tsx` alongside Modality, Seniority, and Publication Timeframe.

### Visual Specification
```html
<div class="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/80">
  <div class="flex items-center gap-2">
    <EyeOff class="w-3.5 h-3.5 text-emerald-400" />
    <span class="text-xs font-medium text-zinc-300">Ocultar postuladas</span>
    {hiddenCount > 0 && (
      <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
        {hiddenCount}
      </span>
    )}
  </div>
  <button
    type="button"
    role="switch"
    aria-checked={hideApplied}
    onClick={onToggleHideApplied}
    class={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      hideApplied ? "bg-emerald-600" : "bg-zinc-800"
    }`}
  >
    <span
      class={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        hideApplied ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
</div>
```

---

## 3. Results Summary Text Contract

### Location
Left side of results header toolbar (`VacancyList.tsx`).

### Text Formatting Rules
1. **Default / Inactive (`hideApplied === false` or `hiddenCount === 0`)**:
   `Mostrando <strong class="text-emerald-400 font-semibold">{visibleCount}</strong> vacantes verificadas en vivo`
2. **Active with Hidden Listings (`hideApplied === true && hiddenCount > 0`)**:
   `Mostrando <strong class="text-emerald-400 font-semibold">{visibleCount}</strong> vacantes verificadas en vivo <span class="text-zinc-500 text-[11px]">({hiddenCount} {hiddenCount === 1 ? "postulada oculta" : "postuladas ocultas"})</span>`

---

## 4. Keyboard Navigation Contract (`h` / `H`)

### Handler Specification
In `useKeyboardNavigation.ts`:
- **Key codes**: `e.key === "h" || e.key === "H"`
- **Preconditions**:
  1. `isModalOpen === false` (ignored if vacancy detail modal or profile manager modal is open)
  2. Target element is NOT an editable input:
     - `target.tagName !== "INPUT"`
     - `target.tagName !== "TEXTAREA"`
     - `target.tagName !== "SELECT"`
     - `!target.isContentEditable`
- **Action**:
  - `e.preventDefault()`
  - Call `onToggleHideApplied()`

---

## 5. 100% Applied Empty State Contract

### Trigger Condition
- `isHideApplied === true`
- `hiddenCount > 0`
- `displayedVacancies.length === 0`
- `unignoredMatchingVacancies.length > 0` (listings exist for current query/facets, but all have post-application status)

### Component Markup
```html
<div class="py-16 text-center flex flex-col items-center justify-center border border-dashed border-emerald-900/60 bg-emerald-950/10 rounded-lg p-6">
  <div class="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center mb-3">
    <CheckCircle2 class="w-6 h-6 text-emerald-400" />
  </div>
  <p class="text-sm font-semibold text-zinc-200">
    ¡Te has postulado a todas las vacantes encontradas para este criterio!
  </p>
  <p class="text-xs text-zinc-400 mt-1 max-w-md">
    Has completado la postulación de las {hiddenCount} {hiddenCount === 1 ? "vacante coincidente" : "vacantes coincidentes"}. Puedes revisar tu progreso en la pestaña de Postulaciones o verlas nuevamente aquí.
  </p>
  <button
    type="button"
    onClick={onToggleHideApplied}
    class="mt-4 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
  >
    <Eye class="w-3.5 h-3.5 text-emerald-400" />
    <span>Mostrar vacantes postuladas ({hiddenCount})</span>
  </button>
</div>
```

---

## 6. Local Storage Persistence Contract

### Storage Key
`mishoojobs_hide_applied`

### Behavior
- On component mount (`App.tsx`):
  ```typescript
  const [hideApplied, setHideApplied] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem("mishoojobs_hide_applied");
      return stored !== null ? JSON.parse(stored) === true : false;
    } catch {
      return false;
    }
  });
  ```
- On state change:
  ```typescript
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("mishoojobs_hide_applied", JSON.stringify(hideApplied));
    } catch {
      // Graceful ignore
    }
  }, [hideApplied]);
  ```
- **URL Query Policy**: Never append, modify, or read `hide_applied` from `window.location.search`.
