import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Activity, Zap, Users, Vote } from 'lucide-react';

interface RiskPolitician {
  id: string;
  full_name: string;
  party: string;
  canton: string;
  total_conflict_flags: number;
  high_severity_flags: number;
  paid_interests_count: number;
  total_compensation: number;
}

interface RecentVote {
  id: string;
  title_de: string;
  vote_date: string;
  result: string | null;
  yes_count: number;
  no_count: number;
  chamber: string;
}

interface CrossPartyPair {
  politician_a_id: string;
  politician_b_id: string;
  party_a: string;
  party_b: string;
  similarity_score: number;
  votes_compared: number;
}

export default function MonitoringDashboard() {
  const [riskPoliticians, setRiskPoliticians] = useState<RiskPolitician[]>([]);
  const [recentVotes, setRecentVotes] = useState<RecentVote[]>([]);
  const [crossPartyPairs, setCrossPartyPairs] = useState<CrossPartyPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  async function fetchMonitoringData() {
    try {
      const [riskRes, votesRes, similarityRes] = await Promise.all([
        supabase
          .from('politician_risk_scores')
          .select('*')
          .gt('total_conflict_flags', 0)
          .order('total_conflict_flags', { ascending: false })
          .limit(15),
        supabase
          .from('parliamentary_votes')
          .select('*')
          .order('vote_date', { ascending: false })
          .limit(10),
        supabase
          .from('voting_similarity')
          .select('*')
          .eq('is_cross_party', true)
          .gte('similarity_score', 0.8)
          .order('similarity_score', { ascending: false })
          .limit(15),
      ]);

      if (riskRes.data) setRiskPoliticians(riskRes.data);
      if (votesRes.data) setRecentVotes(votesRes.data);
      if (similarityRes.data) setCrossPartyPairs(similarityRes.data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getRiskLevel(flags: number) {
    if (flags >= 5) return { label: 'HIGH', color: 'bg-red-100 text-red-800 border-red-200' };
    if (flags >= 3) return { label: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'LOW', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-400" />
          Monitoring Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Conflict flags, recent votes, and cross-party alignment from Parliament data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-900/50 rounded-md p-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Flagged Politicians</div>
              <div className="text-2xl font-bold text-red-400">{riskPoliticians.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/50 rounded-md p-3">
              <Vote className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Recent Votes</div>
              <div className="text-2xl font-bold text-blue-400">{recentVotes.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900/50 rounded-md p-3">
              <Users className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Cross-Party Alignments</div>
              <div className="text-2xl font-bold text-amber-400">{crossPartyPairs.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Flagged Politicians */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Conflict Risk Flags
            </h2>
          </div>
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {riskPoliticians.map((p) => {
              const risk = getRiskLevel(p.total_conflict_flags);
              return (
                <div key={p.id} className="p-4 hover:bg-slate-800/50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-slate-400">{p.party} - {p.canton}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${risk.color}`}>
                      {risk.label} ({p.total_conflict_flags})
                    </span>
                  </div>
                </div>
              );
            })}
            {riskPoliticians.length === 0 && (
              <div className="p-8 text-center text-slate-500">No conflict flags detected</div>
            )}
          </div>
        </div>

        {/* Recent Parliamentary Votes */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Vote className="h-5 w-5 text-blue-400" />
              Recent Parliamentary Votes
            </h2>
          </div>
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {recentVotes.map((v) => (
              <div key={v.id} className="p-4 hover:bg-slate-800/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.title_de}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {v.chamber} - {formatDate(v.vote_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-green-400">{v.yes_count} Y</span>
                    <span className="text-xs text-red-400">{v.no_count} N</span>
                  </div>
                </div>
              </div>
            ))}
            {recentVotes.length === 0 && (
              <div className="p-8 text-center text-slate-500">No recent votes available</div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Party High Similarity */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            High Cross-Party Voting Alignment (Potential Anomalies)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Politicians from different parties voting similarly over 80% of the time</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Party A</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Party B</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Similarity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Votes Compared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {crossPartyPairs.map((pair, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 text-sm">{pair.party_a}</td>
                  <td className="px-6 py-3 text-sm">{pair.party_b}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pair.similarity_score * 100}%` }} />
                      </div>
                      <span className="text-xs text-amber-400">{(pair.similarity_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{pair.votes_compared}</td>
                </tr>
              ))}
              {crossPartyPairs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Not enough vote data to detect cross-party anomalies
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
