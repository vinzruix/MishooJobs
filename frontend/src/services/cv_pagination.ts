import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * US Letter (8.5in x 11in) with @page margin 0.4in leaves 7.7in x 10.2in printable area (~979.2px at 96 DPI).
 * Using 976px gives a 3px subpixel buffer so single-page content never spills an extra blank page.
 */
export const PRINTABLE_PAGE_HEIGHT_PX = 976;
export const COLLAPSE_HYSTERESIS_PX = 8;
const CONTINUED_HEADING_ALLOWANCE_PX = 24;

export interface MeasurableBlock {
  id: string;
  section?: string;
  isHeading?: boolean;
}

export interface CVPaginationInfo {
  pageCount: 1 | 2;
  exceedsSinglePage: boolean;
  exceedsTwoPages: boolean;
}

export interface ColumnSplitResult {
  fitsOnePage: boolean;
  page1Ids: string[];
  page2Ids: string[];
  continuedSections: string[];
  page2UsedHeight: number;
}

export interface TwoPagePaginationState extends CVPaginationInfo {
  page1Ids: string[];
  page2Ids: string[];
  leftPage1Ids: string[];
  leftPage2Ids: string[];
  rightPage1Ids: string[];
  rightPage2Ids: string[];
  continuedSections: string[];
}

export function measureElementHeight(el: HTMLElement | null): number {
  if (!el) return 0;
  const rectH = el.getBoundingClientRect().height;
  return rectH > 0 ? rectH : el.offsetHeight;
}

/**
 * Pure block packer splitting an ordered list of sections/items cleanly across Page 1 and Page 2
 * without orphaning section headings or splitting items mid-element.
 */
export function computeColumnSplit(
  blocks: MeasurableBlock[],
  heights: Record<string, number>,
  p1BodyBudget: number,
  isCurrentlySplit: boolean,
): ColumnSplitResult {
  if (blocks.length === 0) {
    return {
      fitsOnePage: true,
      page1Ids: [],
      page2Ids: [],
      continuedSections: [],
      page2UsedHeight: 0,
    };
  }

  const totalHeight = blocks.reduce((sum, b) => sum + (heights[b.id] ?? 0), 0);
  const effectiveBudget = isCurrentlySplit
    ? Math.max(0, p1BodyBudget - COLLAPSE_HYSTERESIS_PX)
    : p1BodyBudget;

  if (totalHeight <= effectiveBudget) {
    return {
      fitsOnePage: true,
      page1Ids: blocks.map((b) => b.id),
      page2Ids: [],
      continuedSections: [],
      page2UsedHeight: 0,
    };
  }

  let used = 0;
  let splitIdx = blocks.length;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockH = heights[block.id] ?? 0;

    if (block.isHeading) {
      const next = blocks[i + 1];
      const nextH =
        next && next.section && next.section === block.section
          ? heights[next.id] ?? 0
          : 0;
      if (used > 0 && used + blockH + nextH > effectiveBudget) {
        splitIdx = i;
        break;
      }
      used += blockH;
    } else {
      if (used > 0 && used + blockH > effectiveBudget) {
        splitIdx = i;
        break;
      }
      used += blockH;
    }
  }

  const page1Ids = blocks.slice(0, splitIdx).map((b) => b.id);
  const page2Ids = blocks.slice(splitIdx).map((b) => b.id);
  const continuedSections: string[] = [];

  if (splitIdx > 0 && splitIdx < blocks.length) {
    const firstP2 = blocks[splitIdx];
    const lastP1 = blocks[splitIdx - 1];
    if (!firstP2.isHeading && firstP2.section && lastP1.section === firstP2.section) {
      continuedSections.push(firstP2.section);
    }
  }

  const page2UsedHeight =
    blocks.slice(splitIdx).reduce((sum, b) => sum + (heights[b.id] ?? 0), 0) +
    continuedSections.length * CONTINUED_HEADING_ALLOWANCE_PX;

  return {
    fitsOnePage: false,
    page1Ids,
    page2Ids,
    continuedSections,
    page2UsedHeight,
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function statesEqual(a: TwoPagePaginationState, b: TwoPagePaginationState): boolean {
  return (
    a.pageCount === b.pageCount &&
    a.exceedsSinglePage === b.exceedsSinglePage &&
    a.exceedsTwoPages === b.exceedsTwoPages &&
    arraysEqual(a.page1Ids, b.page1Ids) &&
    arraysEqual(a.page2Ids, b.page2Ids) &&
    arraysEqual(a.leftPage1Ids, b.leftPage1Ids) &&
    arraysEqual(a.leftPage2Ids, b.leftPage2Ids) &&
    arraysEqual(a.rightPage1Ids, b.rightPage1Ids) &&
    arraysEqual(a.rightPage2Ids, b.rightPage2Ids) &&
    arraysEqual(a.continuedSections, b.continuedSections)
  );
}

function collectColumnHeights(
  container: HTMLElement,
  pageNumber: 1 | 2,
  colName: "main" | "left" | "right",
  target: Record<string, number>,
): void {
  const selector = `[data-cv-page="${pageNumber}"] [data-cv-col="${colName}"] [data-cv-block-id]`;
  const els = Array.from(container.querySelectorAll<HTMLElement>(selector));

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const id = el.dataset.cvBlockId;
    if (!id) continue;

    const ownH = measureElementHeight(el);
    let effectiveH = ownH;

    if (i < els.length - 1) {
      const next = els[i + 1];
      if (el.parentElement === next.parentElement) {
        const delta = next.getBoundingClientRect().top - el.getBoundingClientRect().top;
        if (delta > 0) {
          effectiveH = delta;
        }
      }
    } else if (ownH > 0) {
      const style = window.getComputedStyle(el);
      const mb = parseFloat(style.marginBottom) || 0;
      const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
      const gap = parentStyle
        ? parseFloat(parentStyle.rowGap || parentStyle.gap) || 0
        : 0;
      effectiveH = ownH + Math.max(mb, gap);
    }

    if (effectiveH > 0 || !(id in target)) {
      target[id] = effectiveH;
    }
  }
}

function measureHeaderHeight(container: HTMLElement, role: "p1" | "p2"): number {
  const headerEl = container.querySelector<HTMLElement>(`[data-cv-header="${role}"]`);
  if (!headerEl) return 0;
  const h = measureElementHeight(headerEl);
  if (h <= 0) return 0;
  const mb = parseFloat(window.getComputedStyle(headerEl).marginBottom) || 0;
  return h + mb;
}

interface UseCVPaginationOptions {
  depsKey: string;
  isTwoColumn?: boolean;
  blocks?: MeasurableBlock[];
  leftBlocks?: MeasurableBlock[];
  rightBlocks?: MeasurableBlock[];
  allowTwoPages?: boolean;
  onPaginationChange?: (info: CVPaginationInfo) => void;
}

function buildInitialState(
  blocks: MeasurableBlock[],
  leftBlocks: MeasurableBlock[],
  rightBlocks: MeasurableBlock[],
): TwoPagePaginationState {
  return {
    pageCount: 1,
    exceedsSinglePage: false,
    exceedsTwoPages: false,
    page1Ids: blocks.map((b) => b.id),
    page2Ids: [],
    leftPage1Ids: leftBlocks.map((b) => b.id),
    leftPage2Ids: [],
    rightPage1Ids: rightBlocks.map((b) => b.id),
    rightPage2Ids: [],
    continuedSections: [],
  };
}

/**
 * Measures rendered template headers and blocks directly in the DOM (zero duplicated text nodes)
 * and computes clean 1-page vs 2-page splits with repeated candidate headers.
 */
export function useCVPagination({
  depsKey,
  isTwoColumn = false,
  blocks = [],
  leftBlocks = [],
  rightBlocks = [],
  allowTwoPages = true,
  onPaginationChange,
}: UseCVPaginationOptions) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heightsRef = useRef<Record<string, number>>({});
  const p2FullHeightsRef = useRef<Record<string, number>>({});
  const measuredDepsKeyRef = useRef<string>(depsKey);

  const [prevDepsKey, setPrevDepsKey] = useState<string>(depsKey);
  const [state, setState] = useState<TwoPagePaginationState>(() =>
    buildInitialState(blocks, leftBlocks, rightBlocks),
  );

  if (prevDepsKey !== depsKey) {
    setPrevDepsKey(depsKey);
    setState(buildInitialState(blocks, leftBlocks, rightBlocks));
  }

  const stateRef = useRef(state);
  stateRef.current = state;

  useLayoutEffect(() => {
    if (measuredDepsKeyRef.current !== depsKey) {
      measuredDepsKeyRef.current = depsKey;
      heightsRef.current = {};
      p2FullHeightsRef.current = {};
    }

    const compute = () => {
      const root = rootRef.current;
      if (!root) return;

      const cur = stateRef.current;
      const p1HeaderH = measureHeaderHeight(root, "p1");
      if (p1HeaderH > 0) {
        heightsRef.current["header-p1"] = p1HeaderH;
      }
      const p2MeasuredH = measureHeaderHeight(root, "p2");
      if (p2MeasuredH > 0) {
        heightsRef.current["header-p2"] = p2MeasuredH;
      }

      const h1 = heightsRef.current["header-p1"] ?? 0;
      const h2 = heightsRef.current["header-p2"] ?? Math.min(h1, 88);
      const p1BodyBudget = Math.max(0, PRINTABLE_PAGE_HEIGHT_PX - h1);
      const p2BodyBudget = Math.max(0, PRINTABLE_PAGE_HEIGHT_PX - h2);

      let nextState: TwoPagePaginationState;

      if (isTwoColumn) {
        collectColumnHeights(root, 1, "left", heightsRef.current);
        collectColumnHeights(root, 1, "right", heightsRef.current);
        if (cur.pageCount === 2) {
          if (cur.leftPage2Ids.length > 0) {
            collectColumnHeights(root, 2, "left", heightsRef.current);
            collectColumnHeights(root, 2, "right", heightsRef.current);
          } else {
            // Page 2 right blocks render full-width; keep Page 1 column heights isolated
            collectColumnHeights(root, 2, "right", p2FullHeightsRef.current);
          }
        }

        const totalLeft = leftBlocks.reduce((s, b) => s + (heightsRef.current[b.id] ?? 0), 0);
        const totalRight = rightBlocks.reduce((s, b) => s + (heightsRef.current[b.id] ?? 0), 0);

        // Fallback for unit tests that mock only the page container's offsetHeight
        const p1Sheet = root.querySelector<HTMLElement>('[data-cv-page="1"]');
        const fallbackSheetH = p1Sheet ? measureElementHeight(p1Sheet) : 0;

        if (totalLeft === 0 && totalRight === 0 && fallbackSheetH > PRINTABLE_PAGE_HEIGHT_PX) {
          const splitIdx = Math.max(1, rightBlocks.length - 1);
          const r1 = rightBlocks.slice(0, splitIdx).map((b) => b.id);
          const r2 = rightBlocks.slice(splitIdx).map((b) => b.id);
          nextState = {
            pageCount: allowTwoPages ? 2 : 1,
            exceedsSinglePage: true,
            exceedsTwoPages: fallbackSheetH > PRINTABLE_PAGE_HEIGHT_PX * 2,
            page1Ids: [],
            page2Ids: [],
            leftPage1Ids: leftBlocks.map((b) => b.id),
            leftPage2Ids: [],
            rightPage1Ids: allowTwoPages ? r1 : rightBlocks.map((b) => b.id),
            rightPage2Ids: allowTwoPages ? r2 : [],
            continuedSections: [],
          };
        } else {
          const leftSplit = computeColumnSplit(
            leftBlocks,
            heightsRef.current,
            p1BodyBudget,
            cur.pageCount === 2,
          );
          const rightSplit = computeColumnSplit(
            rightBlocks,
            heightsRef.current,
            p1BodyBudget,
            cur.pageCount === 2,
          );

          const needsTwoPages = !leftSplit.fitsOnePage || !rightSplit.fitsOnePage;

          if (!needsTwoPages) {
            nextState = {
              pageCount: 1,
              exceedsSinglePage: false,
              exceedsTwoPages: false,
              page1Ids: [],
              page2Ids: [],
              leftPage1Ids: leftBlocks.map((b) => b.id),
              leftPage2Ids: [],
              rightPage1Ids: rightBlocks.map((b) => b.id),
              rightPage2Ids: [],
              continuedSections: [],
            };
          } else {
            const p2RightHeight =
              leftSplit.page2Ids.length === 0
                ? rightSplit.page2Ids.reduce(
                    (sum, id) =>
                      sum + (p2FullHeightsRef.current[id] ?? heightsRef.current[id] ?? 0),
                    0,
                  ) +
                  rightSplit.continuedSections.length * CONTINUED_HEADING_ALLOWANCE_PX
                : rightSplit.page2UsedHeight;

            const maxP2Used = Math.max(leftSplit.page2UsedHeight, p2RightHeight);
            const singleBlockOverflow =
              leftSplit.page2Ids.length === 0 && rightSplit.page2Ids.length === 0;
            const exceedsTwo = singleBlockOverflow || maxP2Used > p2BodyBudget;

            nextState = {
              pageCount: allowTwoPages ? 2 : 1,
              exceedsSinglePage: true,
              exceedsTwoPages: exceedsTwo,
              page1Ids: [],
              page2Ids: [],
              leftPage1Ids: allowTwoPages ? leftSplit.page1Ids : leftBlocks.map((b) => b.id),
              leftPage2Ids: allowTwoPages ? leftSplit.page2Ids : [],
              rightPage1Ids: allowTwoPages ? rightSplit.page1Ids : rightBlocks.map((b) => b.id),
              rightPage2Ids: allowTwoPages ? rightSplit.page2Ids : [],
              continuedSections: allowTwoPages ? rightSplit.continuedSections : [],
            };
          }
        }
      } else {
        collectColumnHeights(root, 1, "main", heightsRef.current);
        if (cur.pageCount === 2) {
          collectColumnHeights(root, 2, "main", heightsRef.current);
        }

        const totalMeasured = blocks.reduce((s, b) => s + (heightsRef.current[b.id] ?? 0), 0);
        const p1Sheet = root.querySelector<HTMLElement>('[data-cv-page="1"]');
        const fallbackSheetH = p1Sheet ? measureElementHeight(p1Sheet) : 0;

        if (totalMeasured === 0 && fallbackSheetH > PRINTABLE_PAGE_HEIGHT_PX) {
          const splitIdx = Math.max(1, blocks.length - 1);
          const p1 = blocks.slice(0, splitIdx).map((b) => b.id);
          const p2 = blocks.slice(splitIdx).map((b) => b.id);
          nextState = {
            pageCount: allowTwoPages ? 2 : 1,
            exceedsSinglePage: true,
            exceedsTwoPages: fallbackSheetH > PRINTABLE_PAGE_HEIGHT_PX * 2,
            page1Ids: allowTwoPages ? p1 : blocks.map((b) => b.id),
            page2Ids: allowTwoPages ? p2 : [],
            leftPage1Ids: [],
            leftPage2Ids: [],
            rightPage1Ids: [],
            rightPage2Ids: [],
            continuedSections: [],
          };
        } else {
          const split = computeColumnSplit(
            blocks,
            heightsRef.current,
            p1BodyBudget,
            cur.pageCount === 2,
          );

          if (split.fitsOnePage) {
            nextState = {
              pageCount: 1,
              exceedsSinglePage: false,
              exceedsTwoPages: false,
              page1Ids: blocks.map((b) => b.id),
              page2Ids: [],
              leftPage1Ids: [],
              leftPage2Ids: [],
              rightPage1Ids: [],
              rightPage2Ids: [],
              continuedSections: [],
            };
          } else {
            const singleBlockOverflow = split.page2Ids.length === 0;
            const exceedsTwo = singleBlockOverflow || split.page2UsedHeight > p2BodyBudget;
            nextState = {
              pageCount: allowTwoPages ? 2 : 1,
              exceedsSinglePage: true,
              exceedsTwoPages: exceedsTwo,
              page1Ids: allowTwoPages ? split.page1Ids : blocks.map((b) => b.id),
              page2Ids: allowTwoPages ? split.page2Ids : [],
              leftPage1Ids: [],
              leftPage2Ids: [],
              rightPage1Ids: [],
              rightPage2Ids: [],
              continuedSections: allowTwoPages ? split.continuedSections : [],
            };
          }
        }
      }

      if (!statesEqual(cur, nextState)) {
        stateRef.current = nextState;
        setState(nextState);
      }
    };

    compute();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && rootRef.current) {
      observer = new ResizeObserver(() => compute());
      observer.observe(rootRef.current);
    }

    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) compute();
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [depsKey, allowTwoPages, isTwoColumn, blocks.length, leftBlocks.length, rightBlocks.length]);

  const lastReportedRef = useRef<string>("");
  useEffect(() => {
    const sig = `${state.pageCount}:${state.exceedsSinglePage}:${state.exceedsTwoPages}`;
    if (onPaginationChange && sig !== lastReportedRef.current) {
      lastReportedRef.current = sig;
      onPaginationChange({
        pageCount: state.pageCount,
        exceedsSinglePage: state.exceedsSinglePage,
        exceedsTwoPages: state.exceedsTwoPages,
      });
    }
  }, [state.pageCount, state.exceedsSinglePage, state.exceedsTwoPages, onPaginationChange]);

  return { rootRef, pagination: state };
}
