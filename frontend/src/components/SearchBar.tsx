import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  initialQuery?: string;
}

export function SearchBar({
  onSearch,
  isSearching,
  initialQuery = "Python Junior",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on '/' if not inside an input/textarea
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-2 focus-within:border-slate-400 transition-colors shadow-xs">
        {/* Keywords Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rol o tecnología (ej. Python Junior, Becario React, SQL)..."
            className="w-full bg-transparent pl-9 pr-12 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded-md font-mono">
              /
            </kbd>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-[0.98] shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando</span>
            </>
          ) : (
            <span>Buscar en Vivo</span>
          )}
        </button>
      </div>
    </form>
  );
}
