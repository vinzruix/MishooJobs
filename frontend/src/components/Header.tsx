import { Search, SlidersHorizontal, User, FileText } from "lucide-react";
import mishooLogo from "../assets/mishoojobs-logo.png";

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
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-40 px-3 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <button
          type="button"
          data-testid="brand-home-btn"
          aria-label="MishooJobs - Ir a Vacantes"
          onClick={() => setActiveTab("search")}
          className="flex items-center gap-2.5 shrink-0 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-xl cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={mishooLogo}
              alt="Logo de MishooJobs"
              className="w-full h-full object-contain"
            />
          </span>
          <span className="font-bold text-slate-900 text-base tracking-tight whitespace-nowrap">
            MishooJobs
          </span>
        </button>

        <nav
          aria-label="Navegación principal"
          className="flex items-center space-x-1 sm:space-x-2 min-w-0 overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "search"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Vacantes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "pipeline"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>Postulaciones</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resumes")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "resumes"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>CVs</span>
            {resumesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
                {resumesCount}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />
          <button
            type="button"
            data-testid="open-master-profile-btn"
            onClick={onOpenMasterProfile}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            title="Abrir editor de Perfil Maestro"
          >
            <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Perfil</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
