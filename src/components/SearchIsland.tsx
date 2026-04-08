import { useState, useEffect, useRef, useCallback } from "react";

interface SearchEntry {
  /** slug */ s: string;
  /** title */ t: string;
  /** app_name */ a: string;
  /** app_url */ u: string;
  /** device_type */ d: string;
  /** platform */ p: string;
  /** tags */ g: string;
  /** ocr_text */ o: string;
  /** image_url */ i: string;
}

export default function SearchIsland() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the search index on first meaningful input
  useEffect(() => {
    if (query.length < 2 || index) return;
    setLoading(true);
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setIndex(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, index]);

  // Filter results when query or index changes
  useEffect(() => {
    if (!index || query.length < 2) {
      setResults([]);
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const matched = index.filter((entry) => {
      const haystack = `${entry.t} ${entry.a} ${entry.u} ${entry.d} ${entry.p} ${entry.g} ${entry.o}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });

    setResults(matched.slice(0, 15));
  }, [query, index]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onBlur={handleBlur}
        aria-label="Search empty states"
        className="input input-sm input-bordered w-full font-mono text-xs"
      />

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {loading && (
            <div className="p-3 text-center text-xs text-base-content/50 font-mono">
              Loading index...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-3 text-center text-xs text-base-content/50 font-mono">
              No results
            </div>
          )}

          {results.map((r) => (
            <a
              key={r.s}
              href={`/s/${r.s}/`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors"
            >
              {r.i && (
                <img
                  src={r.i}
                  alt=""
                  className="w-10 h-8 object-cover rounded shrink-0 bg-base-200"
                  loading="lazy"
                />
              )}
              <div className="min-w-0">
                <div className="text-sm truncate">{r.t}</div>
                {r.a && (
                  <div className="text-xs text-base-content/50 font-mono truncate">
                    {r.a}
                  </div>
                )}
              </div>
              <span className="badge badge-xs badge-ghost font-mono ml-auto shrink-0">
                {r.d}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
