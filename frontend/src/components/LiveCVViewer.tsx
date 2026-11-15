import React, { useState, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import {
  Printer,
  Copy,
  ArrowLeft,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  GitPullRequest,
  FileStack,
} from "lucide-react";
import type { GeneratedResumeRecord, TemplateId, GeneratedCVContent } from "../types/resume";
import type { MasterProfileData } from "../types/master_profile";
import type { CVPaginationInfo } from "../services/cv_pagination";
import { TechnicalHighDensity } from "./templates/TechnicalHighDensity";
import { ClassicATS } from "./templates/ClassicATS";
import { ModernExecutive } from "./templates/ModernExecutive";
import { exportToPlainATS, exportToMarkdown } from "../services/ats_exporter";
import { hydrateCertificateUrls } from "../services/cv_links";
import { SyncImprovementsModal } from "./SyncImprovementsModal";
import { db } from "../db";

interface LiveCVViewerProps {
  resumeId: string;
  onBack: () => void;
  photoUrl?: string | null;
}

export const LiveCVViewer: React.FC<LiveCVViewerProps> = ({
  resumeId,
  onBack,
  photoUrl,
}) => {
  const [resume, setResume] = useState<GeneratedResumeRecord | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfileData | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState<boolean>(false);
  const [allowTwoPages, setAllowTwoPages] = useState<boolean>(true);
  const [paginationInfo, setPaginationInfo] = useState<CVPaginationInfo>({
    pageCount: 1,
    exceedsSinglePage: false,
    exceedsTwoPages: false,
  });
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    const onBeforePrint = () => setIsPrinting(true);
    const onAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const handlePaginationChange = useCallback((info: CVPaginationInfo) => {
    setPaginationInfo(info);
  }, []);

  // Load resume and read-only Master Profile snapshot from Dexie (hydrates missing cert URLs on older CVs)
  useEffect(() => {
    let isMounted = true;
    async function load() {
      const [record, masterRec] = await Promise.all([
        db.resumes.get(resumeId),
        db.master_profile.get("current"),
      ]);
      if (!isMounted) return;
      setMasterProfile(masterRec?.parsed ?? null);
      if (record) {
        setResume(record);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  const hydratedContent = useMemo(() => {
    if (!resume) return null;
    return hydrateCertificateUrls(resume.content, masterProfile);
  }, [resume, masterProfile]);

  if (!resume || !hydratedContent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-sans text-slate-500 text-xs">
        Cargando currículum...
      </div>
    );
  }

  const handleTemplateChange = async (templateId: TemplateId) => {
    const updated: GeneratedResumeRecord = {
      ...resume,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    };
    setResume(updated);
    await db.resumes.put(updated);
  };

  const handlePhotoToggle = async () => {
    const updated: GeneratedResumeRecord = {
      ...resume,
      photo_enabled: !resume.photo_enabled,
      updated_at: new Date().toISOString(),
    };
    setResume(updated);
    await db.resumes.put(updated);
  };

  const handleFieldChange = async (path: string[], value: string) => {
    const updatedContent: GeneratedCVContent = JSON.parse(JSON.stringify(resume.content));

    let curr: any = updatedContent;
    for (let i = 0; i < path.length - 1; i++) {
      curr = curr[path[i]];
    }
    curr[path[path.length - 1]] = value;

    const updatedRecord: GeneratedResumeRecord = {
      ...resume,
      content: updatedContent,
      updated_at: new Date().toISOString(),
    };

    setResume(updatedRecord);
    await db.resumes.put(updatedRecord);
  };

  const copyToClipboard = async (format: "plain" | "markdown") => {
    setShowCopyDropdown(false);
    const text =
      format === "plain"
        ? exportToPlainATS(hydratedContent)
        : exportToMarkdown(hydratedContent);

    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(format === "plain" ? "Texto ATS copiado" : "Markdown copiado");
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (e) {
      console.error("Error al copiar al portapapeles:", e);
    }
  };

  const handlePrint = () => {
    flushSync(() => {
      setIsPrinting(true);
    });
    try {
      window.print();
    } catch (err) {
      setIsPrinting(false);
      throw err;
    }
  };

  return (
    <div className="flex flex-col font-sans min-h-screen bg-[#F8F9FA] text-slate-900 print:min-h-0 print:block print:bg-white">
      {/* Screen WYSIWYG & Print-safe TrueType font / vector PDF CSS styling */}
      <style>{`
        .cv-page.font-sans,
        .cv-page .font-sans {
          font-family: Helvetica, Arial, sans-serif;
        }
        .cv-page.font-serif,
        .cv-page .font-serif {
          font-family: Georgia, "Times New Roman", Times, serif;
        }
        .cv-page.font-mono,
        .cv-page .font-mono {
          font-family: "Courier New", Courier, monospace;
        }
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-user-select: text !important;
            user-select: text !important;
          }
          header, nav, footer, .no-print {
            display: none !important;
          }
          @page {
            size: letter;
            margin: 0.4in;
          }
          .print-canvas {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cv-page.font-sans,
          .cv-page .font-sans {
            font-family: Helvetica, Arial, sans-serif !important;
          }
          .cv-page.font-serif,
          .cv-page .font-serif {
            font-family: Georgia, "Times New Roman", Times, serif !important;
          }
          .cv-page.font-mono,
          .cv-page .font-mono {
            font-family: "Courier New", Courier, monospace !important;
          }
          .cv-page,
          .cv-page * {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            transform: none !important;
            -webkit-user-select: text !important;
            user-select: text !important;
          }
          .cv-page-break {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>

      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="live-viewer-back-btn"
            onClick={onBack}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {resume.title}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {resume.type === "vacancy" ? "[CV ADAPTADO]" : "[CV POR ROL]"} • Rev {resume.revision}
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              data-testid="template-technical-btn"
              onClick={() => handleTemplateChange("technical_high_density")}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                resume.template_id === "technical_high_density"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alta Densidad (2 col)
            </button>
            <button
              type="button"
              data-testid="template-classic-btn"
              onClick={() => handleTemplateChange("classic_ats")}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                resume.template_id === "classic_ats"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Clásico ATS
            </button>
            <button
              type="button"
              data-testid="template-modern-btn"
              onClick={() => handleTemplateChange("modern_executive")}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                resume.template_id === "modern_executive"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ejecutivo
            </button>
          </div>

          {/* Photo Toggle */}
          <button
            type="button"
            data-testid="photo-toggle-btn"
            onClick={handlePhotoToggle}
            className={`px-2.5 py-1.5 text-xs rounded-xl border transition-colors flex items-center gap-1.5 font-medium ${
              resume.photo_enabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Alternar visibilidad de fotografía en el CV"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto: {resume.photo_enabled ? "ON" : "OFF"}</span>
          </button>

          {/* Sync improvements back to Master Profile */}
          <button
            type="button"
            data-testid="sync-improvements-btn"
            onClick={() => setShowSyncModal(true)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5 font-medium shadow-xs"
            title="Guardar mejoras y viñetas editadas en el Perfil Maestro"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Guardar en Perfil Maestro</span>
          </button>

          {/* Split Action Copy Button */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              type="button"
              data-testid="copy-ats-primary-btn"
              onClick={() => copyToClipboard("plain")}
              className="px-3 py-1.5 text-xs font-semibold rounded-l-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>{copyFeedback || "Copiar Texto ATS"}</span>
            </button>
            <button
              type="button"
              data-testid="copy-dropdown-trigger"
              onClick={() => setShowCopyDropdown(!showCopyDropdown)}
              className="px-2 py-1.5 text-xs rounded-r-xl bg-white hover:bg-slate-50 text-slate-600 border-t border-r border-b border-slate-200 transition-colors"
              title="Más formatos de copia"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showCopyDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                <button
                  type="button"
                  data-testid="copy-markdown-btn"
                  onClick={() => copyToClipboard("markdown")}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-center justify-between font-medium"
                >
                  <span>Copiar Markdown (GFM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard("plain")}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-center justify-between font-medium"
                >
                  <span>Copiar Plano ATS</span>
                </button>
              </div>
            )}
          </div>

          {/* Print PDF Button */}
          <button
            type="button"
            data-testid="print-pdf-btn"
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Multi-Page Mode / Overflow Status Bar */}
      {paginationInfo.exceedsSinglePage && allowTwoPages && !paginationInfo.exceedsTwoPages && (
        <div
          data-testid="two-page-info-badge"
          className="no-print bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-center text-xs text-emerald-800 font-semibold flex flex-wrap items-center justify-center gap-3"
        >
          <span className="flex items-center gap-1.5">
            <FileStack className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              [MODO 2 PÁGINAS: Encabezado incluido en ambas páginas para descargar sin cortes.]
            </span>
          </span>
          <button
            type="button"
            data-testid="toggle-single-page-btn"
            onClick={() => setAllowTwoPages(false)}
            className="px-2.5 py-0.5 rounded-lg bg-white border border-emerald-200 text-[11px] text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs font-medium"
          >
            Vista 1 página
          </button>
        </div>
      )}

      {(paginationInfo.exceedsTwoPages || (paginationInfo.exceedsSinglePage && !allowTwoPages)) && (
        <div
          data-testid="overflow-warning-badge"
          className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 font-semibold flex flex-wrap items-center justify-center gap-3"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {paginationInfo.exceedsTwoPages
                ? "[PÁGINAS EXCEDIDAS: El contenido supera las 2 páginas impresas. Edita o resume viñetas para ajustar.]"
                : "[PÁGINA EXCEDIDA: El contenido excede 1 página impresa. Edita viñetas o activa el modo 2 páginas.]"}
            </span>
          </span>
          {!allowTwoPages && (
            <button
              type="button"
              data-testid="enable-two-pages-btn"
              onClick={() => setAllowTwoPages(true)}
              className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-200 text-[11px] text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs font-medium"
            >
              Activar 2 páginas (encabezado en ambas)
            </button>
          )}
        </div>
      )}

      {/* Live Canvas Area */}
      <div className="flex-1 p-4 sm:p-8 overflow-x-auto overflow-y-auto flex justify-center bg-slate-200/70 print:bg-white print:p-0 print:block print:overflow-visible">
        <div className="print-canvas">
          {(() => {
            const templateProps = {
              content: hydratedContent,
              photoUrl,
              photoEnabled: resume.photo_enabled,
              onFieldChange: handleFieldChange,
              isEditable: !isPrinting,
              allowTwoPages,
              onPaginationChange: handlePaginationChange,
            };
            if (resume.template_id === "technical_high_density") {
              return <TechnicalHighDensity {...templateProps} />;
            }
            if (resume.template_id === "classic_ats") {
              return <ClassicATS {...templateProps} />;
            }
            return <ModernExecutive {...templateProps} />;
          })()}
        </div>
      </div>

      {/* Sync Improvements Modal */}
      {showSyncModal && (
        <SyncImprovementsModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          resume={resume}
        />
      )}
    </div>
  );
};
