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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Gestor de Perfiles & CV (Local)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Privacy Notice */}
          <div className="p-3 rounded-lg border border-emerald-900/50 bg-emerald-950/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Privacidad Absoluta:</strong> Tu currículum y habilidades se almacenan exclusivamente en la base de datos local de tu navegador (IndexedDB). Ningún servidor de MishooJobs guarda tu información personal ni tu CV.
            </span>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-6 text-center transition-colors">
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
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-zinc-500 hover:text-emerald-400 transition-colors" />
              )}
              <span className="text-xs font-semibold text-zinc-200">
                {isUploading ? "Extrayendo habilidades..." : "Haz clic para subir tu CV (PDF o Markdown)"}
              </span>
              <span className="text-[10px] text-zinc-500">
                Formatos soportados: .pdf, .md, .txt
              </span>
            </label>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Saved Profiles List */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Perfiles Almacenados ({profiles.length})
            </h3>

            {profiles.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No tienes perfiles guardados aún. Sube un archivo arriba.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProfile(p.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-zinc-800/80 border-emerald-500/80 shadow-xs"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs font-bold text-zinc-200 truncate">{p.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                              Activo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mb-1.5">
                          Rol: <span className="text-zinc-300">{p.target_role}</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800"
                            >
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 5 && (
                            <span className="text-[10px] text-zinc-500">+{p.skills.length - 5}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProfile(p.id);
                            }}
                            className="px-2 py-1 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          >
                            Seleccionar
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProfile(p.id);
                          }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
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
        <div className="p-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
