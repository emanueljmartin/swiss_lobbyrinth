import { useEffect, useState } from 'react';
import { Vote, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { fetchParliamentaryVotes, fetchVoteRecordsForVote, fetchPoliticians } from '../lib/queries';
import type { ParliamentaryVote, VoteRecord, Politician } from '../types';
import { VoteBadge, PartyBadge } from '../components/Badge';
import type { ViewType, PartyAffiliation } from '../types';

interface VotingRecordsProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export function VotingRecords({ onNavigate }: VotingRecordsProps) {
  const [votes, setVotes] = useState<ParliamentaryVote[]>([]);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [expandedVote, setExpandedVote] = useState<string | null>(null);
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [filterArea, setFilterArea] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [vts, pols] = await Promise.all([fetchParliamentaryVotes(), fetchPoliticians()]);
        setVotes(vts);
        setPoliticians(pols);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = async (voteId: string, dbId: string) => {
    if (expandedVote === voteId) {
      setExpandedVote(null);
      setVoteRecords([]);
      return;
    }
    setExpandedVote(voteId);
    setLoadingRecords(true);
    try {
      const records = await fetchVoteRecordsForVote(dbId);
      setVoteRecords(records);
    } finally {
      setLoadingRecords(false);
    }
  };

  const policyAreas = [...new Set(votes.map(v => v.policy_area).filter(Boolean))].sort() as string[];

  const filtered = votes.filter(v =>
    !filterArea || v.policy_area === filterArea
  );

  const getPoliticianForRecord = (politicianId: string) =>
    politicians.find(p => p.id === politicianId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      <div className="border-b border-slate-800 px-8 py-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">Parliamentary Voting Records</h1>
        <p className="text-slate-400 text-sm mt-1">
          Official voting records from the National Council and Council of States.
        </p>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filterArea}
            onChange={e => setFilterArea(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All policy areas</option>
            {policyAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <span className="text-slate-600 text-sm ml-auto">{filtered.length} votes</span>
        </div>

        {/* Vote list */}
        <div className="space-y-3">
          {filtered.map(vote => {
            const isExpanded = expandedVote === vote.vote_id;
            const totalVotes = vote.yes_count + vote.no_count + vote.abstain_count + vote.absent_count;
            const yesPercent = totalVotes > 0 ? (vote.yes_count / totalVotes) * 100 : 0;
            const noPercent = totalVotes > 0 ? (vote.no_count / totalVotes) * 100 : 0;

            return (
              <div
                key={vote.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full text-left p-5 hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(vote.vote_id, vote.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="text-white font-semibold">{vote.title_de}</span>
                        <VoteBadge result={vote.result === 'Accepted' ? 'YES' : 'NO'} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <Vote size={11} />
                        <span>{vote.vote_date}</span>
                        <span>·</span>
                        <span>{vote.chamber}</span>
                        {vote.vote_category && (
                          <>
                            <span>·</span>
                            <span>{vote.vote_category}</span>
                          </>
                        )}
                        {vote.policy_area && (
                          <>
                            <span>·</span>
                            <span className="text-blue-400">{vote.policy_area}</span>
                          </>
                        )}
                      </div>
                      {/* Vote bar */}
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-800">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${yesPercent}%` }} />
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${noPercent}%` }} />
                        <div className="bg-amber-500/60 h-full flex-1" />
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                        <span className="text-emerald-400">{vote.yes_count} YES</span>
                        <span className="text-rose-400">{vote.no_count} NO</span>
                        <span className="text-amber-400/70">{vote.abstain_count} ABSTAIN</span>
                        <span>{vote.absent_count} ABSENT</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-slate-600">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {/* Expanded records */}
                {isExpanded && (
                  <div className="border-t border-slate-800 px-5 pb-5 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={13} className="text-slate-500" />
                      <span className="text-slate-400 text-sm font-medium">Individual Votes</span>
                    </div>
                    {loadingRecords ? (
                      <div className="flex items-center gap-2 py-3 text-slate-500 text-sm">
                        <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading records…
                      </div>
                    ) : voteRecords.length === 0 ? (
                      <p className="text-slate-500 text-sm">No individual records available.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {voteRecords.map(vr => {
                          const pol = getPoliticianForRecord(vr.politician_id);
                          return (
                            <button
                              key={vr.id}
                              onClick={() => pol && onNavigate('profile', pol.id)}
                              className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 rounded-lg px-3 py-2.5 transition-colors group text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {pol && <PartyBadge party={pol.party as PartyAffiliation} />}
                                <span className="text-slate-300 text-xs font-medium group-hover:text-white truncate">
                                  {pol?.full_name ?? 'Unknown'}
                                </span>
                              </div>
                              <VoteBadge result={vr.vote_result} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
