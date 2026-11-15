import React from "react";

interface CVPageSheetProps {
  pageNumber: 1 | 2;
  totalPages: 1 | 2;
  fontClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Calibrated US Letter page wrapper (8.5in wide with 0.4in screen margins matching @page print margins).
 * Ensures WYSIWYG line-wrapping between screen preview and printed PDF.
 */
export const CVPageSheet: React.FC<CVPageSheetProps> = ({
  pageNumber,
  totalPages,
  fontClassName = "font-sans",
  className = "",
  children,
}) => {
  return (
    <>
      {pageNumber === 2 && (
        <div
          data-testid="page-2-divider"
          className="no-print flex items-center justify-center gap-3 my-4 text-[11px] text-slate-500 font-sans font-medium"
        >
          <span className="h-px flex-1 bg-slate-300 max-w-[140px]" />
          <span>Página 2 de {totalPages} • Encabezado repetido</span>
          <span className="h-px flex-1 bg-slate-300 max-w-[140px]" />
        </div>
      )}
      <div
        data-cv-page={pageNumber}
        className={`cv-page bg-white text-zinc-900 ${fontClassName} w-[8.5in] max-w-full min-h-[11in] p-[0.4in] mx-auto shadow-md select-text print:w-full print:max-w-full print:min-h-0 print:p-0 print:shadow-none ${
          pageNumber === 1 && totalPages > 1 ? "cv-page-break" : ""
        } ${className}`}
      >
        {children}
      </div>
    </>
  );
};
