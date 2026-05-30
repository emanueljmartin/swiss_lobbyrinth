import { useEffect, useState } from 'react';
import { Users, Network, BarChart3, Database, TrendingUp, Vote, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchPoliticians, fetchAllMandates, computeSectorExposure, fetchParliamentaryVotes, fetchDataSources } from '../lib/queries';
import type { Politician, Mandate, ParliamentaryVote, DataSource, SectorExposure } from '../types';
import { PartyBadge, VoteBadge } from '../components/Badge';
import { SectorDonut } from '../components/SectorChart';
import { PARTY_COLORS } from '../types';
import type { ViewType, PartyAffiliation } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [votes, setVotes] = useState<ParliamentaryVote[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [sectorData, setSectorData] = useState<SectorExposure[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pols, mands, vts, srcs] = await Promise.all([
          fetchPoliticians(),
          fetchAllMandates(),
          fetchParliamentaryVotes(),
          fetchDataSources(),
        ]);
        setPoliticians(pols);
        setMandates(mands);
        setVotes(vts);
        setSources(srcs);
        const sectors = await computeSectorExposure(mands);
        setSectorData(sectors);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const partyDist = politicians.reduce<Record<string, number>>((acc, p) => {
    acc[p.party] = (acc[p.party] ?? 0) + 1;
    return acc;
  }, {});

  const recentVotes = votes.slice(0, 5);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading transparency data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-lg font-semibold mb-2">Error Loading Data</h2>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Institutional Transparency Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Structural mapping of political mandates, corporate governance, and institutional networks in Switzerland.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-900/50 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
            <span className="text-amber-200/70 text-xs max-w-xs">
              This platform maps structural relationships only. Relationships shown do not imply wrongdoing.
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Politicians Tracked', value: politicians.length, icon: <Users size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', sub: 'Federal parliament' },
            { label: 'Outside Mandates', value: mandates.length, icon: <Network size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: 'Disclosed roles' },
            { label: 'Industry Sectors', value: sectorData.length, icon: <BarChart3 size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: 'Represented' },
            { label: 'Data Sources', value: sources.length, icon: <Database size={18} />, color: 'text-slate-400', bg: 'bg-slate-500/10', sub: 'Public registries' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <TrendingUp size={13} className="text-slate-700 mt-1" />
              </div>
              <div className="text-3xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Sector exposure donut */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Sector Exposure</h3>
              <button
                onClick={() => onNavigate('sectors')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Full analysis <ArrowRight size={11} />
              </button>
            </div>
            <SectorDonut data={sectorData} />
          </div>

          {/* Party distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Party Distribution</h3>
              <button
                onClick={() => onNavigate('politicians')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(partyDist)
                .sort((a, b) => b[1] - a[1])
                .map(([party, count]) => {
                  const color = PARTY_COLORS[party as PartyAffiliation] ?? '#6B7280';
                  return (
                    <div key={party} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-slate-400 flex-1">{party}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / politicians.length) * 100}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent votes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Recent Votes</h3>
              <button
                onClick={() => onNavigate('votes')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                All votes <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-3">
              {recentVotes.map(v => (
                <button
                  key={v.id}
                  onClick={() => onNavigate('votes')}
                  className="w-full text-left group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight line-clamp-2 flex-1">
                      {v.title_de}
                    </span>
                    <VoteBadge result={v.result === 'Accepted' ? 'YES' : 'NO'} />
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                    <Vote size={10} />
                    {v.vote_date} · {v.chamber}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Politicians with most mandates */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Mandate Concentration</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Politicians with the highest number of disclosed outside roles. Concentration is descriptive only.
              </p>
            </div>
            <button
              onClick={() => onNavigate('politicians')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View all politicians <ArrowRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="text-slate-500 font-medium pb-3 text-xs pr-4">Politician</th>
                  <th className="text-slate-500 font-medium pb-3 text-xs pr-4">Party</th>
                  <th className="text-slate-500 font-medium pb-3 text-xs pr-4">Chamber</th>
                  <th className="text-slate-500 font-medium pb-3 text-xs pr-4">Canton</th>
                  <th className="text-slate-500 font-medium pb-3 text-xs">Mandates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {politicians.slice(0, 8).map(p => {
                  const count = mandates.filter(m => m.politician_id === p.id).length;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => onNavigate('profile', p.id)}
                    >
                      <td className="py-2.5 pr-4">
                        <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                          {p.full_name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <PartyBadge party={p.party} />
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">{p.chamber}</td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">{p.canton}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.min(100, (count / 4) * 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-xs font-semibold">{count}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">Data Sources & Provenance</h3>
          <div className="grid grid-cols-2 gap-3">
            {sources.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <div className="text-slate-200 text-xs font-medium truncate">{s.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{s.data_type}</div>
                  {s.license && <div className="text-slate-600 text-xs">{s.license}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
