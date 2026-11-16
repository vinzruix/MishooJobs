# Bug Assessment: Hide Visible Horizontal Scrollbar in FilterToolbar

- **Slug**: filter-bar
- **Created**: 2026-11-16T01:12:35Z
- **Source**: Pasted text and screenshot (`media_1794791426616_6f00cfda.png`)
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> "The gray bar breaks with the style make it invisible. slug=filter-bar"

Accompanying screenshot shows a prominent gray horizontal scrollbar track and thumb directly underneath the filter pills inside the `FilterToolbar` container.

## Symptom

When the `FilterToolbar` contents overflow horizontally (e.g. at viewports around 1024px or on smaller screens), a prominent custom gray scrollbar (`#cbd5e1` thumb over `#f1f5f9` track) appears directly beneath the filter controls. The expected behavior is for the horizontal scrollbar to be completely invisible across all browsers while preserving fluid touch/drag/wheel horizontal scrolling, matching the clean Emil Kowalski design system.

## Reproduction

1. Open the MishooJobs application at `http://localhost:5173/` in a WebKit-based browser (Chrome, Edge, Safari).
2. Resize the viewport to ~1024px width or any width where the `FilterToolbar` content overflows horizontally.
3. Observe the bottom edge of the filter toolbar directly underneath the filter pills.
4. Notice the visible 6px gray horizontal scrollbar track and thumb.

## Suspected Code Paths

- `frontend/src/index.css:33-47` — Global `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, and `::-webkit-scrollbar-thumb` styles unconditionally render a 6px gray scrollbar on all scrolling containers without providing a `.no-scrollbar` utility.
- `frontend/src/components/FilterToolbar.tsx:170` — The container applies `className="... overflow-x-auto flex-nowrap no-scrollbar py-0.5 text-xs"`, but `.no-scrollbar` is not declared anywhere in `index.css` or `tailwind.config.js`.

## Root Cause Hypothesis

The root cause is that `FilterToolbar.tsx` references a `.no-scrollbar` CSS class under the assumption that it suppresses the scrollbar, but no `.no-scrollbar` utility is defined in `frontend/src/index.css` or Tailwind configuration. Consequently, the global WebKit scrollbar rules defined in `index.css` (`width: 6px; height: 6px; background: #cbd5e1`) style the overflowing container with a visible gray bar instead of hiding it.
**Confidence**: High.

## Proposed Remediation

**Preferred**:
Define a standard cross-browser `.no-scrollbar` utility class in `frontend/src/index.css` under `@layer utilities`:
```css
@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}
```
This cleanly suppresses the scrollbar across WebKit, Firefox, and Edge while preserving scroll functionality and touch gestures.

**Alternatives**:
- Inlining `style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}`: More fragile and doesn't cleanly handle `::-webkit-scrollbar` pseudo-elements in inline React style attributes.

**Files likely to change**:
- `frontend/src/index.css`
- `frontend/src/components/FilterToolbar.tsx` (verify class presence)

**Tests to add or update**:
- Visual inspection via browser subagent verifying scrollbar invisibility at 1024px viewport width while retaining horizontal scroll behavior.
- Run frontend unit/component tests (`npm test -- --run`) to ensure no regressions.

## Risks & Considerations

- Ensure accessibility: users without trackpads or touchscreens can still navigate horizontally via keyboard navigation / tab focus or shift-wheel.
- Zero risk to business logic, API contracts, or candidate privacy.

## Open Questions

- None.
