import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Users, Vote, ExternalLink, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchFullPoliticianProfile } from '../lib/queries';
import type { PoliticianProfile as Profile } from '../types';
import { PartyBadge, ConfidenceBadge, VoteBadge, MandateTypeBadge, SectorBadge } from '../components/Badge';
import { ProvenancePanel } from '../components/ProvenancePanel';
import type { Mandate } from '../types';
import type { ViewType } from '../types';

interface PoliticianProfileProps {
  politicianId: string;
  onNavigate: (view: ViewType, id?: string) => void;
}

export function PoliticianProfile({ politicianId, onNavigate }: PoliticianProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchFullPoliticianProfile(politicianId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [politicianId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Politician not found.</p>
      </div>
    );
  }

  const { politician, mandates, committee_memberships, vote_records, network_centrality } = profile;

  const mandatesBySector: Record<string, Mandate[]> = {};
  for (const m of mandates) {
    const sector = m.industry_sector ?? 'Other';
    if (!mandatesBySector[sector]) mandatesBySector[sector] = [];
    mandatesBySector[sector].push(m);
  }

  const voteYes = vote_records.filter(v => v.vote_result === 'YES').length;
  const voteNo = vote_records.filter(v => v.vote_result === 'NO').length;
  const voteTotal = vote_records.length;

  return (
    <div className="flex-1 overflow-auto bg-slate-950">
      {/* Back nav */}
      <div className="border-b border-slate-800 px-8 py-4 flex items-center gap-3">
        <button
          onClick={() => onNavigate('politicians')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={14} />
          Politicians
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-white text-sm font-medium">{politician.full_name}</span>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Profile header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start gap-5">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-slate-500">
                {politician.first_name?.[0] ?? '?'}{politician.last_name?.[0] ?? '?'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-white text-xl font-bold">{politician.full_name}</h1>
                <PartyBadge party={politician.party} size="md" />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap mb-3">
                <span>{politician.chamber}</span>
                <span className="text-slate-700">·</span>
                <span>Canton {politician.canton}</span>
                {politician.birth_year && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span>b. {politician.birth_year}</span>
                  </>
                )}
                {politician.term_start && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span>In office since {politician.term_start}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {politician.is_active && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={11} />
                    Active
                  </span>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Info size={11} />
                  Parliamentary ID: {politician.parliamentary_id}
                </span>
              </div>
            </div>

            {/* Network centrality metrics */}
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { label: 'Network Degree', value: network_centrality.degree, desc: 'Total connections' },
                { label: 'Mandates', value: network_centrality.mandateCount, desc: 'Outside roles' },
                { label: 'Committees', value: network_centrality.committeeCount, desc: 'Memberships' },
              ].map(m => (
                <div key={m.label} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-white">{m.value}</div>
                  <div className="text-xs font-medium text-slate-300 mt-0.5">{m.label}</div>
                  <div className="text-xs text-slate-600">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-950/30 border border-amber-900/40 px-4 py-3">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/60 text-sm leading-relaxed">
            The information on this page reflects publicly disclosed institutional affiliations and outside roles. Structural connections shown here do not imply any conflict of interest, wrongdoing, or improper conduct. All data is sourced from official Swiss parliamentary disclosures.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Mandates */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">Disclosed Mandates</h2>
                <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">{mandates.length}</span>
              </div>
            </div>

            {mandates.length === 0 ? (
              <p className="text-slate-500 text-sm">No mandates disclosed.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(mandatesBySector).map(([sector, sectorMandates]) => (
                  <div key={sector}>
                    <SectorBadge sector={sector} />
                    <div className="mt-2 space-y-2">
                      {sectorMandates.map(m => (
                        <div
                          key={m.id}
                          className="flex items-start justify-between gap-3 bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors cursor-pointer group"
                          onClick={() => setSelectedMandate(m)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors truncate">
                              {m.organization_name}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">{m.role_title}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <MandateTypeBadge type={m.mandate_type} />
                              {m.is_paid && (
                                <span className="text-xs text-amber-500/80">Paid</span>
                              )}
                              {m.start_date && (
                                <span className="text-xs text-slate-600">since {m.start_date.split('-')[0]}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 flex-shrink-0 mt-0.5">
                            <ConfidenceBadge score={m.confidence_score} />
                            <Info size={13} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Committee memberships */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-amber-400" />
                <h2 className="text-white font-semibold">Committee Memberships</h2>
                <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">{committee_memberships.length}</span>
              </div>
              {committee_memberships.length === 0 ? (
                <p className="text-slate-500 text-sm">No committee memberships found.</p>
              ) : (
                <div className="space-y-2">
                  {committee_memberships.map(cm => (
                    <div key={cm.id} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-200 text-sm font-medium">
                            {cm.committee?.abbreviation ?? 'Committee'}
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5 leading-tight">
                            {cm.committee?.name_de}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 capitalize">{cm.role}</span>
                        </div>
                      </div>
                      {cm.committee?.policy_area && (
                        <div className="text-xs text-slate-600 mt-1.5">{cm.committee.policy_area}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voting record */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Vote size={16} className="text-emerald-400" />
                <h2 className="text-white font-semibold">Voting Record</h2>
                <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">{voteTotal} votes</span>
              </div>

              {voteTotal > 0 && (
                <div className="flex gap-4 mb-4 bg-slate-800/50 rounded-lg p-3">
                  <div className="text-center flex-1">
                    <div className="text-emerald-400 text-xl font-bold">{voteYes}</div>
                    <div className="text-slate-500 text-xs">YES</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-rose-400 text-xl font-bold">{voteNo}</div>
                    <div className="text-slate-500 text-xs">NO</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-amber-400 text-xl font-bold">
                      {vote_records.filter(v => v.vote_result === 'ABSTAIN').length}
                    </div>
                    <div className="text-slate-500 text-xs">ABSTAIN</div>
                  </div>
                </div>
              )}

              {vote_records.length === 0 ? (
                <p className="text-slate-500 text-sm">No voting records found.</p>
              ) : (
                <div className="space-y-2">
                  {vote_records.slice(0, 6).map(vr => (
                    <div key={vr.id} className="flex items-start justify-between gap-3 bg-slate-800/50 rounded-lg p-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-xs leading-snug line-clamp-2">
                          {vr.parliamentary_vote?.title_de}
                        </div>
                        <div className="text-slate-600 text-xs mt-1">
                          {vr.parliamentary_vote?.vote_date} · {vr.parliamentary_vote?.policy_area}
                        </div>
                      </div>
                      <VoteBadge result={vr.vote_result} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Source attribution footer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
            <span>All data sourced from official parliamentary disclosures (Parlamentsdienste).</span>
            <a
              href="https://www.parlament.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 ml-1"
            >
              parlament.ch <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {selectedMandate && (
        <ProvenancePanel mandate={selectedMandate} onClose={() => setSelectedMandate(null)} />
      )}
    </div>
  );
}
