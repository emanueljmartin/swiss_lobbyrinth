import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Network, Users, GitBranch } from 'lucide-react';

interface SimilarityPair {
  politician_a_id: string;
  politician_b_id: string;
  party_a: string;
  party_b: string;
  similarity_score: number;
  votes_compared: number;
  is_cross_party: boolean;
}

interface CommitteeNetwork {
  committee_id: string;
  committee_name: string;
  member_count: number;
  parties: string[];
  chamber: string;
}

interface HubPolitician {
  id: string;
  full_name: string;
  party: string;
  canton: string;
  influence_score: number;
  total_mandates: number;
  committee_positions: number;
}

type TabId = 'coalitions' | 'hubs' | 'connections';

export default function NetworkAnalysisView() {
  const [similarityPairs, setSimilarityPairs] = useState<SimilarityPair[]>([]);
  const [committeeNetworks, setCommitteeNetworks] = useState<CommitteeNetwork[]>([]);
  const [hubPoliticians, setHubPoliticians] = useState<HubPolitician[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('coalitions');

  useEffect(() => {
    fetchNetworkData();
  }, []);

  async function fetchNetworkData() {
    setLoading(true);
    try {
      const [simRes, committeeRes, hubRes] = await Promise.all([
        supabase
          .from('voting_similarity')
          .select('*')
          .order('similarity_score', { ascending: false })
          .limit(100),
        supabase
          .from('committees')
          .select('id, name_de, chamber, abbreviation'),
        supabase
          .from('politician_influence')
          .select('*')
          .gt('total_mandates', 0)
          .order('influence_score', { ascending: false })
          .limit(40),
      ]);

      if (simRes.data) setSimilarityPairs(simRes.data);

      if (committeeRes.data) {
        // Enrich committees with member counts
        const committeeIds = committeeRes.data.map(c => c.id);
        const { data: memberships } = await supabase
          .from('committee_memberships')
          .select('committee_id, politician:politicians(party)')
          .in('committee_id', committeeIds)
          .eq('is_current', true);

        const memberMap: Record<string, { count: number; parties: Set<string> }> = {};
        for (const m of (memberships ?? [])) {
          if (!memberMap[m.committee_id]) memberMap[m.committee_id] = { count: 0, parties: new Set() };
          memberMap[m.committee_id].count++;
          const party = (m.politician as unknown as Record<string, string>)?.party;
          if (party) memberMap[m.committee_id].parties.add(party);
        }

        const networks: CommitteeNetwork[] = committeeRes.data
          .map(c => ({
            committee_id: c.id,
            committee_name: c.name_de,
            member_count: memberMap[c.id]?.count ?? 0,
            parties: Array.from(memberMap[c.id]?.parties ?? []),
            chamber: c.chamber,
          }))
          .filter(n => n.member_count > 0)
          .sort((a, b) => b.member_count - a.member_count);
        setCommitteeNetworks(networks);
      }

      if (hubRes.data) setHubPoliticians(hubRes.data);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const crossPartyPairs = similarityPairs.filter(p => p.is_cross_party);

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-blue-400" />
          Network Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Committee networks, influence hubs, and voting connections from Parliament data
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-4">
          {[
            { id: 'coalitions' as TabId, label: 'Committee Networks', icon: GitBranch, count: committeeNetworks.length },
            { id: 'hubs' as TabId, label: 'Influence Hubs', icon: Users, count: hubPoliticians.length },
            { id: 'connections' as TabId, label: 'Voting Connections', icon: Network, count: similarityPairs.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="ml-1 bg-slate-800 text-slate-400 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'coalitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committeeNetworks.map(cn => (
            <div key={cn.committee_id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium truncate">{cn.committee_name}</h3>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{cn.chamber}</span>
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-2">{cn.member_count}</div>
              <p className="text-xs text-slate-500 mb-2">members across {cn.parties.length} parties</p>
              <div className="flex flex-wrap gap-1">
                {cn.parties.slice(0, 5).map(party => (
                  <span key={party} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">{party}</span>
                ))}
                {cn.parties.length > 5 && <span className="text-xs text-slate-500">+{cn.parties.length - 5}</span>}
              </div>
            </div>
          ))}
          {committeeNetworks.length === 0 && (
            <div className="col-span-3 p-8 text-center text-slate-500">No committee network data available</div>
          )}
        </div>
      )}

      {activeTab === 'hubs' && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Politician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Party</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Influence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Mandates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Committees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {hubPoliticians.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 text-sm font-medium">{p.full_name}</td>
                  <td className="px-6 py-3 text-sm text-slate-400">{p.party}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p.influence_score)}%` }} />
                      </div>
                      <span className="text-xs text-blue-400">{p.influence_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{p.total_mandates}</td>
                  <td className="px-6 py-3 text-sm text-slate-400">{p.committee_positions}</td>
                </tr>
              ))}
              {hubPoliticians.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No influence data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-amber-400">Cross-Party Connections</h3>
              <p className="text-xs text-slate-500">Politicians from different parties with high voting similarity</p>
            </div>
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Party A</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Party B</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Similarity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Votes Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {crossPartyPairs.slice(0, 30).map((pair, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="px-6 py-3 text-sm">{pair.party_a}</td>
                    <td className="px-6 py-3 text-sm">{pair.party_b}</td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pair.similarity_score * 100}%` }} />
                        </div>
                        <span className="text-xs">{(pair.similarity_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">{pair.votes_compared}</td>
                  </tr>
                ))}
                {crossPartyPairs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Not enough voting data for cross-party analysis</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
