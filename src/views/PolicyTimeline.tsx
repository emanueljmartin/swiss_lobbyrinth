import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, TrendingUp, BarChart3, Filter } from 'lucide-react';

interface VoteEvent {
  id: string;
  title_de: string;
  vote_date: string;
  chamber: string;
  policy_area: string | null;
  result: string | null;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  vote_category: string | null;
}

type TabId = 'timeline' | 'sectors' | 'chambers';

export default function PolicyTimelineView() {
  const [votes, setVotes] = useState<VoteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabId>('timeline');

  useEffect(() => {
    fetchTimelineData();
  }, []);

  async function fetchTimelineData() {
    try {
      const { data, error } = await supabase
        .from('parliamentary_votes')
        .select('*')
        .order('vote_date', { ascending: false });

      if (error) throw error;
      if (data) setVotes(data);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
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

  const policyAreas = [...new Set(votes.map(v => v.policy_area).filter(Boolean))].sort() as string[];
  const filteredVotes = filterArea === 'all' ? votes : votes.filter(v => v.policy_area === filterArea);
  const chamberStats = votes.reduce((acc, v) => {
    acc[v.chamber] = (acc[v.chamber] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sectorStats = votes.reduce((acc, v) => {
    const area = v.policy_area || 'Uncategorized';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-400" />
          Policy Timeline
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Parliamentary vote chronology from Swiss Federal Assembly data
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-4">
          {[
            { id: 'timeline' as TabId, label: 'Vote Timeline', icon: Calendar },
            { id: 'sectors' as TabId, label: 'By Policy Area', icon: BarChart3 },
            { id: 'chambers' as TabId, label: 'By Chamber', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'timeline' && (
        <div>
          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Policy Areas</option>
              {policyAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <span className="text-xs text-slate-500">{filteredVotes.length} votes</span>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800" />
            <div className="space-y-4">
              {filteredVotes.slice(0, 25).map((vote) => (
                <div key={vote.id} className="relative pl-10">
                  <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                    vote.result === 'Accepted' ? 'bg-green-500 border-green-400' :
                    vote.result === 'Rejected' ? 'bg-red-500 border-red-400' :
                    'bg-slate-600 border-slate-500'
                  }`} />
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">{formatDate(vote.vote_date)}</span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{vote.chamber}</span>
                    </div>
                    <p className="text-sm font-medium mb-2">{vote.title_de}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-400">{vote.yes_count} Yes</span>
                      <span className="text-red-400">{vote.no_count} No</span>
                      <span className="text-slate-500">{vote.abstain_count} Abstain</span>
                      {vote.policy_area && (
                        <span className="text-blue-400">{vote.policy_area}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredVotes.length === 0 && (
                <div className="pl-10 p-8 text-center text-slate-500">No votes match the selected filter</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(sectorStats).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
            <div key={area} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-1">{area}</h3>
              <div className="text-2xl font-bold text-blue-400">{count}</div>
              <p className="text-xs text-slate-500">parliamentary votes</p>
            </div>
          ))}
          {Object.keys(sectorStats).length === 0 && (
            <div className="col-span-3 p-8 text-center text-slate-500">No policy area data available</div>
          )}
        </div>
      )}

      {activeTab === 'chambers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(chamberStats).map(([chamber, count]) => (
            <div key={chamber} className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{chamber}</h3>
              <div className="text-4xl font-bold text-blue-400 mb-2">{count}</div>
              <p className="text-sm text-slate-400">votes recorded</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
