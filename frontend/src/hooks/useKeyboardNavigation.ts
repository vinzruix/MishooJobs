import { useEffect, useState } from "react";
import type { JobVacancy } from "../types/job";

interface KeyboardNavigationProps {
  vacancies: JobVacancy[];
  isModalOpen: boolean;
  onInspect: (vacancy: JobVacancy) => void;
  onCloseModal: () => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onToggleHideApplied?: () => void;
}

export function useKeyboardNavigation({
  vacancies,
  isModalOpen,
  onInspect,
  onCloseModal,
  onSave,
  onMarkApplied,
  onToggleHideApplied,
}: KeyboardNavigationProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Clamp selectedIndex when visible vacancies shrink in-flight
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (vacancies.length === 0 || prev < 0) return -1;
      return Math.max(0, Math.min(prev, vacancies.length - 1));
    });
  }, [vacancies.length]);

  useEffect(() => {
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
        if (isModalOpen) {
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

      if (vacancies.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < vacancies.length ? prev + 1 : 0));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : vacancies.length - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        if (selectedIndex >= 0 && selectedIndex < vacancies.length) {
          e.preventDefault();
          onInspect(vacancies[selectedIndex]);
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
  }, [vacancies, selectedIndex, isModalOpen, onInspect, onCloseModal, onSave, onMarkApplied, onToggleHideApplied]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
