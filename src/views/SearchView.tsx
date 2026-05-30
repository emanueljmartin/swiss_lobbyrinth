import { useState, useEffect, useRef } from 'react';
import { Search, User, Building2, Users, Landmark, ArrowRight, Sparkles } from 'lucide-react';
import { searchEntities } from '../lib/queries';
import type { ViewType } from '../types';

interface SearchViewProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

const ENTITY_ICON: Record<string, React.ReactNode> = {
  POLITICIAN: <User size={14} />,
  COMPANY: <Building2 size={14} />,
  ASSOCIATION: <Users size={14} />,
  FOUNDATION: <Landmark size={14} />,
  COMMITTEE: <Users size={14} />,
};

const EXAMPLE_QUERIES = [
  'Show politicians connected to the banking sector.',
  'Which companies have board overlap with parliamentarians?',
  'Compare mandate networks across political parties.',
  'What industries are most represented in committees?',
];

export function SearchView({ onNavigate }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; type: string; subtitle: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchEntities(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleResultClick = (r: { id: string; type: string }) => {
    if (r.type === 'POLITICIAN') {
      onNavigate('profile', r.id);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      <div className="border-b border-slate-800 px-8 py-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-slate-400 text-sm mt-1">Find politicians, organizations, committees, and institutional connections.</p>
      </div>

      <div className="px-8 py-8 max-w-3xl">
        {/* Search box */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a politician, organization, committee…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="mb-6">
            {results.length === 0 && !loading ? (
              <div className="text-center py-8 text-slate-500">
                <Search size={32} className="mx-auto mb-2 text-slate-700" />
                <p>No results for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3.5 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:border-blue-500/40 transition-colors">
                      {ENTITY_ICON[r.type] ?? <Building2 size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 font-medium group-hover:text-white transition-colors">
                        {r.name}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{r.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-600 bg-slate-800 rounded-md px-2 py-0.5">{r.type}</span>
                      {r.type === 'POLITICIAN' && (
                        <ArrowRight size={14} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Example queries */}
        {!hasSearched && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
              <Sparkles size={13} />
              <span>Example research questions</span>
            </div>
            <div className="space-y-2">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q.split(' ').slice(1, 3).join(' '))}
                  className="w-full flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 transition-all group text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500 font-mono flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-200 transition-colors text-sm">{q}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Search Scope</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Politicians', icon: <User size={14} />, desc: 'National and cantonal legislators' },
                  { label: 'Companies', icon: <Building2 size={14} />, desc: 'Registered Swiss companies' },
                  { label: 'Associations', icon: <Users size={14} />, desc: 'Industry and trade bodies' },
                  { label: 'Committees', icon: <Landmark size={14} />, desc: 'Parliamentary commissions' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-400 mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-slate-300 text-xs font-medium">{item.label}</div>
                      <div className="text-slate-600 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
