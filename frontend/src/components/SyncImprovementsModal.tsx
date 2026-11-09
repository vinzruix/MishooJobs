import React, { useState, useEffect } from "react";
import { X, Save, CheckCircle2 } from "lucide-react";
import YAML from "yaml";
import type { GeneratedResumeRecord } from "../types/resume";
import { loadMasterProfile, saveMasterProfile } from "../services/master_profile_service";
import type { MasterProfileData } from "../types/master_profile";

interface SyncDifference {
  id: string;
  section: string;
  label: string;
  originalText: string;
  improvedText: string;
  selected: boolean;
}

interface SyncImprovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: GeneratedResumeRecord;
  onSynced?: () => void;
}

export const SyncImprovementsModal: React.FC<SyncImprovementsModalProps> = ({
  isOpen,
  onClose,
  resume,
  onSynced,
}) => {
  const [diffs, setDiffs] = useState<SyncDifference[]>([]);
  const [masterProfile, setMasterProfile] = useState<MasterProfileData | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      const rec = await loadMasterProfile();
      if (!rec || !rec.parsed) return;
      setMasterProfile(rec.parsed);

      const computedDiffs: SyncDifference[] = [];

      // 1. Compare about_me
      if (
        resume.content.header.about_me &&
        resume.content.header.about_me.trim() !== (rec.parsed.about_me || "").trim()
      ) {
        computedDiffs.push({
          id: "about_me",
          section: "Resumen Profesional",
          label: "Resumen (About Me)",
          originalText: rec.parsed.about_me || "",
          improvedText: resume.content.header.about_me.trim(),
          selected: true,
        });
      }

      // 2. Compare experience highlights
      (resume.content.experience || []).forEach((exp, expIdx) => {
        const masterExp = rec.parsed.experience?.[expIdx];
        if (masterExp) {
          (exp.highlights || []).forEach((hl, hlIdx) => {
            const masterHl = masterExp.highlights?.[hlIdx];
            if (masterHl && hl.trim() !== masterHl.trim()) {
              computedDiffs.push({
                id: `exp_${expIdx}_${hlIdx}`,
                section: `Experiencia: ${exp.company}`,
                label: `Viñeta #${hlIdx + 1}`,
                originalText: masterHl,
                improvedText: hl.trim(),
                selected: true,
              });
            }
          });
        }
      });

      // 3. Compare project highlights
      (resume.content.projects || []).forEach((proj, projIdx) => {
        const masterProj = rec.parsed.projects?.[projIdx];
        if (masterProj) {
          (proj.highlights || []).forEach((hl, hlIdx) => {
            const masterHl = masterProj.highlights?.[hlIdx];
            if (masterHl && hl.trim() !== masterHl.trim()) {
              computedDiffs.push({
                id: `proj_${projIdx}_${hlIdx}`,
                section: `Proyecto: ${proj.name}`,
                label: `Logro #${hlIdx + 1}`,
                originalText: masterHl,
                improvedText: hl.trim(),
                selected: true,
              });
            }
          });
        }
      });

      setDiffs(computedDiffs);
    }

    load();
  }, [isOpen, resume]);

  if (!isOpen) return null;

  const toggleDiff = (id: string) => {
    setDiffs(
      diffs.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleApplySync = async () => {
    if (!masterProfile) return;
    setIsSyncing(true);

    try {
      const updatedProfile: MasterProfileData = JSON.parse(JSON.stringify(masterProfile));

      for (const diff of diffs) {
        if (!diff.selected) continue;

        if (diff.id === "about_me") {
          updatedProfile.about_me = diff.improvedText;
        } else if (diff.id.startsWith("exp_")) {
          const [, expIdxStr, hlIdxStr] = diff.id.split("_");
          const eIdx = parseInt(expIdxStr, 10);
          const hIdx = parseInt(hlIdxStr, 10);
          if (updatedProfile.experience?.[eIdx]?.highlights?.[hIdx] !== undefined) {
            updatedProfile.experience[eIdx].highlights[hIdx] = diff.improvedText;
          }
        } else if (diff.id.startsWith("proj_")) {
          const [, projIdxStr, hlIdxStr] = diff.id.split("_");
          const pIdx = parseInt(projIdxStr, 10);
          const hIdx = parseInt(hlIdxStr, 10);
          if (updatedProfile.projects?.[pIdx]?.highlights?.[hIdx] !== undefined) {
            updatedProfile.projects[pIdx].highlights[hIdx] = diff.improvedText;
          }
        }
      }

      const newYaml = YAML.stringify(updatedProfile);
      await saveMasterProfile(newYaml, updatedProfile);

      setSyncSuccess(true);
      if (onSynced) onSynced();
      setTimeout(() => {
        setSyncSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Error al sincronizar mejoras en Perfil Maestro:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedCount = diffs.filter((d) => d.selected).length;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Guardar Mejoras en Perfil Maestro
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Selecciona qué viñetas y textos editados deseas incorporar a tu Perfil Maestro canónico.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          {diffs.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No se detectaron diferencias entre el CV actual y el Perfil Maestro.
            </div>
          ) : (
            diffs.map((diff) => (
              <div
                key={diff.id}
                onClick={() => toggleDiff(diff.id)}
                className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-colors flex flex-col gap-2 ${
                  diff.selected
                    ? "bg-zinc-900 border-emerald-800/80"
                    : "bg-zinc-950/60 border-zinc-800/80 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={diff.selected}
                      onChange={() => {}} // handled by parent onClick
                      className="rounded accent-emerald-500"
                    />
                    <span className="font-semibold text-zinc-300">
                      {diff.section} • {diff.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-zinc-400 line-through decoration-rose-500/80">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-0.5">
                      Original en Perfil Maestro
                    </span>
                    {diff.originalText}
                  </div>
                  <div className="p-2 bg-emerald-950/30 rounded border border-emerald-800/60 text-emerald-300">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Nueva redacción mejorada
                    </span>
                    {diff.improvedText}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <div className="text-xs text-zinc-400">
            {syncSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                ¡Mejoras guardadas en tu Perfil Maestro!
              </span>
            ) : (
              <span>{selectedCount} cambios seleccionados</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isSyncing}
              onClick={handleApplySync}
              className={`text-xs px-5 py-2.5 rounded font-semibold flex items-center gap-2 transition-colors ${
                selectedCount > 0 && !isSyncing
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSyncing ? "Guardando..." : "Guardar en Perfil Maestro"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
