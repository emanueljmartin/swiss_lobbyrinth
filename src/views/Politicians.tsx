import { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronRight } from 'lucide-react';
import { fetchPoliticians, fetchAllMandates, fetchAllCommittees, fetchCommitteeMembershipsWithPolitician } from '../lib/queries';
import type { Politician, Mandate, Chamber, PartyAffiliation } from '../types';
import { PartyBadge, SectorBadge } from '../components/Badge';
import type { ViewType } from '../types';

interface PoliticiansProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

type SortField = 'name' | 'party' | 'canton' | 'mandates';

export function Politicians({ onNavigate }: PoliticiansProps) {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterParty, setFilterParty] = useState<string>('');
  const [filterChamber, setFilterChamber] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pols, mands] = await Promise.all([fetchPoliticians(), fetchAllMandates()]);
        setPoliticians(pols);
        setMandates(mands);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getMandateCount = (id: string) => mandates.filter(m => m.politician_id === id).length;
  const getTopSectors = (id: string): string[] => {
    const sectors = mandates
      .filter(m => m.politician_id === id && m.industry_sector)
      .map(m => m.industry_sector as string);
    return [...new Set(sectors)].slice(0, 2);
  };

  const parties = [...new Set(politicians.map(p => p.party))].sort();
  const chambers = [...new Set(politicians.map(p => p.chamber))].sort();

  let filtered = politicians.filter(p => {
    const q = query.toLowerCase();
    if (q && !p.full_name.toLowerCase().includes(q) && !p.party.toLowerCase().includes(q) && !p.canton.toLowerCase().includes(q)) return false;
    if (filterParty && p.party !== filterParty) return false;
    if (filterChamber && p.chamber !== filterChamber) return false;
    return true;
  });

  filtered = filtered.sort((a, b) => {
    let va: string | number = 0;
    let vb: string | number = 0;
    if (sortField === 'name') { va = a.full_name; vb = b.full_name; }
    if (sortField === 'party') { va = a.party; vb = b.party; }
    if (sortField === 'canton') { va = a.canton; vb = b.canton; }
    if (sortField === 'mandates') { va = getMandateCount(a.id); vb = getMandateCount(b.id); }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      <div className="border-b border-slate-800 px-8 py-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">Politicians</h1>
        <p className="text-slate-400 text-sm mt-1">Federal parliament members with disclosed institutional roles and affiliations.</p>
      </div>

      <div className="px-8 py-5">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, party, canton…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={filterParty}
              onChange={e => setFilterParty(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All parties</option>
              {parties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filterChamber}
              onChange={e => setFilterChamber(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All chambers</option>
              {chambers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <span className="text-slate-600 text-sm ml-auto">{filtered.length} results</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {[
                    { field: 'name' as SortField, label: 'Name' },
                    { field: 'party' as SortField, label: 'Party' },
                    { field: 'canton' as SortField, label: 'Canton' },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="text-left px-5 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => toggleSort(col.field)}
                    >
                      <span className="flex items-center gap-1.5">
                        {col.label}
                        <ArrowUpDown size={10} className={sortField === col.field ? 'text-blue-400' : 'text-slate-700'} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Chamber</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Sectors</th>
                  <th
                    className="text-left px-5 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => toggleSort('mandates')}
                  >
                    <span className="flex items-center gap-1.5">
                      Mandates
                      <ArrowUpDown size={10} className={sortField === 'mandates' ? 'text-blue-400' : 'text-slate-700'} />
                    </span>
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(p => {
                  const count = getMandateCount(p.id);
                  const sectors = getTopSectors(p.id);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => onNavigate('profile', p.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200 group-hover:text-white transition-colors">
                          {p.full_name}
                        </div>
                        {p.birth_year && (
                          <div className="text-xs text-slate-600 mt-0.5">b. {p.birth_year}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <PartyBadge party={p.party as PartyAffiliation} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{p.canton}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{p.chamber}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {sectors.map(s => (
                            <SectorBadge key={s} sector={s.split(' ')[0]} />
                          ))}
                          {sectors.length === 0 && <span className="text-slate-600 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-xs font-semibold w-4">{count}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">No politicians match your filters.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
