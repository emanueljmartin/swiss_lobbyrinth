import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Briefcase, Award, Users, TrendingUp } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  importance_weight: number;
  description: string | null;
}

interface LobbyingMeeting {
  id: string;
  organization_name: string;
  meeting_type: string;
  subject: string;
  meeting_date: string;
  duration_minutes: number | null;
}

interface CampaignContribution {
  id: string;
  contributor_name: string;
  contributor_type: string;
  amount_chf: number;
  contribution_type: string;
  is_anonymous: boolean;
  election_year: number;
}

interface ConflictFlag {
  organization_name: string;
  role: string;
  compensation_chf: number;
  policy_area: string;
  conflict_severity: string;
  vote_date: string;
}

export default function CareerTimelineView({ politicianId }: { politicianId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [lobbying, setLobbying] = useState<LobbyingMeeting[]>([]);
  const [contributions, setContributions] = useState<CampaignContribution[]>([]);
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'career' | 'lobbying' | 'funding' | 'conflicts'>('career');

  useEffect(() => {
    if (politicianId) {
      fetchAllData();
    }
  }, [politicianId]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [milestonesRes, lobbyingRes, contributionsRes, conflictsRes] = await Promise.all([
        supabase
          .from('career_milestones')
          .select('*')
          .eq('politician_id', politicianId)
          .order('start_date', { ascending: false }),
        supabase
          .from('lobbying_meetings')
          .select('*')
          .eq('politician_id', politicianId)
          .order('meeting_date', { ascending: false })
          .limit(20),
        supabase
          .from('campaign_contributions')
          .select('*')
          .eq('politician_id', politicianId)
          .order('amount_chf', { ascending: false }),
        supabase
          .from('conflict_flags')
          .select('*')
          .eq('politician_id', politicianId)
          .order('compensation_chf', { ascending: false })
          .limit(10)
      ]);

      if (milestonesRes.data) setMilestones(milestonesRes.data);
      if (lobbyingRes.data) setLobbying(lobbyingRes.data);
      if (contributionsRes.data) setContributions(contributionsRes.data);
      if (conflictsRes.data) setConflicts(conflictsRes.data);
    } catch (error) {
      console.error('Error fetching career data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }

  function getMilestoneIcon(type: string) {
    switch (type) {
      case 'election_nationalrat':
      case 'election_staenderat':
      case 'election_federal_council':
        return <Award className="h-5 w-5 text-blue-500" />;
      case 'party_leadership':
      case 'party_join':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'board_position':
      case 'executive_position':
        return <Briefcase className="h-5 w-5 text-green-500" />;
      case 'committee_chair':
      case 'committee_join':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-500" />;
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

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {[
            { id: 'career', label: 'Career Timeline', icon: Calendar, count: milestones.length },
            { id: 'lobbying', label: 'Lobbying Meetings', icon: Users, count: lobbying.length },
            { id: 'funding', label: 'Campaign Funding', icon: TrendingUp, count: contributions.length },
            { id: 'conflicts', label: 'Conflicts', icon: Award, count: conflicts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Career Timeline */}
      {activeTab === 'career' && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="relative pl-10">
                <div className="absolute left-2 top-1 bg-white p-1 rounded-full">
                  {getMilestoneIcon(milestone.milestone_type)}
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{milestone.title}</h3>
                      {milestone.organization && (
                        <p className="text-sm text-gray-600">{milestone.organization}</p>
                      )}
                      {milestone.description && (
                        <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {formatDate(milestone.start_date)}
                        {milestone.end_date ? ` - ${formatDate(milestone.end_date)}` : milestone.is_current ? ' - Present' : ''}
                      </div>
                      {milestone.is_current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {milestones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No career milestones recorded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lobbying Meetings */}
      {activeTab === 'lobbying' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lobbying.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(meeting.meeting_date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {meeting.organization_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {meeting.meeting_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                    {meeting.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {meeting.duration_minutes ? `${meeting.duration_minutes} min` : '-'}
                  </td>
                </tr>
              ))}
              {lobbying.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No lobbying meetings recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaign Funding */}
      {activeTab === 'funding' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Campaign Contributions ({contributions.length} donations)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Total Received</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCHF(contributions.reduce((sum, c) => sum + c.amount_chf, 0))}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">From Companies</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCHF(contributions.filter(c => c.contributor_type === 'company').reduce((sum, c) => sum + c.amount_chf, 0))}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">From Party</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCHF(contributions.filter(c => c.contributor_type === 'party').reduce((sum, c) => sum + c.amount_chf, 0))}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Anonymous</div>
                <div className="text-lg font-bold text-gray-600">
                  {formatCHF(contributions.filter(c => c.is_anonymous).reduce((sum, c) => sum + c.amount_chf, 0))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.slice(0, 10).map((contrib) => (
                  <tr key={contrib.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {contrib.is_anonymous ? 'Anonymous Donor' : contrib.contributor_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {contrib.contributor_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCHF(contrib.amount_chf)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {contrib.election_year}
                    </td>
                  </tr>
                ))}
                {contributions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No campaign contributions recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conflict Flags */}
      {activeTab === 'conflicts' && (
        <div className="space-y-3">
          {conflicts.map((conflict, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(conflict.conflict_severity)}`}>
                    {conflict.conflict_severity} RISK
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {conflict.organization_name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCHF(conflict.compensation_chf)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Role:</span> {conflict.role}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Policy Area:</span> {conflict.policy_area}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Vote date: {formatDate(conflict.vote_date)}
              </div>
            </div>
          ))}
          {conflicts.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg">
              No potential conflicts detected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
