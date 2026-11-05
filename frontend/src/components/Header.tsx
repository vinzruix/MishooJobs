import { Terminal, Search, SlidersHorizontal, User } from "lucide-react";

interface HeaderProps {
  activeTab: "search" | "pipeline";
  setActiveTab: (tab: "search" | "pipeline") => void;
  onOpenProfileManager: () => void;
  activeProfileName?: string;
}

export function Header({
  activeTab,
  setActiveTab,
  onOpenProfileManager,
  activeProfileName,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-pixel text-emerald-400 text-sm tracking-wider flex items-center gap-2">
            <Terminal className="w-5 h-5 inline text-emerald-400" />
            MISHOOJOBS
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
            v0.1.0 • MX Jr Live
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${
              activeTab === "search"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Búsqueda en Vivo
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${
              activeTab === "pipeline"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Mi Pipeline
          </button>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <button
            onClick={onOpenProfileManager}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            {activeProfileName ? activeProfileName : "Cargar CV"}
          </button>
        </div>
      </div>
    </header>
  );
}
