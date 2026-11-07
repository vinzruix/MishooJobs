# UI Contracts: Date-Relevant Vacancy Filters (MishooJobs)

**Feature**: `002-date-vacancy-filters`  
**Date**: 2026-11-06  
**Status**: Complete  

---

## 1. URL Query Parameter Contract

### Query Key
`published_within`

### Format Specification
- **Single selection**: `?published_within=24h`
- **Multi-selection (Inclusive Union)**: `?published_within=1h,3d` (comma-separated tokens)
- **Unbounded / Default**: When "Cualquier fecha" is active, `published_within` is omitted from the URL.

### Token Mapping Table

| Token | Filter Option | Age Threshold ($\le \Delta t$) |
|-------|---------------|---------------------------------|
| `1h` | Última hora | 60 minutes |
| `24h` | Últimas 24 horas | 24 hours (inclusive of ≤ 1h) |
| `3d` | Últimos 3 días | 72 hours (inclusive of ≤ 24h) |
| `7d` | Última semana | 7 days (inclusive of ≤ 72h) |
| `30d` | Último mes | 30 days (inclusive of ≤ 7d) |
| `30d_plus` | Más de 1 mes | > 30 days |
| `all` | Cualquier fecha | Unbounded (omits parameter) |

### Validation & Fallback Rules
- If an unrecognized token is provided (e.g., `?published_within=invalid_tier`), the client ignores the token and falls back to `["all"]` without breaking the application or altering other active parameters.
- Browser `popstate` events trigger synchronization with UI state.

---

## 2. Sorting Control Contract

### Control Location
Visible dropdown positioned in the results header bar directly above the vacancy grid.

### Options Specification

| Identifier | UI Label (Mexican Spanish) | Sorting Behavior |
|------------|----------------------------|------------------|
| `recent` | "Más recientes primero" | Orders listings by `published_at` descending; postings with `null` dates sorted to the end. |
| `compatibility` | "Mayor compatibilidad (Fit Score)" | Orders listings by `fitScore` descending; unscored postings sorted to the end. |
| `relevance` | "Relevancia por defecto" | Maintains live stream / deduplicated arrival order. |

### Smart Recency Auto-Switch Rule
- Trigger: User selects a date filter of $\le 3$ days (`1h`, `24h`, or `3d`).
- Condition: User has NOT explicitly modified the sorting dropdown during the current session (`isSortUserOverridden === false`).
- Action: Sorting dropdown value automatically updates to `recent`.

---

## 3. Card Relative Timestamps & "Nueva" Badge Contract

### VacancyCard Display Elements
1. **Relative Timestamp**:
   - Renders in Mexican Spanish font (`font-mono text-xs text-zinc-400`).
   - Accompanied by a `Clock` icon (`lucide-react`).
   - Automatically updates every 60 seconds via `useDateTicker`.
2. **"Nueva" Badge**:
   - Renders when `published_at !== null` and `(now - published_at) <= 48 hours`.
   - Styling:
     ```html
     <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-600/80 animate-pulse">
       Nueva
     </span>
     ```

---

## 4. Empty State Contract

### Trigger Condition
When active vacancies count is 0, AND `timeframes` does NOT contain `"all"`.

### Visual Contract
```html
<div class="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg p-6">
  <Clock class="w-10 h-10 text-zinc-600 mb-2" />
  <p class="text-sm font-semibold text-zinc-300">
    No se encontraron vacantes para este marco de tiempo
  </p>
  <p class="text-xs text-zinc-500 mt-1 max-w-sm">
    Prueba ampliando tu filtro a <button class="text-emerald-400 underline hover:text-emerald-300 font-medium">Última semana</button> para descubrir más oportunidades.
  </p>
  <button class="mt-4 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors">
    <RotateCcw class="w-3.5 h-3.5 text-zinc-400" />
    <span>Limpiar filtro de fecha</span>
  </button>
</div>
```
