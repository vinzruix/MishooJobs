import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, Download, Upload, Save, X, RefreshCw } from "lucide-react";
import {
  parseAndValidateYAML,
  loadMasterProfile,
  saveMasterProfile,
  exportMasterProfileYAML,
  STARTER_MASTER_PROFILE_YAML,
  type ValidationResult,
} from "../services/master_profile_service";
import { AvatarUploader } from "./AvatarUploader";

interface MasterProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved?: () => void;
}

export const MasterProfileEditor: React.FC<MasterProfileEditorProps> = ({
  isOpen,
  onClose,
  onProfileSaved,
}) => {
  const [yamlContent, setYamlContent] = useState<string>(() => STARTER_MASTER_PROFILE_YAML);
  const [validation, setValidation] = useState<ValidationResult>(() => parseAndValidateYAML(STARTER_MASTER_PROFILE_YAML));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Overwrite modal state
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function init() {
      try {
        const record = await loadMasterProfile();
        setYamlContent(record.raw_yaml);
        const val = parseAndValidateYAML(record.raw_yaml);
        setValidation(val);
      } catch (e) {
        console.error("Error al cargar perfil maestro:", e);
      }
    }

    init();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setYamlContent(newContent);
    const result = parseAndValidateYAML(newContent);
    setValidation(result);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!validation.valid || !validation.parsed) return;
    setIsSaving(true);
    try {
      await saveMasterProfile(yamlContent, validation.parsed);
      setSaveSuccess(true);
      if (onProfileSaved) {
        onProfileSaved();
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Error al guardar perfil maestro:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingUploadFile(file);
    setShowOverwriteConfirm(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmUpload = async () => {
    if (!pendingUploadFile) return;
    setShowOverwriteConfirm(false);
    setIsUploading(true);
    setUploadError(null);

    const file = pendingUploadFile;
    const filename = file.name.toLowerCase();

    try {
      if (filename.endsWith(".yml") || filename.endsWith(".yaml")) {
        const text = await file.text();
        setYamlContent(text);
        const val = parseAndValidateYAML(text);
        setValidation(val);
      } else {
        // Send to backend stateless parser (/cv/parse-resume)
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/cv/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Error del servidor (${response.status})`);
        }

        const data = await response.json();
        setYamlContent(data.yaml_content);
        const val = parseAndValidateYAML(data.yaml_content);
        setValidation(val);
      }
    } catch (err: any) {
      setUploadError(err.message || "Error al procesar el archivo");
    } finally {
      setIsUploading(false);
      setPendingUploadFile(null);
    }
  };

  const lineCount = yamlContent.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-zinc-100 tracking-wider">
              PERFIL MAESTRO
            </span>
            <span className="text-xs text-zinc-500">
              (Master Career Knowledge Base)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Syntax Status Badge */}
            {validation.valid ? (
              <span
                data-testid="syntax-valid-badge"
                className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                [ESTRUCTURA VÁLIDA]
              </span>
            ) : (
              <span
                data-testid="syntax-error-badge"
                className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded"
                title={validation.error?.message}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                [ERROR EN LÍNEA {validation.error?.line}: {validation.error?.message?.slice(0, 45)}...]
              </span>
            )}

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800 transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="px-6 py-2 bg-rose-950/80 border-b border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Main YAML Editor */}
          <div className="flex-1 flex flex-col min-h-0 border-r border-zinc-800">
            <div className="flex-1 flex min-h-0 relative bg-zinc-950">
              {/* Line number gutter */}
              <div
                aria-hidden="true"
                className="w-12 select-none py-3 pr-2 text-right text-xs text-zinc-600 bg-zinc-900/30 border-r border-zinc-800/80 font-mono overflow-hidden"
              >
                {lineNumbers.map((num) => (
                  <div
                    key={num}
                    className={`leading-relaxed ${
                      validation.error && validation.error.line === num
                        ? "text-rose-400 font-bold bg-rose-950/40"
                        : ""
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={yamlContent}
                onChange={handleTextChange}
                spellCheck={false}
                data-testid="master-profile-textarea"
                aria-label="Editor de Perfil Maestro en YAML"
                className="flex-1 p-3 bg-transparent text-xs text-zinc-200 leading-relaxed font-mono resize-none focus:outline-none overflow-y-auto selection:bg-zinc-800"
              />
            </div>
          </div>

          {/* Side Drawer: Photo & Actions */}
          <div className="w-full md:w-80 flex flex-col gap-4 p-4 bg-zinc-900/30 overflow-y-auto">
            <AvatarUploader />

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Ingesta de Currículum
              </span>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Sube tu CV en YAML, PDF o Markdown. Se estructurará automáticamente en formato canónico.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".yml,.yaml,.pdf,.md,.txt"
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Subir currículum"
              />

              <button
                type="button"
                data-testid="upload-resume-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Estructurando con IA...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir archivo (.yml, .pdf, .md)</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Exportar Respaldo
              </span>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Descarga tu Perfil Maestro en formato YAML limpio para resguardar o editar localmente.
              </p>

              <button
                type="button"
                data-testid="export-yaml-btn"
                onClick={() => exportMasterProfileYAML(yamlContent)}
                className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar YAML</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/80">
          <div className="text-[11px] text-zinc-500">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Guardado en almacenamiento local (IndexedDB)
              </span>
            ) : (
              <span>Los cambios solo se guardan cuando la estructura YAML es válida.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              data-testid="save-master-profile-btn"
              onClick={handleSave}
              disabled={!validation.valid || isSaving}
              className={`text-xs px-5 py-2 rounded flex items-center gap-2 font-semibold transition-colors ${
                validation.valid
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Guardando..." : "Guardar Perfil Maestro"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Destructive Overwrite Confirmation Modal */}
      {showOverwriteConfirm && (
        <div
          data-testid="overwrite-confirm-modal"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 font-mono"
        >
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                ¿Sobreescribir Perfil Maestro?
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              El archivo seleccionado (
              <span className="text-zinc-100 font-semibold">{pendingUploadFile?.name}</span>
              ) reemplazará el contenido actual en el editor.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOverwriteConfirm(false);
                  setPendingUploadFile(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="confirm-overwrite-btn"
                onClick={confirmUpload}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded transition-colors"
              >
                Sí, sobreescribir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
