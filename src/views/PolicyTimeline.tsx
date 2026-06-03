import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, TrendingUp, BarChart3, Filter } from 'lucide-react';

interface PolicyEvent {
  vote_date: string;
  bill_title: string;
  policy_area: string;
  outcome: string;
  votes_cast: number;
  yes_votes: number;
  no_votes: number;
  parties_involved: string[];
  support_percentage: number;
}

interface VotingPrediction {
  politician_id: string;
  predicted_vote: string;
  confidence_score: number;
  model_version: string;
}

interface ClusterInfo {
  cluster_id: number;
  cluster_name: string;
  description: string;
  politician_count: number;
  average_loyalty: number;
  key_characteristics: string[];
  typical_parties: string[];
}

export default function PolicyTimelineView() {
  const [timeline, setTimeline] = useState<PolicyEvent[]>([]);
  const [predictions, setPredictions] = useState<VotingPrediction[]>([]);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'clusters' | 'predictions'>('timeline');
  const [selectedArea, setSelectedArea] = useState<string>('');

  useEffect(() => {
    fetchPolicyData();
  }, []);

  async function fetchPolicyData() {
    setLoading(true);
    try {
      const [timelineRes, predictionsRes, clustersRes] = await Promise.all([
        supabase
          .from('policy_timeline')
          .select('*')
          .order('vote_date', { ascending: false })
          .limit(50),
        supabase
          .from('politician_voting_predictions')
          .select('*')
          .limit(50),
        supabase
          .from('voting_pattern_clusters')
          .select('*')
      ]);

      if (timelineRes.data) setTimeline(timelineRes.data);
      if (predictionsRes.data) setPredictions(predictionsRes.data);
      if (clustersRes.data) setClusters(clustersRes.data);
    } catch (error) {
      console.error('Error fetching policy data:', error);
    } finally {
      setLoading(false);
    }
  }

  const uniqueAreas = [...new Set(timeline.map(t => t.policy_area).filter(Boolean))];
  const filteredTimeline = selectedArea ? timeline.filter(t => t.policy_area === selectedArea) : timeline;

  function getOutcomeColor(outcome: string) {
    switch (outcome?.toUpperCase()) {
      case 'PASSED':
      case 'PASS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
      case 'FAIL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
      case 'CLOSE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <Calendar className="h-6 w-6 text-blue-600" />
          Policy Timeline & Voting Patterns
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Legislative history, voting clusters, and predictions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Votes Recorded</div>
              <div className="text-2xl font-bold text-blue-600">{timeline.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Voting Clusters</div>
              <div className="text-2xl font-bold text-purple-600">{clusters.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Predictions</div>
              <div className="text-2xl font-bold text-green-600">{predictions.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'timeline', label: 'Policy Timeline', icon: Calendar },
            { id: 'clusters', label: 'Voting Clusters', icon: BarChart3 },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {uniqueAreas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by Policy Area:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedArea('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedArea === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {uniqueAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedArea === area
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredTimeline.slice(0, 25).map((event, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{event.bill_title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(event.vote_date)} • {event.policy_area}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOutcomeColor(event.outcome)}`}>
                    {event.outcome}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Votes Cast</div>
                    <div className="text-sm font-semibold text-gray-900">{event.votes_cast}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Yes</div>
                    <div className="text-sm font-semibold text-green-600">{event.yes_votes}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">No</div>
                    <div className="text-sm font-semibold text-red-600">{event.no_votes}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Support</div>
                    <div className="text-sm font-semibold text-blue-600">{event.support_percentage?.toFixed(1)}%</div>
                  </div>
                </div>

                {event.parties_involved?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {event.parties_involved.map((party) => (
                      <span key={party} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {party}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredTimeline.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No votes recorded for this policy area
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voting Clusters */}
      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cluster) => (
            <div key={cluster.cluster_id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900">{cluster.cluster_name}</h3>
                <p className="text-sm text-gray-600">{cluster.description}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Politicians in Cluster</span>
                  <span className="text-sm font-semibold text-gray-900">{cluster.politician_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Loyalty</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(cluster.average_loyalty || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{Math.round((cluster.average_loyalty || 0) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Key Characteristics:</p>
                <div className="flex flex-wrap gap-1">
                  {cluster.key_characteristics?.map((char) => (
                    <span key={char} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                      {char.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {cluster.typical_parties?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Typical Parties:</p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.typical_parties.map((party) => (
                      <span key={party} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Predictions */}
      {activeTab === 'predictions' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted Vote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {predictions.slice(0, 20).map((pred, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      pred.predicted_vote === 'YES'
                        ? 'bg-green-100 text-green-800'
                        : pred.predicted_vote === 'NO'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pred.predicted_vote}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${(pred.confidence_score || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{Math.round((pred.confidence_score || 0) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{pred.model_version}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {Math.round((pred.confidence_score || 0) * 100)}%
                    </span>
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
