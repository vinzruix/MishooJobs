# Interface & Component Contracts

**Feature Branch**: `007-modern-jobs-ui`  
**Date**: 2026-11-15  
**Spec Reference**: `specs/007-modern-jobs-ui/spec.md`  

---

## 1. UI Component Boundaries

The UI redesign establishes a clear decoupling between the **Master Feed** (left column), the **Detail Presentation** (right column or mobile drawer), and the **Filter Controls**.

```
App.tsx
├── Header (Clean, Light navigation & Perfil Maestro trigger)
├── CleanSearchBar (Query + Mexican Location)
├── CleanFilterBar / FilterDrawer (No marketing slop, compact pills)
└── MasterDetailLayout
    ├── MasterFeed (lg:col-span-5, 40% width)
    │   ├── ResultCountHeader ("29 vacantes encontradas")
    │   ├── VacancyCardList
    │   │   └── VacancyCard (Squircle logo, Title, 0 Exp badge, Salary, Time)
    │   └── Empty / Skeleton States
    ├── DetailStickyPane (lg:col-span-7, 60% width, hidden on < 1024px)
    │   └── VacancyDetailPane
    │       ├── DetailHeader (Company squircle, Title, Location, Save button)
    │       ├── PastelMetricGrid (Salary, Modality, Experience, Seniority)
    │       ├── SegmentedTabSwitch ("Descripción" | "Evaluación AI")
    │       ├── TabContent (DOMPurified description or deep AI match breakdown)
    │       └── StickyActionBar ("Postularme ahora" full-width dark pill)
    └── MobileDetailDrawer (Vaul Drawer.Root, active on < 1024px)
        └── VacancyDetailPane (Same shared component)
```

---

## 2. Keyboard Interaction Contract

| Key | Context | Action |
| --- | --- | --- |
| `/` | Anywhere | Focus main search bar |
| `j` or `↓` | Job feed | Select next card; scroll active card into view; update right detail pane |
| `k` or `↑` | Job feed | Select previous card; scroll active card into view; update right detail pane |
| `Space` | Detail view | Toggle/cycle between `Descripción` and `Evaluación AI` tabs |
| `Enter` | Active card / Detail view | Open primary verified application link in new tab ("Postularme ahora") |
| `s` | Selected card | Save/bookmark vacancy to Dexie.js local pipeline |
| `a` | Selected card | Mark vacancy as applied in Dexie.js local pipeline |
| `Esc` | Mobile drawer | Close mobile slide-up sheet; return focus to master card |

---

## 3. Visual Token Contract (Light Theme)

| Token | Class / CSS Value | Description |
| --- | --- | --- |
| `canvas-bg` | `bg-[#F8F9FA]` / `bg-slate-50` | Soft off-white neutral canvas |
| `card-bg` | `bg-white` | Pure white container surfaces |
| `card-border` | `border border-slate-200/80` | Subtle structural division |
| `card-radius` | `rounded-2xl` / `rounded-3xl` | Generous Apple-style corner curvature |
| `primary-pill` | `bg-slate-900 text-white hover:bg-slate-800` | Authoritative dark accent for CTA and active tabs |
| `metric-salary` | `bg-emerald-50 text-emerald-950 border-emerald-200` | Green pastel compensation block |
| `metric-modality` | `bg-sky-50 text-sky-950 border-sky-200` | Cyan/blue pastel work arrangement block |
| `metric-experience` | `bg-amber-50 text-amber-950 border-amber-200` | Peach/orange pastel experience/match block |
| `metric-seniority` | `bg-purple-50 text-purple-950 border-purple-200` | Violet pastel seniority tier block |
| `squircle-logo` | `rounded-2xl bg-slate-100 flex items-center justify-center` | Squircle icon placeholder for company branding |
