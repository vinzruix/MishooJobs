import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  MapPin,
  Laptop,
  Sparkles,
} from "lucide-react";
import type {
  FilterToolbarProps,
  SeniorityFilter,
  TimeframeId,
  SeniorityOption,
} from "../types/job";
import { MEXICAN_STATES, getMexicanStateOption } from "../services/mexican_states";

const SENIORITY_OPTIONS: SeniorityOption[] = [
  { id: "all", label: "Todos" },
  { id: "primer_empleo", label: "Primer Empleo Real", shortLabel: "Primer Empleo", isHighlight: true },
  { id: "pasantia", label: "Pasantías" },
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
];

const TIMEFRAME_OPTIONS: { id: TimeframeId; label: string; shortLabel: string }[] = [
  { id: "all", label: "Todas las fechas", shortLabel: "Cualquier fecha" },
  { id: "24h", label: "Hoy (24h)", shortLabel: "Hoy" },
  { id: "3d", label: "Últimos 3 días", shortLabel: "3 días" },
  { id: "7d", label: "Últimos 7 días", shortLabel: "7 días" },
  { id: "30d", label: "Últimos 30 días", shortLabel: "30 días" },
  { id: "30d_plus", label: "Más de 30 días", shortLabel: "+30 días" },
];

const MODALITY_OPTIONS: { id: string; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "remoto", label: "Remoto" },
  { id: "hibrido", label: "Híbrido" },
  { id: "presencial", label: "Presencial" },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  seniorityCounts,
  timeframeCounts,
  hideApplied,
  hiddenAppliedCount,
  totalResultsCount: _totalResultsCount,
  duplicatesMergedCount: _duplicatesMergedCount,
  onFilterChange,
  onToggleHideApplied,
  onResetFilters,
}) => {
  const [openPopover, setOpenPopover] = useState<"date" | "modality" | "location" | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const popoverRef = useRef<HTMLDivElement>(null);

  const togglePopover = (
    type: "date" | "modality" | "location",
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (openPopover === type) {
      setOpenPopover(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const popoverWidth = type === "date" ? 208 : type === "modality" ? 176 : 256;
      let left = rect.left;
      if (typeof window !== "undefined") {
        if (left + popoverWidth > window.innerWidth - 12) {
          left = Math.max(8, rect.right - popoverWidth);
        }
      }
      setPopoverCoords({
        top: rect.bottom + 6,
        left,
      });
      setOpenPopover(type);
    }
  };

  const handleDismiss = () => {
    setOpenPopover(null);
  };

  // Close popovers on click outside, scroll, resize, or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        popoverRef.current?.contains(target) ||
        target.closest("[data-popover-content]")
      ) {
        return;
      }
      setOpenPopover(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPopover(null);
      }
    };

    if (openPopover) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", handleDismiss, { passive: true });
      window.addEventListener("resize", handleDismiss, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleDismiss);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [openPopover]);

  const isNonDefault =
    filters.seniority !== "all" ||
    filters.modality !== "all" ||
    filters.location !== "México" ||
    !filters.timeframes.includes("all") ||
    hideApplied;

  const handleSeniorityClick = (tierId: SeniorityFilter) => {
    if (filters.seniority === tierId && tierId !== "all") {
      onFilterChange({ ...filters, seniority: "all" });
    } else {
      onFilterChange({ ...filters, seniority: tierId });
    }
  };

  const handleTimeframeSelect = (timeframeId: TimeframeId) => {
    onFilterChange({ ...filters, timeframes: [timeframeId] });
    setOpenPopover(null);
  };

  const handleModalitySelect = (modalityId: string) => {
    onFilterChange({ ...filters, modality: modalityId });
    setOpenPopover(null);
  };

  const handleLocationSelect = (locationCode: string) => {
    onFilterChange({ ...filters, location: locationCode });
    setOpenPopover(null);
  };

  const activeTimeframe =
    TIMEFRAME_OPTIONS.find((t) => filters.timeframes.includes(t.id)) || TIMEFRAME_OPTIONS[0];

  const activeModality =
    MODALITY_OPTIONS.find((m) => m.id === filters.modality) || MODALITY_OPTIONS[0];

  const activeLocation = getMexicanStateOption(filters.location);

  return (
    <div
      ref={popoverRef}
      className="relative w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md z-30 py-2 px-4 shadow-2xs"
    >
      <div
        onScroll={handleDismiss}
        className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar py-0.5 text-xs"
      >
        {/* Contiguous Seniority Segmented Control */}
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70 shrink-0">
          {SENIORITY_OPTIONS.map((opt) => {
            const isSelected = filters.seniority === opt.id;
            const count = seniorityCounts[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSeniorityClick(opt.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-medium transition-all active:scale-[0.98] ${
                  isSelected
                    ? opt.isHighlight
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-slate-900 text-white shadow-xs font-semibold"
                    : opt.isHighlight
                    ? "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                {opt.isHighlight && (
                  <Sparkles className={`w-3 h-3 ${isSelected ? "text-emerald-200" : "text-emerald-500"}`} />
                )}
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Date Dropdown Popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => togglePopover("date", e)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] ${
              !filters.timeframes.includes("all")
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span>{filters.timeframes.includes("all") ? "Fecha" : `Fecha: ${activeTimeframe.shortLabel}`}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
          </button>

          {openPopover === "date" &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                data-popover-content="true"
                style={{ top: popoverCoords.top, left: popoverCoords.left }}
                className="fixed w-52 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Fecha de publicación
                </div>
                <div className="space-y-0.5">
                  {TIMEFRAME_OPTIONS.map((timeframe) => {
                    const isSelected = filters.timeframes.includes(timeframe.id);
                    const count = timeframeCounts?.[timeframe.id];
                    return (
                      <button
                        key={timeframe.id}
                        type="button"
                        onClick={() => handleTimeframeSelect(timeframe.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span>{timeframe.label}</span>
                        {count !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Modality Dropdown Popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => togglePopover("modality", e)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] ${
              filters.modality !== "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Laptop className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span>{filters.modality === "all" ? "Modalidad" : `Modalidad: ${activeModality.label}`}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
          </button>

          {openPopover === "modality" &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                data-popover-content="true"
                style={{ top: popoverCoords.top, left: popoverCoords.left }}
                className="fixed w-44 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Modalidad
                </div>
                <div className="space-y-0.5">
                  {MODALITY_OPTIONS.map((m) => {
                    const isSelected = filters.modality === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModalitySelect(m.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Mexican States Dropdown Popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => togglePopover("location", e)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] ${
              filters.location !== "México"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span>{filters.location === "México" ? "Ubicación" : activeLocation.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
          </button>

          {openPopover === "location" &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                data-popover-content="true"
                style={{ top: popoverCoords.top, left: popoverCoords.left }}
                className="fixed w-64 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 sticky top-0 bg-white">
                  Ubicación / Estado
                </div>
                <div className="space-y-0.5">
                  {MEXICAN_STATES.map((st) => {
                    const isSelected = filters.location === st.code;
                    return (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => handleLocationSelect(st.code)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {st.fullName}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Hide Applied Toggle */}
        <button
          type="button"
          title={
            hideApplied
              ? "Mostrar vacantes con postulación enviada (Atajo: H)"
              : "Ocultar vacantes con postulación enviada (Atajo: H)"
          }
          aria-pressed={hideApplied}
          onClick={onToggleHideApplied}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] shrink-0 ${
            hideApplied && hiddenAppliedCount > 0
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {hideApplied && hiddenAppliedCount > 0 ? (
            <EyeOff className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span>
            {hideApplied && hiddenAppliedCount > 0
              ? `Ocultando postuladas (${hiddenAppliedCount})`
              : "Ocultar postuladas"}
          </span>
        </button>

        {/* Reset Button (Conditional) */}
        {isNonDefault && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-all active:scale-[0.98] shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Restablecer</span>
          </button>
        )}
      </div>
    </div>
  );
};
