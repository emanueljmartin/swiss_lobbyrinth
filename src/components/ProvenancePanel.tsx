import { ExternalLink, Info, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { Mandate } from '../types';
import { ConfidenceBadge, MandateTypeBadge } from './Badge';

interface ProvenancePanelProps {
  mandate: Mandate;
  onClose: () => void;
}

export function ProvenancePanel({ mandate, onClose }: ProvenancePanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Evidence & Provenance</span>
            </div>
            <h3 className="text-white font-semibold text-base">{mandate.organization_name}</h3>
            <div className="text-slate-400 text-sm">{mandate.role_title}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors ml-4 flex-shrink-0 mt-1">
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mandate type */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Relationship Type</span>
            <MandateTypeBadge type={mandate.mandate_type} />
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Data Confidence</span>
            <ConfidenceBadge score={mandate.confidence_score} />
          </div>

          {/* Sector */}
          {mandate.industry_sector && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Industry Sector</span>
              <span className="text-slate-300 text-sm">{mandate.industry_sector}</span>
            </div>
          )}

          {/* Compensation */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Compensation</span>
            <span className="text-slate-300 text-sm">
              {mandate.is_paid === true ? 'Paid' : mandate.is_paid === false ? 'Unpaid (Volunteer)' : 'Not disclosed'}
            </span>
          </div>

          {/* Temporal validity */}
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Clock size={12} />
              <span>Temporal Validity</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-500">Valid from</div>
                <div className="text-slate-300">{mandate.start_date ?? 'Unknown'}</div>
              </div>
              <div>
                <div className="text-slate-500">Valid to</div>
                <div className="text-slate-300">{mandate.end_date ?? (mandate.is_current ? 'Present' : 'Unknown')}</div>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <CheckCircle size={12} />
              <span>Source Attribution</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-300 text-right">Parlamentsdienste - Interessenbindungen</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Disclosure year</span>
                <span className="text-slate-300">{mandate.disclosure_year ?? 'N/A'}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Extraction</span>
                <span className="text-slate-300">Official disclosure</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-950/40 border border-amber-900/50 px-3 py-2">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200/70 text-xs leading-relaxed">
              This record describes a structural relationship disclosed in official parliamentary records. It does not imply wrongdoing, conflict of interest, or any form of improper conduct.
            </p>
          </div>

          {/* External link */}
          <a
            href="https://www.parlament.ch/de/ratsmitglieder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
          >
            <ExternalLink size={13} />
            View on Parlamentsdienste
          </a>
        </div>
      </div>
    </div>
  );
}
