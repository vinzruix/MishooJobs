import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  isSearching: boolean;
  initialQuery?: string;
  initialLocation?: string;
}

export function SearchBar({
  onSearch,
  isSearching,
  initialQuery = "Python Junior",
  initialLocation = "México",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
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
    onSearch(query.trim(), location.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 focus-within:border-emerald-500/60 transition-colors shadow-lg">
        {/* Keywords Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rol o tecnología (ej. Python Junior, Becario React, SQL)..."
            className="w-full bg-transparent pl-9 pr-12 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-mono">
              /
            </kbd>
          </div>
        </div>

        {/* Location Input */}
        <div className="relative sm:w-56 flex items-center border-t sm:border-t-0 sm:border-l border-zinc-800 pt-1 sm:pt-0">
          <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Estado o ciudad (ej. GDL, CDMX, Remoto)..."
            className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
