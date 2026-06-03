import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, DollarSign, Users, Shield } from 'lucide-react';

interface RiskScore {
  id: string;
  full_name: string;
  party: string;
  canton: string;
  total_conflict_flags: number;
  high_severity_flags: number;
  medium_severity_flags: number;
  paid_interests_count: number;
  total_compensation: number;
  lobbying_meetings_count: number;
}

interface LobbyingInfluence {
  organization_id: string;
  organization_name: string;
  industry_sector: string | null;
  total_meetings: number;
  unique_politicians_contacted: number;
  total_minutes: number | null;
  subjects_discussed: string[];
}

interface FinanceSummary {
  politician_id: string;
  full_name: string;
  party: string;
  election_year: number;
  total_contributions: number;
  total_received_chf: number;
  from_companies: number;
  from_individuals: number;
  from_party: number;
  from_unions: number;
}

export default function ConflictDashboard() {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [lobbyingInfluence, setLobbyingInfluence] = useState<LobbyingInfluence[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'risks' | 'lobbying' | 'funding'>('risks');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [risksRes, lobbyingRes, financeRes] = await Promise.all([
        supabase.from('politician_risk_scores').select('*').limit(50),
        supabase.from('lobbying_influence').select('*').limit(30),
        supabase.from('campaign_finance_summary').select('*').order('total_received_chf', { ascending: false }).limit(50)
      ]);

      if (risksRes.data) setRiskScores(risksRes.data);
      if (lobbyingRes.data) setLobbyingInfluence(lobbyingRes.data);
      if (financeRes.data) setFinanceSummary(financeRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCHF(amount: number) {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getPartyColor(party: string) {
    const colors: Record<string, string> = {
      'SVP': 'text-green-600',
      'FDP': 'text-blue-600',
      'SP': 'text-red-600',
      'Mitte': 'text-orange-600',
      'GPS': 'text-emerald-600',
      'GLP': 'text-lime-600',
    };
    return colors[party] || 'text-gray-600';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalConflicts = riskScores.reduce((sum, r) => sum + r.total_conflict_flags, 0);
  const totalLobbyingMeetings = lobbyingInfluence.reduce((sum, l) => sum + l.total_meetings, 0);
  const totalCampaignFunding = financeSummary.reduce((sum, f) => sum + f.total_received_chf, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          Conflict of Interest Detection
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Automated detection of potential conflicts between financial interests and voting behavior
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Total Conflict Flags</div>
              <div className="text-2xl font-bold text-red-600">{totalConflicts}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Lobbying Meetings</div>
              <div className="text-2xl font-bold text-blue-600">{totalLobbyingMeetings}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Campaign Funding</div>
              <div className="text-lg font-bold text-green-600">{formatCHF(totalCampaignFunding)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'risks', label: 'Risk Scores', icon: AlertTriangle },
            { id: 'lobbying', label: 'Lobbying Influence', icon: Users },
            { id: 'funding', label: 'Campaign Finance', icon: DollarSign }
          ].map((tab) => (
            <button
              key={tab.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      {/* Risk Scores */}
      {activeTab === 'risks' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Politician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conflict Flags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Positions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Compensation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lobbying Meetings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riskScores.filter(r => r.total_conflict_flags > 0).slice(0, 20).map((politician) => (
                <tr key={politician.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{politician.full_name}</div>
                      <div className="text-sm text-gray-500">{politician.canton}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getPartyColor(politician.party)}`}>
                      {politician.party}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-red-600">{politician.total_conflict_flags}</span>
                      {politician.total_conflict_flags > 10 && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                      {politician.high_severity_flags}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {politician.paid_interests_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCHF(politician.total_compensation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {politician.lobbying_meetings_count}
                  </td>
                </tr>
              ))}
              {riskScores.filter(r => r.total_conflict_flags > 0).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No conflict flags detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Lobbying Influence */}
      {activeTab === 'lobbying' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Meetings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Politicians Contacted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lobbyingInfluence.slice(0, 20).map((org) => (
                <tr key={org.organization_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{org.organization_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.industry_sector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-semibold text-gray-900">{org.total_meetings}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.unique_politicians_contacted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.total_minutes ? `${Math.round(org.total_minutes / 60)}h` : '-'}
                  </td>
                </tr>
              ))}
              {lobbyingInfluence.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No lobbying meetings recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaign Finance */}
      {activeTab === 'funding' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Politician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Raised
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Companies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anonymous
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financeSummary.slice(0, 30).map((finance) => (
                <tr key={`${finance.politician_id}-${finance.election_year}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{finance.full_name}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getPartyColor(finance.party)}`}>
                      {finance.party}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {finance.election_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      {formatCHF(finance.total_received_chf)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {formatCHF(finance.from_companies)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                    {formatCHF(finance.from_party)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCHF(finance.total_received_chf - finance.from_companies - finance.from_party - finance.from_individuals - finance.from_unions)}
                  </td>
                </tr>
              ))}
              {financeSummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No campaign finance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
