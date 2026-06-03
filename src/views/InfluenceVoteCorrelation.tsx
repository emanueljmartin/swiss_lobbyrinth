import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp, Loader } from 'lucide-react';

interface AlignmentRow {
  politician_id: string;
  full_name: string;
  party: string;
  mandate_sector: string;
  policy_area: string;
  mandate_count: number;
  is_paid: boolean;
  compensation_chf: number | null;
  total_votes_in_area: number;
  yes_votes: number;
  no_votes: number;
  yes_rate_pct: number;
}

interface CorrelationGroup {
  sector: string;
  policy_area: string;
  politicians: AlignmentRow[];
  avg_yes_rate: number;
  paid_count: number;
  total_count: number;
}

const SECTOR_POLICY_MAP: Record<string, string[]> = {
  'Finance': ['Finance', 'Economic Policy', 'Taxation', 'Banking'],
  'Healthcare': ['Health', 'Social Policy', 'Insurance'],
  'Energy': ['Energy', 'Environment', 'Climate'],
  'Technology': ['Science', 'Digital Policy', 'Communication'],
  'Agriculture': ['Agriculture', 'Environment', 'Rural Policy'],
  'Transport': ['Transport', 'Infrastructure', 'Urban Planning'],
  'Defense': ['Defense', 'Foreign Policy', 'Security'],
  'Real Estate': ['Housing', 'Urban Planning', 'Taxation'],
};

function alignmentColor(rate: number): string {
  if (rate >= 80) return 'text-red-400';
  if (rate >= 65) return 'text-orange-400';
  if (rate >= 50) return 'text-yellow-400';
  return 'text-slate-400';
}

function conflictSeverity(row: AlignmentRow): 'high' | 'medium' | 'low' {
  if (row.is_paid && row.yes_rate_pct >= 75 && row.total_votes_in_area >= 3) return 'high';
  if (row.yes_rate_pct >= 65 && row.total_votes_in_area >= 2) return 'medium';
  return 'low';
}

export function InfluenceVoteCorrelationView() {
  const [rows, setRows] = useState<AlignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [showOnly, setShowOnly] = useState<'all' | 'paid' | 'high'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('mandate_vote_alignment')
      .select('*')
      .gte('total_votes_in_area', 1)
      .order('yes_rate_pct', { ascending: false });

    if (!error && data) setRows(data as AlignmentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sectors = Array.from(new Set(rows.map(r => r.mandate_sector))).sort();

  const filtered = rows.filter(r => {
    if (selectedSector && r.mandate_sector !== selectedSector) return false;
    if (showOnly === 'paid' && !r.is_paid) return false;
    if (showOnly === 'high' && conflictSeverity(r) !== 'high') return false;
    return true;
  });

  // Group by sector + policy area
  const groups: CorrelationGroup[] = [];
  const groupMap: Record<string, CorrelationGroup> = {};
  for (const r of filtered) {
    const key = `${r.mandate_sector}::${r.policy_area}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        sector: r.mandate_sector,
        policy_area: r.policy_area,
        politicians: [],
        avg_yes_rate: 0,
        paid_count: 0,
        total_count: 0,
      };
      groups.push(groupMap[key]);
    }
    groupMap[key].politicians.push(r);
    groupMap[key].total_count++;
    if (r.is_paid) groupMap[key].paid_count++;
  }
  for (const g of groups) {
    g.avg_yes_rate = g.politicians.reduce((s, p) => s + p.yes_rate_pct, 0) / g.politicians.length;
  }
  groups.sort((a, b) => b.avg_yes_rate - a.avg_yes_rate);

  const toggleGroup = (key: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });

  const highRiskCount = rows.filter(r => conflictSeverity(r) === 'high').length;
  const medRiskCount = rows.filter(r => conflictSeverity(r) === 'medium').length;
  const paidCount = rows.filter(r => r.is_paid).length;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader className="animate-spin text-slate-400" size={24} />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Influence-to-Vote Correlation</h1>
        <p className="text-slate-400 text-sm">
          Cross-references politicians' mandate sectors with their voting records on related policy areas.
          High alignment between paid mandates and favourable votes is flagged as a potential conflict indicator.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{rows.length}</div>
          <div className="text-sm text-slate-400 mt-0.5">Sector/Vote intersections</div>
        </div>
        <div className="bg-slate-900 border border-red-900/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{highRiskCount}</div>
          <div className="text-sm text-slate-400 mt-0.5">High-risk alignments</div>
          <div className="text-xs text-slate-500 mt-1">Paid mandate + ≥75% yes-rate</div>
        </div>
        <div className="bg-slate-900 border border-orange-900/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-400">{medRiskCount}</div>
          <div className="text-sm text-slate-400 mt-0.5">Medium-risk alignments</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{paidCount}</div>
          <div className="text-sm text-slate-400 mt-0.5">With paid mandate</div>
        </div>
      </div>

      {/* Methodology note */}
      <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-medium">Methodology: </span>
          A politician's industry mandates are matched against parliamentary votes in related policy areas.
          The yes-rate measures how often they voted YES on legislation relevant to sectors where they hold mandates.
          This is a <em>correlation indicator</em>, not proof of wrongdoing.
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {['all', 'paid', 'high'].map(v => (
            <button
              key={v}
              onClick={() => setShowOnly(v as typeof showOnly)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                showOnly === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {v === 'all' ? 'All' : v === 'paid' ? 'Paid mandates only' : 'High risk only'}
            </button>
          ))}
        </div>
        <select
          value={selectedSector ?? ''}
          onChange={e => setSelectedSector(e.target.value || null)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} records</span>
      </div>

      {groups.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <TrendingUp size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No alignment data yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Trigger a Parliament sync from the Data Ingestion page to populate real voting records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => {
            const key = `${g.sector}::${g.policy_area}`;
            const isExpanded = expandedGroups.has(key);
            const highInGroup = g.politicians.filter(p => conflictSeverity(p) === 'high').length;

            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{g.sector}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-300">{g.policy_area}</span>
                        {highInGroup > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-900/40 border border-red-700 text-red-300 rounded text-xs">
                            <AlertTriangle size={10} /> {highInGroup} high risk
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {g.total_count} politicians · {g.paid_count} with paid mandate
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${alignmentColor(g.avg_yes_rate)}`}>
                        {g.avg_yes_rate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-500">avg yes-rate</div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                          <th className="text-left px-5 py-2">Politician</th>
                          <th className="text-left px-4 py-2">Party</th>
                          <th className="text-center px-4 py-2">Mandates</th>
                          <th className="text-center px-4 py-2">Paid</th>
                          <th className="text-right px-4 py-2">Votes cast</th>
                          <th className="text-right px-4 py-2">Yes-rate</th>
                          <th className="text-center px-4 py-2">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.politicians
                          .sort((a, b) => b.yes_rate_pct - a.yes_rate_pct)
                          .map(p => {
                            const sev = conflictSeverity(p);
                            return (
                              <tr key={`${p.politician_id}-${p.policy_area}`} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                <td className="px-5 py-2.5 font-medium text-white">{p.full_name}</td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">{p.party}</span>
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-300">{p.mandate_count}</td>
                                <td className="px-4 py-2.5 text-center">
                                  {p.is_paid
                                    ? <span className="text-xs text-yellow-400 font-medium">PAID</span>
                                    : <span className="text-xs text-slate-600">—</span>
                                  }
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-400">{p.total_votes_in_area}</td>
                                <td className={`px-4 py-2.5 text-right font-bold ${alignmentColor(p.yes_rate_pct)}`}>
                                  {p.yes_rate_pct?.toFixed(0) ?? '—'}%
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {sev === 'high' && (
                                    <span className="px-2 py-0.5 bg-red-900/40 text-red-400 border border-red-800 rounded text-xs">HIGH</span>
                                  )}
                                  {sev === 'medium' && (
                                    <span className="px-2 py-0.5 bg-orange-900/40 text-orange-400 border border-orange-800 rounded text-xs">MED</span>
                                  )}
                                  {sev === 'low' && (
                                    <span className="text-slate-600 text-xs">low</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Re-export for App.tsx compatibility
export { SECTOR_POLICY_MAP };
