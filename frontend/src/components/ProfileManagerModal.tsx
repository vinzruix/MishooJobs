import { useState, type ChangeEvent } from "react";
import { Upload, Trash2, CheckCircle2, Shield, User, FileText, Loader2 } from "lucide-react";
import type { CandidateProfile } from "../types/profile";
import { parseResumeFile } from "../services/resume_parser";

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: CandidateProfile[];
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onAddProfile: (profile: CandidateProfile) => Promise<void>;
  onRemoveProfile: (id: string) => Promise<void>;
}

export function ProfileManagerModal({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onRemoveProfile,
}: ProfileManagerModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const parsed = await parseResumeFile(file);
      await onAddProfile(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Gestor de Perfiles & CV (Local)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Privacy Notice */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Privacidad Absoluta:</strong> Tu currículum y habilidades se almacenan exclusivamente en la base de datos local de tu navegador (IndexedDB). Ningún servidor de MishooJobs guarda tu información personal ni tu CV.
            </span>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.md,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400 hover:text-slate-700 transition-colors" />
              )}
              <span className="text-xs font-semibold text-slate-800">
                {isUploading ? "Extrayendo habilidades..." : "Haz clic para subir tu CV (PDF o Markdown)"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Formatos soportados: .pdf, .md, .txt
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Saved Profiles List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Perfiles Almacenados ({profiles.length})
            </h3>

            {profiles.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No tienes perfiles guardados aún. Sube un archivo arriba.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProfile(p.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              Activo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mb-1.5">
                          Rol: <span className="text-slate-900 font-medium">{p.target_role}</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 5 && (
                            <span className="text-[10px] text-slate-500 font-medium">+{p.skills.length - 5}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProfile(p.id);
                            }}
                            className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                          >
                            Seleccionar
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProfile(p.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar perfil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 flex justify-end bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
