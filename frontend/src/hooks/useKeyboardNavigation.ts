import { useEffect, useState } from "react";
import type { JobVacancy } from "../types/job";

export interface KeyboardNavigationProps {
  vacancies: JobVacancy[];
  selectedFingerprint?: string | null;
  isModalOpen?: boolean;
  onInspect?: (vacancy: JobVacancy) => void;
  onSelect?: (vacancy: JobVacancy) => void;
  onCloseModal?: () => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onToggleHideApplied?: () => void;
  onCycleTab?: () => void;
  onOpenPrimaryLink?: (vacancy: JobVacancy) => void;
}

export function useKeyboardNavigation({
  vacancies,
  selectedFingerprint,
  isModalOpen = false,
  onInspect,
  onSelect,
  onCloseModal,
  onSave,
  onMarkApplied,
  onToggleHideApplied,
  onCycleTab,
  onOpenPrimaryLink,
}: KeyboardNavigationProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Sync selectedIndex when selectedFingerprint is provided or changes
  useEffect(() => {
    if (selectedFingerprint && vacancies.length > 0) {
      const idx = vacancies.findIndex((v) => v.fingerprint === selectedFingerprint);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }, [selectedFingerprint, vacancies]);

  // Clamp selectedIndex when visible vacancies shrink in-flight
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (vacancies.length === 0 || prev < 0) return -1;
      return Math.max(0, Math.min(prev, vacancies.length - 1));
    });
  }, [vacancies.length]);

  useEffect(() => {
    const scrollCardIntoView = (index: number) => {
      if (index >= 0 && index < vacancies.length) {
        const fp = vacancies[index]?.fingerprint;
        if (fp) {
          const el = document.querySelector(`[data-vacancy-fingerprint="${fp}"]`);
          el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs or editable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        (target as any).contentEditable === "true" ||
        target.getAttribute?.("contenteditable") === "true"
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isModalOpen && onCloseModal) {
          e.preventDefault();
          onCloseModal();
        }
        return;
      }

      if (isModalOpen) return;

      // 'h' or 'H' shortcut toggles the hide-applied filter even if vacancies list is empty
      if (e.key === "h" || e.key === "H") {
        if (onToggleHideApplied) {
          e.preventDefault();
          onToggleHideApplied();
        }
        return;
      }

      // 'Space' shortcut cycles detail tabs
      if (e.key === " " || e.key === "Spacebar") {
        if (onCycleTab) {
          e.preventDefault();
          onCycleTab();
          return;
        }
      }

      if (vacancies.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev + 1 < vacancies.length ? prev + 1 : 0;
          const selected = vacancies[nextIndex];
          if (selected) {
            onSelect?.(selected);
            scrollCardIntoView(nextIndex);
          }
          return nextIndex;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev - 1 >= 0 ? prev - 1 : vacancies.length - 1;
          const selected = vacancies[nextIndex];
          if (selected) {
            onSelect?.(selected);
            scrollCardIntoView(nextIndex);
          }
          return nextIndex;
        });
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < vacancies.length) {
          e.preventDefault();
          const selected = vacancies[selectedIndex];
          if (onOpenPrimaryLink) {
            onOpenPrimaryLink(selected);
          } else if (onInspect) {
            onInspect(selected);
          }
        }
      } else if (e.key === "s") {
        if (selectedIndex >= 0 && selectedIndex < vacancies.length && onSave) {
          e.preventDefault();
          onSave(vacancies[selectedIndex]);
        }
      } else if (e.key === "a") {
        if (selectedIndex >= 0 && selectedIndex < vacancies.length && onMarkApplied) {
          e.preventDefault();
          onMarkApplied(vacancies[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    vacancies,
    selectedIndex,
    isModalOpen,
    onInspect,
    onSelect,
    onCloseModal,
    onSave,
    onMarkApplied,
    onToggleHideApplied,
    onCycleTab,
    onOpenPrimaryLink,
  ]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
