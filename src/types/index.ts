export type EntityType =
  | 'PERSON' | 'POLITICIAN' | 'COMPANY' | 'FOUNDATION'
  | 'ASSOCIATION' | 'COMMITTEE' | 'AGENCY' | 'MEDIA_SOURCE' | 'INDUSTRY_SECTOR';

export type RelationshipType =
  | 'BOARD_MEMBER_OF' | 'MEMBER_OF' | 'CONSULTANT_FOR' | 'SHAREHOLDER_OF'
  | 'PARTICIPATES_IN' | 'SITS_ON_COMMITTEE' | 'HAS_MANDATE_IN'
  | 'VOTED_FOR' | 'VOTED_AGAINST' | 'RECEIVED_CONTRACT' | 'ASSOCIATED_WITH'
  | 'MENTIONED_IN' | 'PRESIDENT_OF' | 'DIRECTOR_OF' | 'PARTNER_OF';

export type VoteResult = 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT' | 'EXCUSED';

export type PartyAffiliation =
  | 'SVP' | 'SP' | 'FDP' | 'Mitte' | 'GPS' | 'GLP' | 'EVP' | 'EDU'
  | 'MCG' | 'Lega' | 'PdA' | 'Independent' | 'Other';

export type Chamber = 'National Council' | 'Council of States' | 'Federal Council' | 'Cantonal';

export interface Entity {
  id: string;
  entity_type: EntityType;
  canonical_name: string;
  short_name?: string;
  description?: string;
  confidence_score: number;
  source_ids?: string[];
  external_ids?: Record<string, string>;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Politician {
  id: string;
  entity_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  party: PartyAffiliation;
  chamber: Chamber;
  canton: string;
  electoral_district?: string;
  is_active: boolean;
  term_start?: string;
  term_end?: string;
  birth_year?: number;
  gender?: string;
  photo_url?: string;
  parliamentary_id: string;
  bio_summary?: string;
  source_id?: string;
  mandate_count?: number;
  committee_count?: number;
}

export interface Mandate {
  id: string;
  politician_id: string;
  organization_entity_id?: string;
  organization_name: string;
  role_title: string;
  mandate_type: RelationshipType;
  industry_sector?: string;
  is_paid?: boolean;
  compensation_chf?: number;
  compensation_range?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  disclosure_year?: number;
  source_document?: string;
  source_id?: string;
  confidence_score: number;
  notes?: string;
  created_at: string;
}

export interface Committee {
  id: string;
  entity_id: string;
  name_de: string;
  name_fr?: string;
  name_it?: string;
  abbreviation?: string;
  chamber: Chamber;
  committee_type?: string;
  policy_area?: string;
  is_active: boolean;
  source_id?: string;
}

export interface CommitteeMembership {
  id: string;
  politician_id: string;
  committee_id: string;
  role: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  source_id?: string;
  confidence_score: number;
  created_at: string;
  committee?: Committee;
  politician?: Politician;
}

export interface ParliamentaryVote {
  id: string;
  vote_id: string;
  title_de: string;
  title_fr?: string;
  title_it?: string;
  vote_date: string;
  chamber: Chamber;
  vote_category?: string;
  policy_area?: string;
  result?: string;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  absent_count: number;
  description?: string;
  source_id?: string;
  created_at: string;
}

export interface VoteRecord {
  id: string;
  parliamentary_vote_id: string;
  politician_id: string;
  vote_result: VoteResult;
  source_id?: string;
  created_at: string;
  parliamentary_vote?: ParliamentaryVote;
  politician?: Politician;
}

export interface DataSource {
  id: string;
  name: string;
  short_name: string;
  url?: string;
  description?: string;
  data_type: string;
  license?: string;
  last_fetched_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface IndustrySector {
  id: string;
  name_de: string;
  name_en: string;
  noga_division?: string;
  color_hex: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  label?: string;
  weight: number;
  is_direct: boolean;
  confidence_score: number;
  valid_from?: string;
  valid_to?: string;
  is_current: boolean;
  source_document?: string;
  source_url?: string;
  source_id?: string;
  extraction_method?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Graph model for visualization
export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  party?: PartyAffiliation;
  sector?: string;
  mandateCount?: number;
  confidence: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  weight: number;
  confidence: number;
  is_current: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Analytics types
export interface SectorExposure {
  sector: string;
  count: number;
  percentage: number;
  color: string;
  politicians: string[];
}

export interface PartyMandateStats {
  party: PartyAffiliation;
  totalMandates: number;
  avgMandatesPerPolitician: number;
  paidMandates: number;
  unpaidMandates: number;
  topSectors: string[];
}

export interface NetworkCentrality {
  politician_id: string;
  politician_name: string;
  degree: number;
  betweenness: number;
  eigenvector: number;
  mandateCount: number;
  committeeCount: number;
}

export interface PoliticianProfile {
  politician: Politician;
  mandates: Mandate[];
  committee_memberships: CommitteeMembership[];
  vote_records: VoteRecord[];
  network_centrality: NetworkCentrality;
}

// Search types
export interface SearchResult {
  id: string;
  type: EntityType;
  name: string;
  subtitle?: string;
  confidence: number;
}

export type ViewType = 'dashboard' | 'network' | 'politicians' | 'profile' | 'sectors' | 'votes' | 'search';

export const PARTY_COLORS: Record<PartyAffiliation, string> = {
  SVP: '#2E7D32',
  SP: '#C62828',
  FDP: '#1565C0',
  Mitte: '#FF8F00',
  GPS: '#558B2F',
  GLP: '#00838F',
  EVP: '#6A1B9A',
  EDU: '#BF360C',
  MCG: '#37474F',
  Lega: '#0D47A1',
  PdA: '#B71C1C',
  Independent: '#546E7A',
  Other: '#78909C',
};

export const MANDATE_TYPE_LABELS: Record<RelationshipType, string> = {
  BOARD_MEMBER_OF: 'Board Member',
  MEMBER_OF: 'Member',
  CONSULTANT_FOR: 'Consultant',
  SHAREHOLDER_OF: 'Shareholder',
  PARTICIPATES_IN: 'Participant',
  SITS_ON_COMMITTEE: 'Committee Member',
  HAS_MANDATE_IN: 'Mandate',
  VOTED_FOR: 'Voted For',
  VOTED_AGAINST: 'Voted Against',
  RECEIVED_CONTRACT: 'Contract Recipient',
  ASSOCIATED_WITH: 'Associated',
  MENTIONED_IN: 'Mentioned',
  PRESIDENT_OF: 'President',
  DIRECTOR_OF: 'Director',
  PARTNER_OF: 'Partner',
};
