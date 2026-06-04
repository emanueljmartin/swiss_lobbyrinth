import { supabase } from './supabase';
import type {
  Politician, Mandate, Committee, CommitteeMembership,
  ParliamentaryVote, VoteRecord, DataSource, IndustrySector,
  SectorExposure, PartyMandateStats, NetworkCentrality, PoliticianProfile,
  PartyAffiliation
} from '../types';

export async function fetchPoliticians(): Promise<Politician[]> {
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('is_active', true)
    .order('last_name');
  if (error) {
    console.error('fetchPoliticians error:', error);
    throw error;
  }
  return data ?? [];
}

export async function fetchPoliticianById(id: string): Promise<Politician | null> {
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMandatesForPolitician(politicianId: string): Promise<Mandate[]> {
  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('politician_id', politicianId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllMandates(): Promise<Mandate[]> {
  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('is_current', true);
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommitteeMemberships(politicianId: string): Promise<CommitteeMembership[]> {
  const { data, error } = await supabase
    .from('committee_memberships')
    .select(`
      *,
      committee:committees(*)
    `)
    .eq('politician_id', politicianId)
    .eq('is_current', true);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCommittees(): Promise<Committee[]> {
  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .order('name_de');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommitteeMembershipsWithPolitician(): Promise<CommitteeMembership[]> {
  const { data, error } = await supabase
    .from('committee_memberships')
    .select(`
      *,
      politician:politicians(*),
      committee:committees(*)
    `)
    .eq('is_current', true);
  if (error) throw error;
  return data ?? [];
}

export async function fetchParliamentaryVotes(): Promise<ParliamentaryVote[]> {
  const { data, error } = await supabase
    .from('parliamentary_votes')
    .select('*')
    .order('vote_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVoteRecordsForPolitician(politicianId: string): Promise<VoteRecord[]> {
  const { data, error } = await supabase
    .from('vote_records')
    .select(`
      *,
      parliamentary_vote:parliamentary_votes(*)
    `)
    .eq('politician_id', politicianId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVoteRecordsForVote(voteId: string): Promise<VoteRecord[]> {
  const { data, error } = await supabase
    .from('vote_records')
    .select(`
      *,
      politician:politicians(*)
    `)
    .eq('parliamentary_vote_id', voteId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDataSources(): Promise<DataSource[]> {
  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchIndustrySectors(): Promise<IndustrySector[]> {
  const { data, error } = await supabase
    .from('industry_sectors')
    .select('*')
    .order('name_de');
  if (error) throw error;
  return data ?? [];
}

export async function fetchFullPoliticianProfile(id: string): Promise<PoliticianProfile | null> {
  const [politician, mandates, committeeMemberships, voteRecords] = await Promise.all([
    fetchPoliticianById(id),
    fetchMandatesForPolitician(id),
    fetchCommitteeMemberships(id),
    fetchVoteRecordsForPolitician(id),
  ]);

  if (!politician) return null;

  const network_centrality: NetworkCentrality = {
    politician_id: id,
    politician_name: politician.full_name,
    degree: mandates.length + committeeMemberships.length,
    betweenness: Math.min(1, (mandates.length * 0.15 + committeeMemberships.length * 0.1)),
    eigenvector: Math.min(1, mandates.length * 0.08),
    mandateCount: mandates.length,
    committeeCount: committeeMemberships.length,
  };

  return { politician, mandates, committee_memberships: committeeMemberships, vote_records: voteRecords, network_centrality };
}

export async function computeSectorExposure(mandates: Mandate[]): Promise<SectorExposure[]> {
  const sectorMap: Record<string, { count: number; politicians: Set<string> }> = {};
  const sectors = await fetchIndustrySectors();
  const sectorColors: Record<string, string> = {};
  for (const s of sectors) {
    sectorColors[s.name_de] = s.color_hex;
  }

  for (const m of mandates) {
    if (!m.industry_sector) continue;
    if (!sectorMap[m.industry_sector]) {
      sectorMap[m.industry_sector] = { count: 0, politicians: new Set() };
    }
    sectorMap[m.industry_sector].count++;
    sectorMap[m.industry_sector].politicians.add(m.politician_id);
  }

  const total = Object.values(sectorMap).reduce((acc, v) => acc + v.count, 0);
  return Object.entries(sectorMap)
    .map(([sector, val]) => ({
      sector,
      count: val.count,
      percentage: total > 0 ? (val.count / total) * 100 : 0,
      color: sectorColors[sector] ?? '#6B7280',
      politicians: Array.from(val.politicians),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function computePartyStats(
  politicians: Politician[],
  mandates: Mandate[]
): Promise<PartyMandateStats[]> {
  const partyMap: Record<string, { ids: string[]; mandates: Mandate[] }> = {};

  for (const p of politicians) {
    if (!partyMap[p.party]) partyMap[p.party] = { ids: [], mandates: [] };
    partyMap[p.party].ids.push(p.id);
  }

  for (const m of mandates) {
    for (const [, val] of Object.entries(partyMap)) {
      if (val.ids.includes(m.politician_id)) {
        val.mandates.push(m);
        break;
      }
    }
  }

  return Object.entries(partyMap).map(([party, val]) => {
    const sectorCount: Record<string, number> = {};
    for (const m of val.mandates) {
      if (m.industry_sector) {
        sectorCount[m.industry_sector] = (sectorCount[m.industry_sector] ?? 0) + 1;
      }
    }
    const topSectors = Object.entries(sectorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    return {
      party: party as PartyAffiliation,
      totalMandates: val.mandates.length,
      avgMandatesPerPolitician: val.ids.length > 0 ? val.mandates.length / val.ids.length : 0,
      paidMandates: val.mandates.filter(m => m.is_paid).length,
      unpaidMandates: val.mandates.filter(m => !m.is_paid).length,
      topSectors,
    };
  }).sort((a, b) => b.totalMandates - a.totalMandates);
}

export async function computeNetworkCentrality(
  politicians: Politician[],
  mandates: Mandate[],
  memberships: CommitteeMembership[]
): Promise<NetworkCentrality[]> {
  return politicians.map(p => {
    const pMandates = mandates.filter(m => m.politician_id === p.id);
    const pMemberships = memberships.filter(m => m.politician_id === p.id);
    const degree = pMandates.length + pMemberships.length;

    return {
      politician_id: p.id,
      politician_name: p.full_name,
      degree,
      betweenness: Math.min(1, degree * 0.08),
      eigenvector: Math.min(1, pMandates.length * 0.07),
      mandateCount: pMandates.length,
      committeeCount: pMemberships.length,
    };
  }).sort((a, b) => b.degree - a.degree);
}

export async function searchEntities(query: string): Promise<{ id: string; name: string; type: string; subtitle: string }[]> {
  if (query.length < 2) return [];

  // Escape ilike special characters to prevent pattern injection
  const safeQuery = query.replace(/[%_]/g, '\\$&');

  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, full_name, party, chamber, canton')
    .eq('is_active', true)
    .ilike('full_name', `%${safeQuery}%`)
    .limit(5);

  const { data: entities } = await supabase
    .from('entities')
    .select('id, canonical_name, entity_type')
    .ilike('canonical_name', `%${safeQuery}%`)
    .in('entity_type', ['COMPANY', 'ASSOCIATION', 'FOUNDATION', 'COMMITTEE'])
    .limit(5);

  const results: { id: string; name: string; type: string; subtitle: string }[] = [];

  for (const p of politicians ?? []) {
    results.push({
      id: p.id,
      name: p.full_name,
      type: 'POLITICIAN',
      subtitle: `${p.party} · ${p.chamber} · ${p.canton}`,
    });
  }

  for (const e of entities ?? []) {
    results.push({
      id: e.id,
      name: e.canonical_name,
      type: e.entity_type,
      subtitle: e.entity_type,
    });
  }

  return results;
}
