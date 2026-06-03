import type { Mandate, Politician, VoteRecord, CommitteeMembership } from '../types';

export function calculatePartyLoyalty(
  party: string,
  voteRecords: VoteRecord[],
  politicians: Politician[]
): number {
  const partyPolIds = politicians.filter(p => p.party === party).map(p => p.id);
  const partyVotes = voteRecords.filter(v => partyPolIds.includes(v.politician_id));
  if (partyVotes.length === 0) return 0;

  const voteGroups: Record<string, { yes: number; no: number }> = {};
  partyVotes.forEach(v => {
    if (!voteGroups[v.parliamentary_vote_id]) voteGroups[v.parliamentary_vote_id] = { yes: 0, no: 0 };
    if (v.vote_result === 'YES') voteGroups[v.parliamentary_vote_id].yes++;
    else if (v.vote_result === 'NO') voteGroups[v.parliamentary_vote_id].no++;
  });

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

export function aggregatePartyStats(
  politicians: Politician[]
): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const p of politicians) {
    stats[p.party] = (stats[p.party] || 0) + 1;
  }
  return stats;
}

export function aggregateSectorStats(mandates: Mandate[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const m of mandates) {
    const sector = m.industry_sector || 'Other';
    stats[sector] = (stats[sector] || 0) + 1;
  }
  return stats;
}

export function calculateSectorExposureBasic(
  mandates: Mandate[],
  colorMap: Record<string, string>
): Array<{
  sector: string;
  count: number;
  percentage: number;
  color: string;
  politicians: string[];
}> {
  const sectorMap: Record<string, { count: number; politicians: Set<string> }> = {};

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
      color: colorMap[sector] ?? '#6B7280',
      politicians: Array.from(val.politicians),
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculatePartyMandateStats(
  politicians: Politician[],
  mandates: Mandate[]
): Array<{
  party: string;
  totalMandates: number;
  avgMandatesPerPolitician: number;
  paidMandates: number;
  unpaidMandates: number;
  topSectors: string[];
}> {
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
      party,
      totalMandates: val.mandates.length,
      avgMandatesPerPolitician: val.ids.length > 0 ? val.mandates.length / val.ids.length : 0,
      paidMandates: val.mandates.filter(m => m.is_paid).length,
      unpaidMandates: val.mandates.filter(m => !m.is_paid).length,
      topSectors,
    };
  }).sort((a, b) => b.totalMandates - a.totalMandates);
}

export function calculateNetworkCentralityBasic(
  politicians: Politician[],
  mandates: Mandate[],
  memberships: CommitteeMembership[]
): Array<{
  politician_id: string;
  politician_name: string;
  degree: number;
  betweenness: number;
  eigenvector: number;
  mandateCount: number;
  committeeCount: number;
}> {
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
