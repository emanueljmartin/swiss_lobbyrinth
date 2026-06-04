import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, GitMerge, Loader, Info } from 'lucide-react';

interface SimilarityRow {
  politician_a_id: string;
  politician_b_id: string;
  party_a: string;
  party_b: string;
  votes_compared: number;
  votes_aligned: number;
  similarity_score: number;
  is_cross_party: boolean;
  politician_a_name?: string;
  politician_b_name?: string;
}

// Fallback: compute similarity from vote_records in-app
interface VoteRecord {
  politician_id: string;
  parliamentary_vote_id: string;
  vote_result: string;
  politician?: { full_name: string; party: string };
}

function computeSimilarityFromRecords(records: VoteRecord[]): SimilarityRow[] {
  const voteMap: Record<string, Record<string, string>> = {};
  const nameMap: Record<string, string> = {};
  const partyMap: Record<string, string> = {};

  for (const r of records) {
    if (!voteMap[r.parliamentary_vote_id]) voteMap[r.parliamentary_vote_id] = {};
    voteMap[r.parliamentary_vote_id][r.politician_id] = r.vote_result;
    if (r.politician) {
      nameMap[r.politician_id] = r.politician.full_name;
      partyMap[r.politician_id] = r.politician.party;
    }
  }

  const pairMap: Record<string, { compared: number; aligned: number; a: string; b: string }> = {};

  for (const voteId of Object.keys(voteMap)) {
    const voters = Object.keys(voteMap[voteId]);
    for (let i = 0; i < voters.length; i++) {
      for (let j = i + 1; j < voters.length; j++) {
        const a = voters[i], b = voters[j];
        const key = a < b ? `${a}::${b}` : `${b}::${a}`;
        if (!pairMap[key]) pairMap[key] = { compared: 0, aligned: 0, a: a < b ? a : b, b: a < b ? b : a };
        pairMap[key].compared++;
        if (voteMap[voteId][a] === voteMap[voteId][b]) pairMap[key].aligned++;
      }
    }
  }

  return Object.values(pairMap)
    .filter(p => p.compared >= 3)
    .map(p => ({
      politician_a_id: p.a,
      politician_b_id: p.b,
      party_a: partyMap[p.a] ?? '?',
      party_b: partyMap[p.b] ?? '?',
      votes_compared: p.compared,
      votes_aligned: p.aligned,
      similarity_score: p.aligned / p.compared,
      is_cross_party: partyMap[p.a] !== partyMap[p.b],
      politician_a_name: nameMap[p.a],
      politician_b_name: nameMap[p.b],
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score);
}

const PARTY_COLOR: Record<string, string> = {
  SVP:   'bg-green-800 text-green-200',
  SP:    'bg-red-800 text-red-200',
  FDP:   'bg-blue-800 text-blue-200',
  Mitte: 'bg-amber-800 text-amber-200',
  GPS:   'bg-emerald-800 text-emerald-200',
  GLP:   'bg-teal-800 text-teal-200',
  EVP:   'bg-violet-800 text-violet-200',
};

function PartyBadge({ party }: { party: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PARTY_COLOR[party] ?? 'bg-slate-700 text-slate-300'}`}>
      {party}
    </span>
  );
}

function similarityBar(score: number) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? 'bg-red-500' : score >= 0.7 ? 'bg-orange-500' : score >= 0.55 ? 'bg-yellow-500' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${score >= 0.85 ? 'text-red-400' : score >= 0.7 ? 'text-orange-400' : score >= 0.55 ? 'text-yellow-400' : 'text-slate-500'}`}>
        {pct}%
      </span>
    </div>
  );
}

export function VotingSimilarityView() {
  const [pairs, setPairs] = useState<SimilarityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'cross-party' | 'all' | 'clusters'>('cross-party');
  const [partyFilter, setPartyFilter] = useState('');
  const [minSimilarity, setMinSimilarity] = useState(0.6);

  const load = useCallback(async () => {
    // Try pre-computed table first
    const { data: precomputed } = await supabase
      .from('voting_similarity')
      .select('*, politician_a:politicians!politician_a_id(full_name, party), politician_b:politicians!politician_b_id(full_name, party)')
      .gte('similarity_score', 0.5)
      .order('similarity_score', { ascending: false })
      .limit(500);

    if (precomputed && precomputed.length > 0) {
      const mapped = precomputed.map((r: Record<string, unknown>) => ({
        ...r,
        politician_a_name: (r.politician_a as { full_name: string } | null)?.full_name,
        politician_b_name: (r.politician_b as { full_name: string } | null)?.full_name,
        party_a: (r.politician_a as { party: string } | null)?.party ?? r.party_a,
        party_b: (r.politician_b as { party: string } | null)?.party ?? r.party_b,
      })) as SimilarityRow[];
      setPairs(mapped);
    } else {
      // Fall back to client-side computation from vote_records
      const { data: records } = await supabase
        .from('vote_records')
        .select('politician_id, parliamentary_vote_id, vote_result, politician:politicians(full_name, party)')
        .limit(5000);

      if (records) {
        const computed = computeSimilarityFromRecords(records as unknown as VoteRecord[]);
        setPairs(computed);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const parties = Array.from(new Set(pairs.flatMap(p => [p.party_a, p.party_b]))).sort();

  const filtered = pairs.filter(p => {
    if (p.similarity_score < minSimilarity) return false;
    if (tab === 'cross-party' && !p.is_cross_party) return false;
    if (partyFilter && p.party_a !== partyFilter && p.party_b !== partyFilter) return false;
    return true;
  });

  // Build coalition clusters: party-to-party avg similarity
  const partyPairMap: Record<string, { total: number; count: number }> = {};
  for (const p of pairs.filter(r => r.is_cross_party)) {
    const key = [p.party_a, p.party_b].sort().join('::');
    if (!partyPairMap[key]) partyPairMap[key] = { total: 0, count: 0 };
    partyPairMap[key].total += p.similarity_score;
    partyPairMap[key].count++;
  }
  const partyClusters = Object.entries(partyPairMap)
    .map(([key, v]) => ({ parties: key.split('::'), avgSimilarity: v.total / v.count, count: v.count }))
    .filter(c => c.count >= 2)
    .sort((a, b) => b.avgSimilarity - a.avgSimilarity);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader className="animate-spin text-slate-400" size={24} />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Voting Similarity Engine</h1>
        <p className="text-slate-400 text-sm">
          Identifies hidden voting alliances and unexpected cross-party alignment patterns.
          High cross-party similarity may indicate shared interest-group influence.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-2xl font-bold">{pairs.length.toLocaleString()}</div>
          <div className="text-sm text-slate-400 mt-0.5">MP pairs analyzed</div>
        </div>
        <div className="bg-slate-900 border border-orange-900/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-400">
            {pairs.filter(p => p.is_cross_party && p.similarity_score >= 0.8).length}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">High cross-party alignment</div>
          <div className="text-xs text-slate-500 mt-1">≥80% similarity, different parties</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{partyClusters.length}</div>
          <div className="text-sm text-slate-400 mt-0.5">Cross-party voting clusters</div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          Similarity score = fraction of shared votes cast the same way (YES/YES or NO/NO).
          Cross-party high scores are the most analytically interesting: they reveal hidden coalitions
          that don't follow party lines, often explained by shared sector interests or lobbying exposure.
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {(['cross-party', 'all', 'clusters'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t === 'cross-party' ? 'Cross-Party' : t === 'all' ? 'All Pairs' : 'Party Clusters'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={partyFilter}
            onChange={e => setPartyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All parties</option>
            {parties.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Min:</span>
            <input
              type="range" min="0.4" max="1" step="0.05"
              value={minSimilarity}
              onChange={e => setMinSimilarity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="w-8 text-white font-medium">{Math.round(minSimilarity * 100)}%</span>
          </div>
        </div>
      </div>

      {tab === 'clusters' ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Party-to-Party Voting Alignment
          </h2>
          {partyClusters.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500">
              No cross-party cluster data yet. Requires vote records with politician party data.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {partyClusters.map(c => (
                <div key={c.parties.join('-')} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <PartyBadge party={c.parties[0]} />
                    <GitMerge size={14} className="text-slate-500" />
                    <PartyBadge party={c.parties[1]} />
                  </div>
                  {similarityBar(c.avgSimilarity)}
                  <div className="text-xs text-slate-500 mt-2">{c.count} MP pairs · avg {(c.avgSimilarity * 100).toFixed(0)}% aligned</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filtered.length} pairs</span>
            {tab === 'cross-party' && (
              <span className="text-xs text-orange-400 flex items-center gap-1">
                <Users size={11} /> Showing only cross-party alignments
              </span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="text-left px-4 py-3">Politician A</th>
                <th className="text-left px-4 py-3">Politician B</th>
                <th className="text-center px-4 py-3">Votes</th>
                <th className="text-right px-4 py-3">Similarity</th>
                <th className="text-center px-4 py-3">Cross-party</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No pairs match the current filters. Try lowering the minimum similarity threshold.
                  </td>
                </tr>
              ) : filtered.slice(0, 100).map((p, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-white">{p.politician_a_name ?? p.politician_a_id.slice(0, 8)}</div>
                    <PartyBadge party={p.party_a} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-white">{p.politician_b_name ?? p.politician_b_id.slice(0, 8)}</div>
                    <PartyBadge party={p.party_b} />
                  </td>
                  <td className="px-4 py-2.5 text-center text-slate-400">{p.votes_compared}</td>
                  <td className="px-4 py-2.5 text-right">{similarityBar(p.similarity_score)}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.is_cross_party
                      ? <span className="text-xs px-2 py-0.5 bg-orange-900/40 text-orange-400 border border-orange-800 rounded">CROSS</span>
                      : <span className="text-xs text-slate-600">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <div className="px-4 py-3 text-center text-xs text-slate-500 border-t border-slate-800">
              Showing top 100 of {filtered.length} pairs. Narrow filters to see more specific results.
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        <TrendingUp size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-medium">Next step: </span>
          Cross-reference these high-similarity cross-party pairs with the
          Influence-to-Vote Correlation view to identify whether shared lobbying mandates
          in the same sector explain the alignment.
        </div>
      </div>
    </div>
  );
}
