import { useEffect, useState } from 'react';
import { Layers, Info } from 'lucide-react';
import { fetchPoliticians, fetchAllMandates, fetchAllCommittees, fetchCommitteeMembershipsWithPolitician } from '../lib/queries';
import type { GraphData, GraphNode, GraphEdge, Politician, Mandate, CommitteeMembership } from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import type { ViewType } from '../types';

interface NetworkViewProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

type FilterMode = 'all' | 'politicians' | 'companies' | 'associations';

export function NetworkView({ onNavigate }: NetworkViewProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [memberships, setMemberships] = useState<CommitteeMembership[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [pols, mands, mems] = await Promise.all([
          fetchPoliticians(),
          fetchAllMandates(),
          fetchCommitteeMembershipsWithPolitician(),
        ]);
        setPoliticians(pols);
        setMandates(mands);
        setMemberships(mems);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (politicians.length === 0 && mandates.length === 0) return;
    buildGraph();
  }, [politicians, mandates, memberships, filter]);

  function buildGraph() {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Add politician nodes
    for (const p of politicians) {
      const mandateCount = mandates.filter(m => m.politician_id === p.id).length;
      nodeMap.set(`pol-${p.id}`, {
        id: `pol-${p.id}`,
        label: `${p.first_name} ${p.last_name.charAt(0)}.`,
        type: 'POLITICIAN',
        party: p.party,
        mandateCount,
        confidence: 0.97,
      });
    }

    // Add organization nodes and edges from mandates
    if (filter === 'all' || filter === 'companies' || filter === 'associations') {
      for (const m of mandates) {
        const orgId = `org-${m.organization_name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`;
        if (!nodeMap.has(orgId)) {
          const type = ['AG', 'SA', 'GmbH', 'Ltd', 'Inc', 'Group'].some(s => m.organization_name.includes(s))
            ? 'COMPANY'
            : ['verband', 'gewerkschaft', 'association', 'federation', 'union'].some(s =>
                m.organization_name.toLowerCase().includes(s)
              )
            ? 'ASSOCIATION'
            : 'FOUNDATION';

          if (filter === 'companies' && type !== 'COMPANY') continue;
          if (filter === 'associations' && type !== 'ASSOCIATION') continue;

          nodeMap.set(orgId, {
            id: orgId,
            label: m.organization_name.length > 20
              ? m.organization_name.slice(0, 18) + '…'
              : m.organization_name,
            type,
            sector: m.industry_sector,
            confidence: m.confidence_score,
          });
        }

        edges.push({
          id: `edge-${m.politician_id}-${orgId}`,
          source: `pol-${m.politician_id}`,
          target: orgId,
          type: m.mandate_type,
          label: m.role_title,
          weight: m.is_paid ? 2 : 1,
          confidence: m.confidence_score,
          is_current: m.is_current,
        });
      }
    }

    // Add committee nodes and edges
    if (filter === 'all') {
      for (const mem of memberships) {
        const comId = `com-${mem.committee_id}`;
        if (!nodeMap.has(comId)) {
          nodeMap.set(comId, {
            id: comId,
            label: mem.committee?.abbreviation ?? 'Committee',
            type: 'COMMITTEE',
            confidence: 1.0,
          });
        }
        edges.push({
          id: `edge-com-${mem.politician_id}-${mem.committee_id}`,
          source: `pol-${mem.politician_id}`,
          target: comId,
          type: 'SITS_ON_COMMITTEE',
          weight: 1,
          confidence: mem.confidence_score,
          is_current: mem.is_current,
        });
      }
    }

    setGraphData({ nodes: Array.from(nodeMap.values()), edges });
  }

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'POLITICIAN') {
      const polId = node.id.replace('pol-', '');
      onNavigate('profile', polId);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      <div className="border-b border-slate-800 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Influence Network Graph</h1>
            <p className="text-slate-400 text-sm mt-1">
              Interactive visualization of structural connections between politicians, companies, associations, and committees.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 p-1">
            {(['all', 'companies', 'associations'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All Entities' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Info bar */}
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
          <Layers size={12} />
          <span>{graphData.nodes.length} nodes</span>
          <span>·</span>
          <span>{graphData.edges.length} edges</span>
          <span>·</span>
          <span>Click politicians to view profile</span>
          <div className="ml-auto flex items-center gap-1.5 text-amber-500/70">
            <Info size={11} />
            <span>Edges represent disclosed structural relationships, not wrongdoing.</span>
          </div>
        </div>

        {loading ? (
          <div className="h-[540px] bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Building influence graph…</p>
            </div>
          </div>
        ) : (
          <NetworkGraph data={graphData} onNodeClick={handleNodeClick} height={540} />
        )}

        {/* Stats below graph */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Politician Nodes', value: graphData.nodes.filter(n => n.type === 'POLITICIAN').length, color: 'text-blue-400' },
            { label: 'Organization Nodes', value: graphData.nodes.filter(n => ['COMPANY', 'ASSOCIATION', 'FOUNDATION'].includes(n.type)).length, color: 'text-cyan-400' },
            { label: 'Committee Nodes', value: graphData.nodes.filter(n => n.type === 'COMMITTEE').length, color: 'text-amber-400' },
            { label: 'Relationship Edges', value: graphData.edges.length, color: 'text-slate-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
