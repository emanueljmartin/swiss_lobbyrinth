import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Network, Users, Zap, TrendingUp, GitBranch } from 'lucide-react';

interface NetworkLink {
  politician_1: string;
  politician_2: string;
  votes_together: number;
  aligned_votes: number;
  alignment_percentage: number;
  politician_1_party: string[];
  politician_2_party: string[];
}

interface Coalition {
  coalition_name: string;
  member_count: number;
  avg_influence: number;
  leadership_positions: string;
  committee_positions: number;
  avg_compensation: number;
}

interface NetworkHub {
  id: string;
  full_name: string;
  party: string;
  network_connections: number;
  avg_alignment: number;
  lobbying_contacts: number;
  committee_membership_count: number;
  influence_score: number;
  hub_type: string;
}

export default function NetworkAnalysisView() {
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [coalitions, setCoalitions] = useState<Coalition[]>([]);
  const [hubs, setHubs] = useState<NetworkHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coalitions' | 'hubs' | 'connections'>('coalitions');

  useEffect(() => {
    fetchNetworkData();
  }, []);

  async function fetchNetworkData() {
    setLoading(true);
    try {
      const [linksRes, coalitionsRes, hubsRes] = await Promise.all([
        supabase
          .from('politician_network_links')
          .select('*')
          .order('aligned_votes', { ascending: false })
          .limit(50),
        supabase
          .from('political_coalitions')
          .select('*')
          .order('member_count', { ascending: false }),
        supabase
          .from('network_influence_hubs')
          .select('*')
          .order('network_connections', { ascending: false })
          .limit(40)
      ]);

      if (linksRes.data) setLinks(linksRes.data);
      if (coalitionsRes.data) setCoalitions(coalitionsRes.data);
      if (hubsRes.data) setHubs(hubsRes.data);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getHubColor(type: string) {
    switch (type) {
      case 'MAJOR_HUB':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REGIONAL_HUB':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SECTOR_HUB':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Network className="h-6 w-6 text-blue-600" />
          Political Network Analysis
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Coalition mapping, influence hubs, and voting patterns
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Political Parties</div>
              <div className="text-2xl font-bold text-blue-600">{coalitions.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <Network className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Network Links</div>
              <div className="text-2xl font-bold text-purple-600">{links.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Influence Hubs</div>
              <div className="text-2xl font-bold text-green-600">{hubs.filter(h => h.hub_type === 'MAJOR_HUB').length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <GitBranch className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Avg Cohesion</div>
              <div className="text-2xl font-bold text-orange-600">
                {links.length > 0 ? Math.round(links.reduce((sum, l) => sum + l.alignment_percentage, 0) / links.length) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'coalitions', label: 'Political Coalitions', icon: Users },
            { id: 'hubs', label: 'Influence Hubs', icon: Zap },
            { id: 'connections', label: 'Network Connections', icon: Network }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Coalitions */}
      {activeTab === 'coalitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coalitions.map((coalition) => (
            <div key={coalition.coalition_name} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{coalition.coalition_name}</h3>
                  <p className="text-sm text-gray-600">{coalition.member_count} members</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{coalition.member_count}</div>
                  <div className="text-xs text-gray-500">Seats</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Influence</span>
                  <span className="text-sm font-semibold text-gray-900">{coalition.avg_influence.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Committee Positions</span>
                  <span className="text-sm font-semibold text-gray-900">{coalition.committee_positions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Compensation</span>
                  <span className="text-sm font-semibold text-green-600">
                    {coalition.avg_compensation ? `CHF ${Math.round(coalition.avg_compensation / 1000)}k` : '-'}
                  </span>
                </div>
              </div>

              {coalition.leadership_positions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Leadership:</p>
                  <p className="text-xs text-gray-900">{coalition.leadership_positions.substring(0, 60)}...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Influence Hubs */}
      {activeTab === 'hubs' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Politician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hub Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connections</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Alignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Committees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hubs.slice(0, 30).map((hub) => (
                <tr key={hub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{hub.full_name}</div>
                    <div className="text-sm text-gray-500">{hub.party}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getHubColor(hub.hub_type)}`}>
                      {hub.hub_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{hub.network_connections}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 rounded-full h-1 mr-2">
                        <div
                          className="bg-green-600 h-1 rounded-full"
                          style={{ width: `${(hub.avg_alignment || 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(hub.avg_alignment || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hub.committee_membership_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {Math.round(hub.influence_score)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Network Connections */}
      {activeTab === 'connections' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Politician 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Politician 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joint Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aligned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alignment %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.slice(0, 30).map((link, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {link.politician_1_party?.[0] || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {link.politician_2_party?.[0] || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{link.votes_together}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">{link.aligned_votes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${link.alignment_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{link.alignment_percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
