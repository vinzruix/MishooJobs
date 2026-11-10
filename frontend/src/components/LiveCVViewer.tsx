import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Copy,
  ArrowLeft,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  GitPullRequest,
} from "lucide-react";
import type { GeneratedResumeRecord, TemplateId, GeneratedCVContent } from "../types/resume";
import { TechnicalHighDensity } from "./templates/TechnicalHighDensity";
import { ClassicATS } from "./templates/ClassicATS";
import { ModernExecutive } from "./templates/ModernExecutive";
import { exportToPlainATS, exportToMarkdown } from "../services/ats_exporter";
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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState<boolean>(false);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load resume from Dexie
  useEffect(() => {
    async function load() {
      const record = await db.resumes.get(resumeId);
      if (record) {
        setResume(record);
      }
    }
    load();
  }, [resumeId]);

  // Page overflow detection (Letter size: ~1056px at 96 DPI)
  useEffect(() => {
    if (!containerRef.current) return;
    const checkOverflow = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        // ~1056px is standard Letter page height at 96 DPI, with 1080px threshold buffer
        setIsOverflowing(height > 1080);
      }
    };

    checkOverflow();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(checkOverflow);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [resume?.content, resume?.template_id, resume?.photo_enabled]);

  if (!resume) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-zinc-500 text-xs">
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
        ? exportToPlainATS(resume.content)
        : exportToMarkdown(resume.content);

    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(format === "plain" ? "Texto ATS copiado" : "Markdown copiado");
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (e) {
      console.error("Error al copiar al portapapeles:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col font-mono min-h-screen bg-zinc-950 text-zinc-100">
      {/* Print CSS styling */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, nav, .no-print {
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
          }
        }
      `}</style>

      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="live-viewer-back-btn"
            onClick={onBack}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-100 truncate max-w-xs sm:max-w-md">
              {resume.title}
            </span>
            <span className="text-[10px] text-zinc-500">
              {resume.type === "vacancy" ? "[CV ADAPTADO]" : "[CV POR ROL]"} • Rev {resume.revision}
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 text-xs">
            <button
              type="button"
              data-testid="template-technical-btn"
              onClick={() => handleTemplateChange("technical_high_density")}
              className={`px-2.5 py-1 rounded transition-colors ${
                resume.template_id === "technical_high_density"
                  ? "bg-zinc-800 text-emerald-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Alta Densidad (2 col)
            </button>
            <button
              type="button"
              data-testid="template-classic-btn"
              onClick={() => handleTemplateChange("classic_ats")}
              className={`px-2.5 py-1 rounded transition-colors ${
                resume.template_id === "classic_ats"
                  ? "bg-zinc-800 text-emerald-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Clásico ATS
            </button>
            <button
              type="button"
              data-testid="template-modern-btn"
              onClick={() => handleTemplateChange("modern_executive")}
              className={`px-2.5 py-1 rounded transition-colors ${
                resume.template_id === "modern_executive"
                  ? "bg-zinc-800 text-emerald-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
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
            className={`px-2.5 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              resume.photo_enabled
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
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
            className="px-2.5 py-1.5 text-xs rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-zinc-700 transition-colors flex items-center gap-1.5"
            title="Guardar mejoras y viñetas editadas en el Perfil Maestro"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Guardar en Perfil Maestro</span>
          </button>

          {/* Split Action Copy Button */}
          <div className="relative inline-flex rounded shadow-sm">
            <button
              type="button"
              data-testid="copy-ats-primary-btn"
              onClick={() => copyToClipboard("plain")}
              className="px-3 py-1.5 text-xs font-semibold rounded-l bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copyFeedback || "Copiar Texto ATS"}</span>
            </button>
            <button
              type="button"
              data-testid="copy-dropdown-trigger"
              onClick={() => setShowCopyDropdown(!showCopyDropdown)}
              className="px-2 py-1.5 text-xs rounded-r bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-t border-r border-b border-zinc-700 transition-colors"
              title="Más formatos de copia"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showCopyDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded shadow-xl py-1 z-50">
                <button
                  type="button"
                  data-testid="copy-markdown-btn"
                  onClick={() => copyToClipboard("markdown")}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span>Copiar Markdown (GFM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard("plain")}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
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
            className="px-3.5 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Overflow Warning Bar */}
      {isOverflowing && (
        <div
          data-testid="overflow-warning-badge"
          className="no-print bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>[PÁGINA EXCEDIDA: El contenido excede 1 página impresa. Edita viñetas o cambia plantilla para ajustar.]</span>
        </div>
      )}

      {/* Live Canvas Area */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center bg-zinc-950 print:bg-white print:p-0">
        <div ref={containerRef} className="print-canvas">
          {resume.template_id === "technical_high_density" && (
            <TechnicalHighDensity
              content={resume.content}
              photoUrl={photoUrl}
              photoEnabled={resume.photo_enabled}
              onFieldChange={handleFieldChange}
              isEditable={true}
            />
          )}

          {resume.template_id === "classic_ats" && (
            <ClassicATS
              content={resume.content}
              photoUrl={photoUrl}
              photoEnabled={resume.photo_enabled}
              onFieldChange={handleFieldChange}
              isEditable={true}
            />
          )}

          {resume.template_id === "modern_executive" && (
            <ModernExecutive
              content={resume.content}
              photoUrl={photoUrl}
              photoEnabled={resume.photo_enabled}
              onFieldChange={handleFieldChange}
              isEditable={true}
            />
          )}
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
