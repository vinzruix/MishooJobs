import { Search, SlidersHorizontal, User, FileText, Briefcase } from "lucide-react";

interface HeaderProps {
  activeTab: "search" | "pipeline" | "resumes";
  setActiveTab: (tab: "search" | "pipeline" | "resumes") => void;
  onOpenMasterProfile: () => void;
  resumesCount?: number;
}

export function Header({
  activeTab,
  setActiveTab,
  onOpenMasterProfile,
  resumesCount = 0,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">
              MishooJobs
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-600 font-medium">
            v0.1.0 • MX Jr Live
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "search"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Búsqueda en Vivo</span>
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "pipeline"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mi Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab("resumes")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "resumes"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mis CVs</span>
            {resumesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
                {resumesCount}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            data-testid="open-master-profile-btn"
            onClick={onOpenMasterProfile}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Abrir editor de Perfil Maestro (Master Career Knowledge Base)"
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Perfil Maestro</span>
          </button>
        </div>
      </div>
    </header>
  );
}
