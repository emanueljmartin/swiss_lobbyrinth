import { PARTY_COLORS, type PartyAffiliation } from '../types';

interface PartyBadgeProps {
  party: PartyAffiliation;
  size?: 'sm' | 'md';
}

export function PartyBadge({ party, size = 'sm' }: PartyBadgeProps) {
  const color = PARTY_COLORS[party] ?? '#6B7280';
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${px}`}
      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
    >
      {party}
    </span>
  );
}

interface ConfidenceBadgeProps {
  score: number;
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const pct = Math.round(score * 100);
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (pct < 80) color = 'text-amber-700 bg-amber-50 border-amber-200';
  if (pct < 60) color = 'text-rose-700 bg-rose-50 border-rose-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {pct}% confidence
    </span>
  );
}

interface VoteBadgeProps {
  result: string;
}

export function VoteBadge({ result }: VoteBadgeProps) {
  const styles: Record<string, string> = {
    YES: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    NO: 'text-rose-700 bg-rose-50 border-rose-200',
    ABSTAIN: 'text-amber-700 bg-amber-50 border-amber-200',
    ABSENT: 'text-slate-600 bg-slate-50 border-slate-200',
    EXCUSED: 'text-slate-500 bg-slate-50 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[result] ?? styles.ABSENT}`}>
      {result}
    </span>
  );
}

interface SectorBadgeProps {
  sector: string;
  color?: string;
}

export function SectorBadge({ sector, color = '#6B7280' }: SectorBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: color + '18', color, border: `1px solid ${color}33` }}
    >
      {sector}
    </span>
  );
}

interface MandateTypeBadgeProps {
  type: string;
}

export function MandateTypeBadge({ type }: MandateTypeBadgeProps) {
  const labels: Record<string, string> = {
    BOARD_MEMBER_OF: 'Board',
    MEMBER_OF: 'Member',
    CONSULTANT_FOR: 'Consultant',
    PRESIDENT_OF: 'President',
    DIRECTOR_OF: 'Director',
    PARTNER_OF: 'Partner',
    ASSOCIATED_WITH: 'Associated',
    SHAREHOLDER_OF: 'Shareholder',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {labels[type] ?? type}
    </span>
  );
}
