import { describe, it, expect } from 'vitest';
import {
  calculatePartyLoyalty,
  aggregatePartyStats,
  aggregateSectorStats,
  calculateSectorExposureBasic,
  calculatePartyMandateStats,
  calculateNetworkCentralityBasic,
} from './calculations';
import type { Politician, VoteRecord, Mandate, CommitteeMembership, Committee, PartyAffiliation } from '../types';

const mockPolitician = (id: string, party: string): Politician => ({
  id,
  entity_id: `e${id}`,
  first_name: 'Test',
  last_name: 'Politician',
  full_name: 'Test Politician',
  party: party as PartyAffiliation,
  chamber: 'National Council',
  canton: 'ZH',
  parliamentary_id: `parl${id}`,
  is_active: true,
});

const mockMandate = (id: string, politicianId: string, sector?: string): Mandate => ({
  id,
  politician_id: politicianId,
  organization_name: `Org ${id}`,
  role_title: 'Member',
  mandate_type: 'BOARD_MEMBER_OF',
  industry_sector: sector,
  is_paid: id === 'm1',
  confidence_score: 0.95,
  is_current: true,
  created_at: '2024-01-01',
});

const mockVoteRecord = (
  id: string,
  voteId: string,
  politicianId: string,
  result: 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT' | 'EXCUSED'
): VoteRecord => ({
  id,
  parliamentary_vote_id: voteId,
  politician_id: politicianId,
  vote_result: result,
  created_at: '2024-01-01',
});

const mockCommittee: Committee = {
  id: 'c1',
  entity_id: 'ce1',
  name_de: 'Test Committee',
  abbreviation: 'TC',
  chamber: 'National Council',
  is_active: true,
};

const mockMembership = (id: string, politicianId: string): CommitteeMembership => ({
  id,
  politician_id: politicianId,
  committee_id: 'c1',
  role: 'Member',
  is_current: true,
  confidence_score: 0.95,
  created_at: '2024-01-01',
  committee: mockCommittee,
});

describe('Party Loyalty Calculation', () => {
  it('should calculate 100% loyalty when all party members vote with majority', () => {
    const politicians = [mockPolitician('1', 'SVP'), mockPolitician('2', 'SVP')];
    const voteRecords = [
      mockVoteRecord('v1', 'vote1', '1', 'YES'),
      mockVoteRecord('v2', 'vote1', '2', 'YES'),
    ];

    const loyalty = calculatePartyLoyalty('SVP', voteRecords, politicians);
    expect(loyalty).toBe(100);
  });

  it('should calculate 50% loyalty with mixed voting', () => {
    const politicians = [mockPolitician('1', 'SVP'), mockPolitician('2', 'SVP')];
    const voteRecords = [
      mockVoteRecord('v1', 'vote1', '1', 'NO'),
      mockVoteRecord('v2', 'vote1', '2', 'YES'),
    ];

    const loyalty = calculatePartyLoyalty('SVP', voteRecords, politicians);
    expect(loyalty).toBe(50);
  });

  it('should return 0 when party has no votes', () => {
    const politicians = [mockPolitician('1', 'SVP')];
    const loyalty = calculatePartyLoyalty('SVP', [], politicians);
    expect(loyalty).toBe(0);
  });
});

describe('Party Statistics Aggregation', () => {
  it('should count politicians by party', () => {
    const politicians = [
      mockPolitician('1', 'SVP'),
      mockPolitician('2', 'SVP'),
      mockPolitician('3', 'SP'),
    ];

    const stats = aggregatePartyStats(politicians);
    expect(stats['SVP']).toBe(2);
    expect(stats['SP']).toBe(1);
  });

  it('should return empty object for empty list', () => {
    const stats = aggregatePartyStats([]);
    expect(Object.keys(stats).length).toBe(0);
  });
});

describe('Sector Statistics Aggregation', () => {
  it('should count mandates by sector', () => {
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p2', 'Finance'),
      mockMandate('m3', 'p3', 'Healthcare'),
    ];

    const stats = aggregateSectorStats(mandates);
    expect(stats['Finance']).toBe(2);
    expect(stats['Healthcare']).toBe(1);
  });

  it('should count mandates without sector as Other', () => {
    const mandates = [mockMandate('m1', 'p1', undefined)];
    const stats = aggregateSectorStats(mandates);
    expect(stats['Other']).toBe(1);
  });
});

describe('Sector Exposure Calculation', () => {
  it('should calculate percentage distribution', () => {
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p2', 'Finance'),
      mockMandate('m3', 'p3', 'Tech'),
    ];

    const colorMap = { Finance: '#1234', Tech: '#5678' };
    const exposure = calculateSectorExposureBasic(mandates, colorMap);

    expect(exposure.length).toBe(2);
    expect(exposure[0].sector).toBe('Finance');
    expect(exposure[0].count).toBe(2);
    expect(exposure[0].percentage).toBeCloseTo(66.67, 1);
  });

  it('should track unique politicians per sector', () => {
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p1', 'Finance'),
    ];

    const colorMap = { Finance: '#1234' };
    const exposure = calculateSectorExposureBasic(mandates, colorMap);

    expect(exposure[0].politicians.length).toBe(1);
    expect(exposure[0].politicians[0]).toBe('p1');
  });
});

describe('Party Mandate Statistics', () => {
  it('should calculate mandate stats by party', () => {
    const politicians = [mockPolitician('p1', 'SVP'), mockPolitician('p2', 'SVP')];
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p1', 'Tech'),
    ];

    const stats = calculatePartyMandateStats(politicians, mandates);
    expect(stats.length).toBe(1);
    expect(stats[0].party).toBe('SVP');
    expect(stats[0].totalMandates).toBe(2);
    expect(stats[0].paidMandates).toBe(1);
  });

  it('should identify top sectors', () => {
    const politicians = [mockPolitician('p1', 'SVP')];
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p1', 'Tech'),
      mockMandate('m3', 'p1', 'Healthcare'),
    ];

    const stats = calculatePartyMandateStats(politicians, mandates);
    expect(stats[0].topSectors.length).toBeLessThanOrEqual(3);
  });
});

describe('Network Centrality Calculation', () => {
  it('should calculate degree as mandates + memberships', () => {
    const politicians = [mockPolitician('p1', 'SVP')];
    const mandates = [mockMandate('m1', 'p1', 'Finance')];
    const memberships = [mockMembership('cm1', 'p1')];

    const centrality = calculateNetworkCentralityBasic(politicians, mandates, memberships);
    expect(centrality[0].degree).toBe(2);
    expect(centrality[0].mandateCount).toBe(1);
    expect(centrality[0].committeeCount).toBe(1);
  });

  it('should sort by degree descending', () => {
    const politicians = [mockPolitician('p1', 'SVP'), mockPolitician('p2', 'SVP')];
    const mandates = [
      mockMandate('m1', 'p1', 'Finance'),
      mockMandate('m2', 'p1', 'Tech'),
      mockMandate('m3', 'p2', 'Healthcare'),
    ];
    const memberships: CommitteeMembership[] = [];

    const centrality = calculateNetworkCentralityBasic(politicians, mandates, memberships);
    expect(centrality[0].degree).toBeGreaterThanOrEqual(centrality[1].degree);
  });
});
