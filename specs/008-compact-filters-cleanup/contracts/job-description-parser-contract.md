# Contract: Job Description Parser & Visual Formatter

**Feature Branch**: `008-compact-filters-cleanup`  
**Date**: 2026-11-15  
**Spec**: [spec.md](../spec.md)

---

## 1. Parser Function Signature

```typescript
export function parseJobDescription(rawText: string): StructuredJobDescription;
```

### Input
- `rawText`: Scraped job posting text or HTML content (e.g. from Computrabajo, Indeed, or OCC). Can contain HTML tags, markdown bullets, plain text, or inconsistent line breaks.

### Output
```typescript
export interface StructuredJobDescription {
  hasStructuredSections: boolean;
  sections: ParsedJobSection[];
  rawText: string;
}

export interface ParsedJobSection {
  id: "overview" | "responsibilities" | "requirements" | "benefits" | "conditions";
  title: string;
  iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin";
  items: string[];
}
```

---

## 2. Parsing Rules & Pattern Dictionary

### Section Header Detection
A line triggers a section transition when it matches any pattern below (case-insensitive, trimming whitespace, trailing colons or punctuation):

| Section ID | Icon | Spanish Header Patterns |
|------------|------|-------------------------|
| `responsibilities` | `ListChecks` | `responsabilidades`, `funciones`, `actividades`, `tareas`, `lo que har[aá]s`, `tu rol`, `principales funciones`, `descripci[oó]n del puesto` |
| `requirements` | `CheckCircle2` | `requisitos`, `perfil`, `conocimientos`, `qu[eé] buscamos`, `habilidades`, `experiencia requerida`, `competencias`, `lo que necesitas`, `skills` |
| `benefits` | `Gift` | `beneficios`, `ofrecemos`, `prestaciones`, `qu[eé] ofrecemos`, `compensaci[oó]n`, `lo que te ofrecemos` |
| `conditions` | `MapPin` | `condiciones`, `horario`, `jornada`, `lugar de trabajo`, `ubicaci[oó]n`, `tipo de contrato`, `modalidad de trabajo` |

Any text preceding the first detected specialized section header is assigned to `overview` (`Briefcase`).

### Bullet Tokenization Rules
Within any section:
1. Lines starting with list bullet markers: `^(\s*[-*•▪▫–—]|\s*\d+[\.\)])\s*(.*)$` are parsed as distinct list items.
2. Consecutive lines of bullet text are grouped into distinct entries.
3. Plain paragraph blocks are trimmed and kept as individual content blocks.
4. Empty lines are ignored.

### Fallback Behavior
- If no section headers are detected across the text:
  - `hasStructuredSections` = `false`
  - Generates a single section (`id: "overview"`, `title: "Resumen del Puesto"`) containing parsed paragraphs/bullets.
  - Zero empty sections are emitted.

---

## 3. Sanitization & Rendering Contract

1. **XSS Defense**:
   - Every text item rendered in the DOM MUST pass through `DOMPurify.sanitize(...)` prior to display.
2. **Visual Presentation (`JobDescriptionViewer.tsx`)**:
   - Each section renders inside:
     ```html
     <div class="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
       <div class="flex items-center gap-2 mb-2.5">
         <Icon class="w-4 h-4 text-slate-700" />
         <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">{section.title}</h4>
       </div>
       <ul class="space-y-1.5">
         <li class="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
           <span class="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
           <span>{item}</span>
         </li>
       </ul>
     </div>
     ```
3. **Responsive Grid**:
   - Stacks cleanly in the detail pane and inside the mobile bottom sheet (`flex flex-col gap-3`).
