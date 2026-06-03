import { useState, useEffect, Component, ReactNode } from 'react';
import { supabase } from './lib/supabase';
import InfluenceRankingsView from './views/InfluenceRankings';
import ConflictDashboardView from './views/ConflictDashboard';
import MonitoringDashboardView from './views/MonitoringDashboard';
import NetworkAnalysisView from './views/NetworkAnalysis';
import PolicyTimelineView from './views/PolicyTimeline';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
          <div className="max-w-md p-6 bg-slate-900 border border-red-700 rounded-lg">
            <h1 className="text-xl font-bold text-red-400 mb-2">Error</h1>
            <p className="text-sm text-slate-400 mb-4">An unexpected error occurred.</p>
            <pre className="text-xs bg-slate-950 p-2 rounded mb-4 overflow-auto max-h-40 text-red-300">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Modal System
interface ModalData {
  type: 'politician' | 'mandate' | 'vote' | 'conflict' | 'stat' | 'organization' | 'committee';
  title: string;
  data: unknown;
  source?: string;
  relatedCount?: number;
  details?: { label: string; value: string | number }[];
  children?: React.ReactNode;
}

function Modal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: ModalData | null }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{data.type}</div>
            <h2 className="text-xl font-bold">{data.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* Source Badge */}
          {data.source && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded">Data: {data.source}</span>
              {data.relatedCount !== undefined && (
                <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded">
                  {data.relatedCount} related records
                </span>
              )}
            </div>
          )}

          {/* Details Grid */}
          {data.details && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {data.details.map((d, i) => (
                <div key={i} className="p-3 bg-slate-800 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">{d.label}</div>
                  <div className="font-medium">{d.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Raw Data */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Underlying Data</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-slate-300">{JSON.stringify(data.data, null, 2)}</pre>
            </div>
          </div>

          {/* Custom Children */}
          {data.children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="text-xs text-slate-500">
            Research preview
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data.data, null, 2))}
              className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded transition"
            >
              Copy Data
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Types
interface Politician {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  party: string;
  chamber: string;
  canton: string;
  birth_year: number | null;
  gender: string | null;
  bio_summary: string | null;
}

interface Mandate {
  id: string;
  politician_id: string;
  organization_name: string;
  role_title: string;
  mandate_type: string;
  industry_sector: string | null;
  is_paid: boolean | null;
  compensation_range: string | null;
  is_current: boolean;
}

interface Vote {
  id: string;
  vote_id: string;
  title_de: string;
  vote_date: string;
  policy_area: string;
  result: string;
  yes_count: number;
  no_count: number;
}

interface VoteRecord {
  id: string;
  parliamentary_vote_id: string;
  politician_id: string;
  vote_result: string;
  parliamentary_vote?: Vote;
}

interface Committee {
  id: string;
  abbreviation: string;
  name_de: string;
  policy_area: string;
}

type ViewType = 'dashboard' | 'politicians' | 'profile' | 'network' | 'sectors' | 'votes' | 'search' | 'compare' | 'conflicts' | 'analytics' | 'map' | 'organizations' | 'parties' | 'committees' | 'influence' | 'risk-dashboard' | 'monitoring' | 'network-analysis' | 'policy-timeline';

// Statistics helper
function calculatePartyLoyalty(party: string, voteRecords: VoteRecord[], politicians: Politician[]): number {
  const partyPolIds = politicians.filter(p => p.party === party).map(p => p.id);
  const partyVotes = voteRecords.filter(v => partyPolIds.includes(v.politician_id));
  if (partyVotes.length === 0) return 0;

  // Calculate majority vote for each vote
  const voteGroups: Record<string, { yes: number; no: number }> = {};
  partyVotes.forEach(v => {
    if (!voteGroups[v.parliamentary_vote_id]) voteGroups[v.parliamentary_vote_id] = { yes: 0, no: 0 };
    if (v.vote_result === 'YES') voteGroups[v.parliamentary_vote_id].yes++;
    else if (v.vote_result === 'NO') voteGroups[v.parliamentary_vote_id].no++;
  });

  // Calculate alignment with party majority
  let aligned = 0;
  let total = 0;
  partyVotes.forEach(v => {
    const group = voteGroups[v.parliamentary_vote_id];
    if (group) {
      const majority = group.yes > group.no ? 'YES' : 'NO';
      if (v.vote_result === majority) aligned++;
      total++;
    }
  });

  return total > 0 ? Math.round((aligned / total) * 100) : 0;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedPoliticianId, setSelectedPoliticianId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = (view: ViewType, id?: string) => {
    setActiveView(view);
    if (id) setSelectedPoliticianId(id);
  };

  const showDetail = (data: ModalData) => {
    setModalData(data);
    setModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white flex-col">
      {/* Synthetic Data Warning Banner */}
      <div className="bg-amber-950 border-b border-amber-700 px-4 py-2">
        <div className="text-xs text-amber-200 font-medium">
          ⚠️ Research Preview: This application uses synthetic/prototype data for demonstration purposes only. Data does not represent actual Swiss parliamentary records.
        </div>
      </div>
      <div className="flex flex-1 overflow-auto">
        <Sidebar activeView={activeView} navigate={navigate} />
        <main className="flex-1 overflow-auto">
        {activeView === 'dashboard' && <DashboardView onNavigate={navigate} onShowDetail={showDetail} />}
        {activeView === 'politicians' && <PoliticiansView />}
        {activeView === 'profile' && selectedPoliticianId && <ProfileView politicianId={selectedPoliticianId} onShowDetail={showDetail} />}
        {activeView === 'network' && <NetworkGraphView onShowDetail={showDetail} />}
        {activeView === 'sectors' && <SectorsView onShowDetail={showDetail} />}
        {activeView === 'votes' && <VotesView onShowDetail={showDetail} />}
        {activeView === 'search' && <SearchView />}
        {activeView === 'organizations' && <OrganizationsView />}
        {activeView === 'parties' && <PartiesView />}
        {activeView === 'committees' && <CommitteesView />}
        {activeView === 'compare' && <CompareView compareIds={compareIds} setCompareIds={setCompareIds} />}
        {activeView === 'conflicts' && <ConflictsView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'map' && <CantonalMapView />}
        {activeView === 'influence' && <InfluenceRankingsView />}
        {activeView === 'risk-dashboard' && <ConflictDashboardView />}
        {activeView === 'monitoring' && <MonitoringDashboardView />}
        {activeView === 'network-analysis' && <NetworkAnalysisView />}
        {activeView === 'policy-timeline' && <PolicyTimelineView />}
      </main>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} data={modalData} />
      </div>
    </div>
  );
}

function Sidebar({ activeView, navigate }: { activeView: ViewType; navigate: (v: ViewType) => void }) {
  const [expandedProfiles, setExpandedProfiles] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'politicians', label: 'Politicians', icon: '👥' },
    { id: 'influence', label: 'Influence Rankings', icon: '🏆' },
    { id: 'risk-dashboard', label: 'Conflict Detector', icon: '🛡️' },
    { id: 'monitoring', label: 'Monitoring Alerts', icon: '📡' },
    { id: 'network-analysis', label: 'Network Analysis', icon: '🕸️' },
    { id: 'policy-timeline', label: 'Policy Timeline', icon: '📜' },
    { id: 'network', label: 'Network Graph', icon: '🔗' },
    { id: 'map', label: 'Cantonal Map', icon: '🗺️' },
    { id: 'sectors', label: 'Sector Analysis', icon: '🏭' },
    { id: 'votes', label: 'Voting Records', icon: '🗳️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'conflicts', label: 'Conflicts', icon: '⚠️' },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
    { id: 'search', label: 'Search', icon: '🔍' },
  ];

  const profileItems = [
    { id: 'organizations', label: 'Organizations', icon: '🏢' },
    { id: 'parties', label: 'Political Parties', icon: '🏛️' },
    { id: 'committees', label: 'Committees', icon: '📋' },
  ];

  return (
    <aside className="w-56 border-r border-slate-800 flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            CH
          </div>
          <div>
            <div className="text-sm font-semibold">Swiss Transparency</div>
            <div className="text-xs text-slate-500">Open Political Data</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id as ViewType)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
              activeView === item.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Profiles Section */}
        <div className="mt-4 mb-2">
          <button
            onClick={() => setExpandedProfiles(!expandedProfiles)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">👤</span>
              Profiles
            </span>
            <svg
              className={`w-4 h-4 transition ${expandedProfiles ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {expandedProfiles && (
            <div className="ml-2 mt-1 space-y-0.5">
              {profileItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id as ViewType)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="p-3 border-t border-slate-800 text-xs text-slate-600">
        <div className="font-medium mb-1">Research Status</div>
        <div>Prototype dataset</div>
      </div>
    </aside>
  );
}

function DashboardView({ onNavigate, onShowDetail }: { onNavigate: (view: ViewType) => void; onShowDetail: (data: ModalData) => void }) {
  const [stats, setStats] = useState({ politicians: 0, mandates: 0, votes: 0, committees: 0, conflicts: 0 });
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [recentVotes, setRecentVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, mRes, vRes, cRes] = await Promise.all([
          supabase.from('politicians').select('*').order('last_name'),
          supabase.from('mandates').select('*').eq('is_current', true),
          supabase.from('parliamentary_votes').select('*').order('vote_date', { ascending: false }).limit(6),
          supabase.from('committees').select('*'),
        ]);

        setPoliticians(pRes.data || []);
        setMandates(mRes.data || []);
        setRecentVotes(vRes.data || []);
        setStats({
          politicians: pRes.data?.length || 0,
          mandates: mRes.data?.length || 0,
          votes: vRes.data?.length || 0,
          committees: cRes.data?.length || 0,
          conflicts: 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const partyStats = politicians.reduce((acc, p) => {
    acc[p.party] = (acc[p.party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorStats = mandates.reduce((acc, m) => {
    const sector = m.industry_sector || 'Other';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMandateHolders = politicians
    .map(p => ({
      ...p,
      mandateCount: mandates.filter(m => m.politician_id === p.id).length
    }))
    .sort((a, b) => b.mandateCount - a.mandateCount)
    .slice(0, 5);

  const paidMandates = mandates.filter(m => m.is_paid).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Swiss Political Transparency
          </h1>
          <p className="text-slate-400 mt-1">Mapping structural relationships between politics, business, and institutions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('network')} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            View Network
          </button>
          <button onClick={() => onNavigate('conflicts')} className="px-4 py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition">
            Check Conflicts
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div onClick={() => onShowDetail({
          type: 'stat',
          title: 'All Politicians',
          source: 'politicians table',
          relatedCount: stats.politicians,
          data: politicians.slice(0, 10),
          details: [
            { label: 'Total Count', value: stats.politicians },
            { label: 'National Council', value: politicians.filter(p => p.chamber === 'National Council').length },
            { label: 'Council of States', value: politicians.filter(p => p.chamber === 'Council of States').length },
            { label: 'Parties', value: Object.keys(partyStats).length },
          ],
        })}>
          <StatCard title="Politicians" value={stats.politicians} color="blue" />
        </div>
        <div onClick={() => onShowDetail({
          type: 'stat',
          title: 'Outside Mandates',
          source: 'mandates table',
          relatedCount: stats.mandates,
          data: mandates.slice(0, 10),
          details: [
            { label: 'Total Count', value: stats.mandates },
            { label: 'Paid Positions', value: paidMandates },
            { label: 'Unpaid', value: stats.mandates - paidMandates },
            { label: 'Unique Orgs', value: new Set(mandates.map(m => m.organization_name)).size },
          ],
        })}>
          <StatCard title="Outside Mandates" value={stats.mandates} color="green" />
        </div>
        <div onClick={() => onShowDetail({
          type: 'stat',
          title: 'Committees',
          source: 'committees table',
          relatedCount: stats.committees,
          data: recentVotes,
          details: [
            { label: 'Total Committees', value: stats.committees },
            { label: 'Policy Areas', value: new Set(recentVotes.map(v => v.policy_area)).size },
          ],
        })}>
          <StatCard title="Committees" value={stats.committees} color="amber" />
        </div>
        <div onClick={() => onShowDetail({
          type: 'stat',
          title: 'Paid Positions',
          source: 'mandates where is_paid = true',
          relatedCount: paidMandates,
          data: mandates.filter(m => m.is_paid).slice(0, 10),
          details: [
            { label: 'Paid Mandates', value: paidMandates },
            { label: '% of Total', value: `${Math.round((paidMandates / stats.mandates) * 100)}%` },
          ],
        })}>
          <StatCard title="Paid Positions" value={paidMandates} color="purple" />
        </div>
        <div onClick={() => onShowDetail({
          type: 'stat',
          title: 'Recent Votes',
          source: 'parliamentary_votes table',
          relatedCount: stats.votes,
          data: recentVotes,
          details: [
            { label: 'Total Votes', value: stats.votes },
            { label: 'Accepted', value: recentVotes.filter(v => v.result === 'Accepted').length },
            { label: 'Rejected', value: recentVotes.filter(v => v.result === 'Rejected').length },
          ],
        })}>
          <StatCard title="Recent Votes" value={stats.votes} color="pink" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Party Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Party Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(partyStats)
              .sort((a, b) => b[1] - a[1])
              .map(([party, count]) => (
                <div
                  key={party}
                  onClick={() => onShowDetail({
                    type: 'stat',
                    title: `${party} Party Members`,
                    source: `politicians where party = '${party}'`,
                    relatedCount: count,
                    data: politicians.filter(p => p.party === party),
                    details: [
                      { label: 'Total Members', value: count },
                      { label: 'National Council', value: politicians.filter(p => p.party === party && p.chamber === 'National Council').length },
                      { label: 'Council of States', value: politicians.filter(p => p.party === party && p.chamber === 'Council of States').length },
                      { label: '% of Parliament', value: `${Math.round((count / stats.politicians) * 100)}%` },
                    ],
                  })}
                  className="flex items-center justify-between cursor-pointer hover:opacity-80 transition"
                >
                  <span className="text-sm font-medium">{party}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${(count / stats.politicians) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400 w-8">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Votes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Recent Parliament Votes
          </h3>
          <div className="space-y-2">
            {recentVotes.map(vote => (
              <div
                key={vote.id}
                onClick={() => onShowDetail({
                  type: 'vote',
                  title: vote.title_de,
                  source: `parliamentary_votes id: ${vote.id}`,
                  data: vote,
                  details: [
                    { label: 'Vote ID', value: vote.vote_id },
                    { label: 'Date', value: vote.vote_date },
                    { label: 'Area', value: vote.policy_area },
                    { label: 'Result', value: vote.result },
                    { label: 'Yes Votes', value: vote.yes_count },
                    { label: 'No Votes', value: vote.no_count },
                    { label: 'Yes %', value: `${((vote.yes_count / (vote.yes_count + vote.no_count)) * 100).toFixed(1)}%` },
                  ],
                })}
                className="p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[180px]">{vote.title_de}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    vote.result === 'Accepted' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {vote.result}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {vote.yes_count}-{vote.no_count} • {vote.policy_area}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Mandate Sectors
          </h3>
          <div className="space-y-2">
            {Object.entries(sectorStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([sector, count]) => (
                <div
                  key={sector}
                  onClick={() => onShowDetail({
                    type: 'stat',
                    title: `${sector} Mandates`,
                    source: `mandates where industry_sector = '${sector}'`,
                    relatedCount: count,
                    data: mandates.filter(m => m.industry_sector === sector),
                    details: [
                      { label: 'Total', value: count },
                      { label: 'Paid', value: mandates.filter(m => m.industry_sector === sector && m.is_paid).length },
                      { label: '% of All', value: `${Math.round((count / mandates.length) * 100)}%` },
                    ],
                  })}
                  className="flex items-center justify-between text-sm cursor-pointer hover:opacity-80 transition"
                >
                  <span className="text-slate-400">{sector}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(count / mandates.length) * 100}%` }} />
                    </div>
                    <span className="text-slate-300 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Mandate Holders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Most Outside Mandates</h3>
        <div className="grid grid-cols-5 gap-4">
          {topMandateHolders.map(p => (
            <div
              key={p.id}
              onClick={() => onShowDetail({
                type: 'politician',
                title: p.full_name,
                source: `politicians id: ${p.id}`,
                relatedCount: p.mandateCount,
                data: p,
                details: [
                  { label: 'ID', value: p.id.slice(0, 8) },
                  { label: 'Party', value: p.party },
                  { label: 'Chamber', value: p.chamber },
                  { label: 'Canton', value: p.canton },
                  { label: 'Mandates', value: p.mandateCount },
                ],
                children: (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Mandates</h4>
                    <div className="space-y-1">
                      {mandates.filter(m => m.politician_id === p.id).slice(0, 5).map(m => (
                        <div key={m.id} className="text-xs p-2 bg-slate-800 rounded">
                          <div className="font-medium">{m.organization_name}</div>
                          <div className="text-slate-500">{m.role_title} {m.is_paid ? '(paid)' : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              })}
              className="p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition group"
            >
              <div className="font-medium group-hover:text-blue-400 transition">{p.full_name}</div>
              <div className="text-xs text-slate-400">{p.party} • {p.canton}</div>
              <div className="text-3xl font-bold text-blue-400 mt-2">{p.mandateCount}</div>
              <div className="text-xs text-slate-500">mandates</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    amber: 'from-amber-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-rose-500',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5`}></div>
      <div className="relative">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-slate-500 text-sm">{title}</div>
      </div>
    </div>
  );
}

function PoliticiansView() {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandateCounts, setMandateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    party: '',
    chamber: '',
    canton: '',
    gender: ''
  });

  // Sort state
  const [sortField, setSortField] = useState('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*').order('last_name'),
      supabase.from('mandates').select('politician_id'),
    ]).then(([pRes, mRes]) => {
      setPoliticians(pRes.data || []);
      const counts: Record<string, number> = {};
      mRes.data?.forEach(m => {
        counts[m.politician_id] = (counts[m.politician_id] || 0) + 1;
      });
      setMandateCounts(counts);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  // Get unique values for filters
  const parties = [...new Set(politicians.map(p => p.party))].sort();
  const cantons = [...new Set(politicians.map(p => p.canton))].sort();

  // Apply filters
  const filtered = politicians.filter(p =>
    (p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.party.toLowerCase().includes(search.toLowerCase())) &&
    (!filters.party || p.party === filters.party) &&
    (!filters.chamber || p.chamber === filters.chamber) &&
    (!filters.canton || p.canton === filters.canton) &&
    (!filters.gender || p.gender === filters.gender)
  );

  // Apply sorting
  const sorted = filtered.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aVal: any = a[sortField as keyof Politician];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bVal: any = b[sortField as keyof Politician];

    // Handle mandate count sorting
    if (sortField === 'mandate_count') {
      aVal = mandateCounts[a.id] || 0;
      bVal = mandateCounts[b.id] || 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const partyColors: Record<string, string> = {
    SVP: 'bg-green-600', SP: 'bg-red-600', FDP: 'bg-blue-600',
    Mitte: 'bg-orange-600', GPS: 'bg-emerald-600', GLP: 'bg-lime-600',
  };

  const clearFilters = () => {
    setFilters({ party: '', chamber: '', canton: '', gender: '' });
    setSearch('');
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length + (search ? 1 : 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Politicians ({sorted.length})</h1>
      </div>

      {/* Filter & Sort Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <input
            type="text"
            placeholder="Search by name or party..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />

          <select
            value={filters.party}
            onChange={e => setFilters({ ...filters, party: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          >
            <option value="">All Parties</option>
            {parties.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filters.chamber}
            onChange={e => setFilters({ ...filters, chamber: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          >
            <option value="">Both Chambers</option>
            <option value="National Council">National Council</option>
            <option value="Council of States">Council of States</option>
          </select>

          <select
            value={filters.canton}
            onChange={e => setFilters({ ...filters, canton: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          >
            <option value="">All Cantons</option>
            {cantons.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filters.gender}
            onChange={e => setFilters({ ...filters, gender: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          >
            <option value="">All Genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition"
              >
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort by:</span>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1"
            >
              <option value="last_name">Name</option>
              <option value="party">Party</option>
              <option value="canton">Canton</option>
              <option value="mandate_count">Mandate Count</option>
              <option value="birth_year">Birth Year</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition"
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg className={`w-4 h-4 transition ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {sorted.map(p => (
          <div
            key={p.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold">{p.full_name}</div>
                <div className="text-xs text-slate-400">{p.chamber}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${partyColors[p.party] || 'bg-slate-700'} text-white`}>
                {p.party}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span>{p.canton}</span>
              <span className={mandateCounts[p.id] > 2 ? 'text-amber-400 font-medium' : ''}>
                {mandateCounts[p.id] || 0} mandates
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileView({ politicianId }: { politicianId: string; onShowDetail: (data: ModalData) => void }) {
  const [data, setData] = useState<{
    politician: Politician | null;
    mandates: Mandate[];
    votes: VoteRecord[];
    committees: { committee: Committee; role: string }[];
  }>({ politician: null, mandates: [], votes: [], committees: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*').eq('id', politicianId).single(),
      supabase.from('mandates').select('*').eq('politician_id', politicianId),
      supabase.from('vote_records').select('*, parliamentary_vote:parliamentary_votes(*)').eq('politician_id', politicianId).limit(10),
      supabase.from('committee_memberships').select('*, committee:committees(*)').eq('politician_id', politicianId),
    ]).then(([pRes, mRes, vRes, cRes]) => {
      setData({
        politician: pRes.data,
        mandates: mRes.data || [],
        votes: vRes.data || [],
        committees: (cRes.data || []).map(c => ({
          committee: c.committee as Committee,
          role: c.role,
        })),
      });
      setLoading(false);
    });
  }, [politicianId]);

  if (loading) return <LoadingSpinner />;
  if (!data.politician) return <div className="p-6">Not found</div>;

  const partyColors: Record<string, string> = {
    SVP: 'from-green-600 to-emerald-600',
    SP: 'from-red-600 to-rose-600',
    FDP: 'from-blue-600 to-cyan-600',
    Mitte: 'from-orange-600 to-amber-600',
    GPS: 'from-emerald-600 to-green-600',
    GLP: 'from-lime-600 to-green-600',
  };

  const paidMandates = data.mandates.filter(m => m.is_paid);
  const totalPaid = paidMandates.reduce((sum, m) => {
    const range = m.compensation_range || '';
    const low = parseInt(range.split('-')[0].replace(/\D/g, '')) || 0;
    return sum + low * 1000;
  }, 0);

  return (
    <div className="p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${partyColors[data.politician.party] || 'from-slate-600 to-slate-700'} flex items-center justify-center text-2xl font-bold shadow-lg`}>
            {data.politician.first_name[0]}{data.politician.last_name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{data.politician.full_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-slate-800 rounded-lg text-sm font-medium">{data.politician.party}</span>
              <span className="text-slate-400">{data.politician.chamber}</span>
              <span className="text-slate-400">Canton {data.politician.canton}</span>
            </div>
            {data.politician.bio_summary && (
              <p className="text-slate-400 mt-3 max-w-2xl">{data.politician.bio_summary}</p>
            )}
          </div>
          <div className="text-right space-y-2">
            <div>
              <div className="text-3xl font-bold text-blue-400">{data.mandates.length}</div>
              <div className="text-xs text-slate-500">Mandates</div>
            </div>
            {totalPaid > 0 && (
              <div>
                <div className="text-lg font-bold text-amber-400">CHF {totalPaid.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Annual (est.)</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-4">Outside Mandates & Board Positions</h2>
            <div className="space-y-2">
              {data.mandates.length === 0 ? (
                <p className="text-slate-500 text-sm">No outside mandates declared</p>
              ) : (
                data.mandates.map(m => (
                  <div key={m.id} className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{m.organization_name}</div>
                        <div className="text-sm text-slate-400">{m.role_title}</div>
                      </div>
                      {m.is_paid && (
                        <span className="px-2 py-1 bg-amber-900/50 text-amber-300 rounded text-xs">
                          {m.compensation_range}
                        </span>
                      )}
                    </div>
                    {m.industry_sector && (
                      <div className="text-xs text-slate-500 mt-1">{m.industry_sector}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4">Voting Record</h2>
            <div className="space-y-2">
              {data.votes.slice(0, 6).map(v => (
                <div key={v.id} className="p-2 bg-slate-800 rounded-lg text-sm flex justify-between">
                  <span className="truncate max-w-[300px]">{v.parliamentary_vote?.title_de}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    v.vote_result === 'YES' ? 'bg-green-900/50 text-green-400' :
                    v.vote_result === 'NO' ? 'bg-red-900/50 text-red-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {v.vote_result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {data.committees.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
              <h2 className="font-semibold mb-4">Committee Assignments</h2>
              <div className="space-y-2">
                {data.committees.map(c => (
                  <div key={c.committee.id} className="p-2 bg-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{c.committee.abbreviation}</div>
                      <div className="text-xs text-slate-400">{c.committee.policy_area}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Quick Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Birth Year</span>
                <span>{data.politician.birth_year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gender</span>
                <span>{data.politician.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid Mandates</span>
                <span className="text-amber-400">{paidMandates.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vote Participation</span>
                <span>{Math.round((data.votes.length / 10) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkGraphView({ onShowDetail }: { onShowDetail: (data: ModalData) => void }) {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*'),
      supabase.from('mandates').select('*'),
    ]).then(([pRes, mRes]) => {
      setPoliticians(pRes.data || []);
      setMandates(mRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const orgMap = mandates.reduce((acc, m) => {
    if (!acc[m.organization_name]) acc[m.organization_name] = [];
    acc[m.organization_name].push(m.politician_id);
    return acc;
  }, {} as Record<string, string[]>);

  const connections = Object.entries(orgMap)
    .filter(([, ids]) => ids.length > 1)
    .map(([org, ids]) => ({
      org,
      politicians: ids.map(id => politicians.find(p => p.id === id)).filter(Boolean) as Politician[],
      mandateDetails: ids.map(id => mandates.find(m => m.politician_id === id && m.organization_name === org)).filter(Boolean) as Mandate[],
    }))
    .sort((a, b) => b.politicians.length - a.politicians.length)
    .slice(0, 20);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Influence Network</h1>
      <p className="text-slate-400 mb-6">Shared board memberships showing structural connections between politicians. Click any organization for details.</p>

      <div className="grid grid-cols-3 gap-4">
        {connections.map(({ org, politicians: pols, mandateDetails }) => (
          <div
            key={org}
            onClick={() => onShowDetail({
              type: 'organization',
              title: org,
              source: `mandates where organization_name = '${org}'`,
              relatedCount: pols.length,
              data: {
                organization: org,
                politicians: pols,
                mandates: mandateDetails,
              },
              details: [
                { label: 'Politicians', value: pols.length },
                { label: 'Sector', value: mandateDetails[0]?.industry_sector || 'N/A' },
                { label: 'Paid Positions', value: mandateDetails.filter(m => m.is_paid).length },
              ],
              children: (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Connected Politicians</h4>
                  <div className="space-y-2">
                    {pols.map(p => {
                      const m = mandateDetails.find(md => md.politician_id === p.id);
                      return (
                        <div key={p.id} className="p-2 bg-slate-800 rounded text-sm">
                          <div className="font-medium">{p.full_name}</div>
                          <div className="text-slate-400">{p.party} • {p.canton}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Role: {m?.role_title} {m?.is_paid ? '(paid)' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            })}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:bg-slate-800 hover:border-blue-700 transition"
          >
            <div className="font-medium mb-3">{org}</div>
            <div className="space-y-1">
              {pols.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{p.full_name}</span>
                  <span className="text-slate-500">({p.party})</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-500">
              {pols.length} shared members
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Network Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div
            onClick={() => onShowDetail({
              type: 'stat',
              title: 'Total Mandates',
              source: 'mandates table',
              data: { count: mandates.length },
              details: [
                { label: 'Total', value: mandates.length },
                { label: 'Paid', value: mandates.filter(m => m.is_paid).length },
              ],
            })}
            className="text-center cursor-pointer hover:opacity-80"
          >
            <div className="text-3xl font-bold text-blue-400">{mandates.length}</div>
            <div className="text-sm text-slate-500">Total Mandates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{Object.keys(orgMap).length}</div>
            <div className="text-sm text-slate-500">Organizations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">{connections.length}</div>
            <div className="text-sm text-slate-500">Shared Orgs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {Math.max(...connections.map(c => c.politicians.length))}
            </div>
            <div className="text-sm text-slate-500">Max Connection</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictsView() {
  const [conflicts, setConflicts] = useState<{
    politician: Politician;
    sector: string;
    org: string;
    votetitle: string;
    mandate: Mandate;
    voteRecord: VoteRecord;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*'),
      supabase.from('mandates').select('*'),
      supabase.from('vote_records').select('*, parliamentary_vote:parliamentary_votes(*)'),
    ]).then(([pRes, mRes, vRes]) => {
      const politicians = pRes.data || [];
      const mandates = mRes.data || [];
      const votes = vRes.data || [];

      // Find conflicts: politician has mandate in sector affected by vote
      const foundConflicts: typeof conflicts = [];
      votes.forEach(v => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vote = v.parliamentary_vote as any;
        if (!vote) return;
        const pol = politicians.find(p => p.id === v.politician_id);
        if (!pol) return;

        // Check if politician has mandate in affected sector
        const relevantMandates = mandates.filter(m =>
          m.politician_id === pol.id &&
          m.industry_sector?.toLowerCase().includes(vote.policy_area?.toLowerCase() || '')
        );

        relevantMandates.forEach(m => {
          foundConflicts.push({
            politician: pol,
            sector: m.industry_sector || 'Unknown',
            org: m.organization_name,
            votetitle: vote.title_de,
            mandate: m,
            voteRecord: v,
          });
        });
      });

      setConflicts(foundConflicts.slice(0, 30));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-5 mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="text-amber-500">⚠️</span> Potential Conflicts of Interest
        </h1>
        <p className="text-slate-300">
          Politicians who voted on issues while holding mandates in affected sectors. Click any conflict for full details.
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-medium">No conflicts detected</div>
          <div className="text-slate-500 mt-1">All votes appear to be without mandate conflicts</div>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{c.politician.full_name} ({c.politician.party})</div>
                <div className="text-sm text-slate-400 mt-1">{c.votetitle}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-amber-400">{c.org}</div>
                <div className="text-xs text-slate-500">{c.sector}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsView() {
  const [data, setData] = useState<{
    politicians: Politician[];
    mandates: Mandate[];
    votes: VoteRecord[];
  }>({ politicians: [], mandates: [], votes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*'),
      supabase.from('mandates').select('*'),
      supabase.from('vote_records').select('*, parliamentary_vote:parliamentary_votes(*)'),
    ]).then(([pRes, mRes, vRes]) => {
      setData({
        politicians: pRes.data || [],
        mandates: mRes.data || [],
        votes: vRes.data || [],
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const parties = ['SVP', 'SP', 'FDP', 'Mitte', 'GPS', 'GLP'];
  const loyaltyScores = parties.map(p => ({
    party: p,
    loyalty: calculatePartyLoyalty(p, data.votes, data.politicians),
    members: data.politicians.filter(pol => pol.party === p).length,
  }));

  const avgMandatesPerParty = parties.map(p => {
    const partyPols = data.politicians.filter(pol => pol.party === p);
    const partyMandates = data.mandates.filter(m => partyPols.some(pol => pol.id === m.politician_id));
    return {
      party: p,
      avg: partyPols.length > 0 ? (partyMandates.length / partyPols.length).toFixed(1) : '0',
    };
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics & Insights</h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Party Loyalty */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Party Loyalty Score</h3>
          <div className="space-y-3">
            {loyaltyScores.map(l => (
              <div key={l.party} className="flex items-center justify-between">
                <span className="text-sm">{l.party}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${l.loyalty}%` }} />
                  </div>
                  <span className="text-sm w-10">{l.loyalty}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mandates per Party */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Avg Mandates per Party</h3>
          <div className="space-y-3">
            {avgMandatesPerParty.map(m => (
              <div key={m.party} className="flex items-center justify-between">
                <span className="text-sm">{m.party}</span>
                <span className="text-lg font-bold text-blue-400">{m.avg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {['M', 'F'].map(g => {
              const count = data.politicians.filter(p => p.gender === g).length;
              return (
                <div key={g} className="flex items-center justify-between">
                  <span className="text-sm">{g === 'M' ? 'Male' : 'Female'}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Organizations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Most Popular Organizations</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(data.mandates.reduce((acc, m) => {
            acc[m.organization_name] = (acc[m.organization_name] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([org, count]) => (
              <div key={org} className="p-3 bg-slate-800 rounded-lg">
                <div className="font-medium text-sm truncate">{org}</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function CantonalMapView() {
  const [data, setData] = useState<{ canton: string; count: number; parties: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('politicians').select('*').then(({ data: pols }) => {
      const byCanton = (pols || []).reduce((acc, p) => {
        if (!acc[p.canton]) {
          acc[p.canton] = { count: 0, parties: {} };
        }
        acc[p.canton]!.count++;
        acc[p.canton]!.parties[p.party] = (acc[p.canton]!.parties[p.party] || 0) + 1;
        return acc;
      }, {} as Record<string, { count: number; parties: Record<string, number> }>);

      setData(Object.entries(byCanton).map(([canton, stats]) => ({
        canton,
        count: (stats as { count: number; parties: Record<string, number> }).count,
        parties: (stats as { count: number; parties: Record<string, number> }).parties,
      })));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cantonal Distribution</h1>
      <div className="grid grid-cols-5 gap-3">
        {data.sort((a, b) => b.count - a.count).map(c => (
          <div key={c.canton} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="font-medium">{c.canton}</div>
            <div className="text-3xl font-bold text-blue-400 my-2">{c.count}</div>
            <div className="text-xs text-slate-500">politicians</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {Object.entries(c.parties).slice(0, 5).map(([party, count]) => (
                <span key={party} className="text-xs px-1.5 py-0.5 bg-slate-800 rounded">{party}: {count}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareView({ compareIds, setCompareIds }: { compareIds: string[]; setCompareIds: (ids: string[]) => void }) {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Record<string, Mandate[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('politicians').select('*'),
      supabase.from('mandates').select('*'),
    ]).then(([pRes, mRes]) => {
      setPoliticians(pRes.data || []);
      const byPol: Record<string, Mandate[]> = {};
      (mRes.data || []).forEach(m => {
        byPol[m.politician_id] = byPol[m.politician_id] || [];
        byPol[m.politician_id].push(m);
      });
      setMandates(byPol);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const selected = politicians.filter(p => compareIds.includes(p.id)).slice(0, 3);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Compare Politicians</h1>

      <div className="mb-6">
        <select
          onChange={e => {
            if (e.target.value && !compareIds.includes(e.target.value) && compareIds.length < 3) {
              setCompareIds([...compareIds, e.target.value]);
            }
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        >
          <option value="">Add politician to compare...</option>
          {politicians.filter(p => !compareIds.includes(p.id)).map(p => (
            <option key={p.id} value={p.id}>{p.full_name} ({p.party})</option>
          ))}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {selected.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <button
                onClick={() => setCompareIds(compareIds.filter(id => id !== p.id))}
                className="float-right text-slate-500 hover:text-white"
              >
                ×
              </button>
              <div className="font-semibold text-lg">{p.full_name}</div>
              <div className="text-sm text-slate-400 mb-4">{p.party} • {p.canton}</div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chamber</span>
                  <span>{p.chamber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mandates</span>
                  <span className="text-blue-400 font-bold">{mandates[p.id]?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid</span>
                  <span className="text-amber-400">{mandates[p.id]?.filter(m => m.is_paid).length || 0}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 mb-2">Organizations</div>
                <div className="space-y-1">
                  {(mandates[p.id] || []).slice(0, 5).map(m => (
                    <div key={m.id} className="text-xs truncate">{m.organization_name}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SectorsView({ onShowDetail: _unused1 }: { onShowDetail: (data: ModalData) => void }) {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('mandates').select('*').then(({ data }) => {
      setMandates(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const sectorStats = mandates.reduce((acc, m) => {
    const sector = m.industry_sector || 'Other';
    if (!acc[sector]) acc[sector] = { count: 0, paid: 0 };
    acc[sector].count++;
    if (m.is_paid) acc[sector].paid++;
    return acc;
  }, {} as Record<string, { count: number; paid: number }>);

  const sorted = Object.entries(sectorStats).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sector Analysis</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Sectors" value={sorted.length} color="blue" />
        <StatCard title="Total Mandates" value={mandates.length} color="green" />
        <StatCard title="Paid Positions" value={mandates.filter(m => m.is_paid).length} color="amber" />
        <StatCard title="Unpaid" value={mandates.filter(m => !m.is_paid).length} color="purple" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              <th className="py-3 text-slate-400 text-sm">Sector</th>
              <th className="py-3 text-right text-slate-400 text-sm">Total</th>
              <th className="py-3 text-right text-slate-400 text-sm">Paid</th>
              <th className="py-3 text-right text-slate-400 text-sm">Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([sector, stats]) => (
              <tr key={sector} className="border-b border-slate-800/50">
                <td className="py-3">{sector}</td>
                <td className="text-right py-3">{stats.count}</td>
                <td className="text-right py-3">{stats.paid}</td>
                <td className="text-right py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(stats.count / mandates.length) * 100}%` }} />
                    </div>
                    <span className="text-sm text-slate-400 w-10">{((stats.count / mandates.length) * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VotesView({ onShowDetail: _unused2 }: { onShowDetail: (data: ModalData) => void }) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('parliamentary_votes').select('*').order('vote_date', { ascending: false }).then(({ data }) => {
      setVotes(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Parliamentary Votes</h1>
      <div className="space-y-4">
        {votes.map(vote => (
          <div key={vote.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">{vote.vote_id}</div>
                <h3 className="font-medium">{vote.title_de}</h3>
                <div className="text-sm text-slate-400 mt-1">{vote.policy_area}</div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                vote.result === 'Accepted' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {vote.result}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-sm">{vote.yes_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span className="text-sm">{vote.no_count}</span>
              </div>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${(vote.yes_count / (vote.yes_count + vote.no_count)) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-500">{vote.vote_date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ politicians: Politician[]; mandates: Mandate[] }>({ politicians: [], mandates: [] });
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (query.length < 2) return;
    const [pRes, mRes] = await Promise.all([
      supabase.from('politicians').select('*').ilike('full_name', `%${query}%`),
      supabase.from('mandates').select('*').ilike('organization_name', `%${query}%`),
    ]);
    setResults({ politicians: pRes.data || [], mandates: mRes.data || [] });
    setSearched(true);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search politicians or organizations..."
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl"
        />
        <button onClick={handleSearch} className="px-6 py-3 bg-blue-600 rounded-xl font-medium hover:bg-blue-700">
          Search
        </button>
      </div>

      {searched && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Politicians ({results.politicians.length})</h2>
            <div className="space-y-2">
              {results.politicians.map(p => (
                <div key={p.id} className="p-3 bg-slate-800 rounded-lg">
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-slate-400 ml-2">({p.party}, {p.canton})</span>
                </div>
              ))}
              {results.politicians.length === 0 && <p className="text-slate-500">No results</p>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Organizations ({results.mandates.length})</h2>
            <div className="space-y-2">
              {results.mandates.map(m => (
                <div key={m.id} className="p-3 bg-slate-800 rounded-lg">
                  <span className="font-medium">{m.organization_name}</span>
                  <span className="text-slate-400 ml-2">({m.industry_sector})</span>
                </div>
              ))}
              {results.mandates.length === 0 && <p className="text-slate-500">No results</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400">Loading data...</p>
      </div>
    </div>
  );
}

// Organizations View
function OrganizationsView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('organizations').select('*').order('name').then(({ data }) => {
      setOrganizations(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.industry_sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Organizations ({filtered.length})</h1>
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg w-80"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No organizations found</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(org => (
            <div
              key={org.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-700 hover:shadow-lg transition-all"
            >
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-4 py-3">
                <h3 className="font-semibold text-white">{org.name}</h3>
                {org.organization_type && (
                  <div className="text-xs text-slate-300 mt-1">{org.organization_type}</div>
                )}
              </div>
              <div className="p-4">
                {org.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{org.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {org.industry_sector && (
                    <div>
                      <div className="text-slate-500">Sector</div>
                      <div className="text-slate-300">{org.industry_sector}</div>
                    </div>
                  )}
                  {org.headquarters_canton && (
                    <div>
                      <div className="text-slate-500">HQ Canton</div>
                      <div className="text-slate-300">{org.headquarters_canton}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Political Parties View
function PartiesView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('political_parties').select('*').order('party_code').then(({ data }) => {
      setParties(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const positionColors: Record<string, string> = {
    'Far Left': 'from-red-800 to-red-700',
    'Left': 'from-red-600 to-orange-600',
    'Center Left': 'from-orange-600 to-amber-600',
    'Center': 'from-gray-600 to-slate-600',
    'Center Right': 'from-blue-700 to-cyan-600',
    'Right': 'from-green-700 to-emerald-600',
    'Far Right': 'from-green-900 to-emerald-800',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Political Parties ({parties.length})</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {parties.map(party => (
          <div
            key={party.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${positionColors[party.political_position] || 'from-slate-700 to-slate-600'} p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/70 uppercase tracking-wider mb-1">{party.party_code}</div>
                  <h3 className="text-xl font-bold text-white">{party.full_name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{party.parliamentary_group_size || 0}</div>
                  <div className="text-xs text-white/70">seats</div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {party.ideology && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500">Ideology:</span>
                  <span className="ml-2 text-sm text-slate-300">{party.ideology}</span>
                </div>
              )}
              {party.description && (
                <p className="text-sm text-slate-400 line-clamp-3 mb-3">{party.description}</p>
              )}
              {party.key_positions && party.key_positions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {party.key_positions.slice(0, 3).map((pos: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">
                      {pos}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Committees View
function CommitteesView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('committees').select('*').order('name_de').then(({ data }) => {
      setCommittees(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const chamberColors: Record<string, string> = {
    'National Council': 'from-blue-600 to-cyan-600',
    'Council of States': 'from-purple-600 to-indigo-600',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Parliamentary Committees ({committees.length})</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {committees.map(committee => (
          <div
            key={committee.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${chamberColors[committee.chamber] || 'from-slate-700 to-slate-600'} px-4 py-3`}>
              <div className="text-xs text-white/70">{committee.chamber}</div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{committee.name_de}</h3>
                <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
                  {committee.abbreviation}
                </span>
              </div>
              {committee.detailed_description && (
                <p className="text-sm text-slate-400 line-clamp-2">{committee.detailed_description}</p>
              )}
              {committee.policy_focus && committee.policy_focus.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {committee.policy_focus.slice(0, 3).map((area: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-cyan-900/30 text-cyan-300 rounded text-xs">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
