import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OrganizationProfileProps {
  organizationId: string;
  onShowDetail: (data: any) => void;
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  industry_sector: string;
  headquarters_canton: string;
  founded_year: number;
  employees_range: string;
  revenue_range: string;
  description: string;
  political_relevance: string;
  lobbying_activities: string;
  key_interests: string[];
  website: string;
}

interface MandateWithPolitician {
  id: string;
  role_title: string;
  is_paid: boolean;
  compensation_range: string;
  politician_id: string;
  politician_first_name: string;
  politician_last_name: string;
  politician_party: string;
  politician_chamber: string;
  relationship_context: string;
  potential_conflicts: string[];
}

export function OrganizationProfile({ organizationId, onShowDetail }: OrganizationProfileProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [mandates, setMandates] = useState<MandateWithPolitician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('organizations').select('*').eq('id', organizationId).single(),
      supabase
        .from('mandates')
        .select(`
          id,
          role_title,
          is_paid,
          compensation_range,
          relationship_context,
          potential_conflicts,
          politician:politicians (
            id,
            first_name,
            last_name,
            party,
            chamber
          )
        `)
        .eq('organization_id', organizationId)
    ]).then(([orgRes, mandateRes]) => {
      setOrganization(orgRes.data);
      const mandateData = (mandateRes.data || []).map((m: any) => ({
        ...m,
        politician_id: m.politician.id,
        politician_first_name: m.politician.first_name,
        politician_last_name: m.politician.last_name,
        politician_party: m.politician.party,
        politician_chamber: m.politician.chamber
      }));
      setMandates(mandates);
      setLoading(false);
    });
  }, [organizationId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!organization) return <div className="p-6">Organization not found</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              {organization.organization_type}
            </div>
            <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
            {organization.industry_sector && (
              <div className="flex items-center gap-2 text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{organization.industry_sector}</span>
              </div>
            )}
          </div>
          {organization.website && (
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {organization.description && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </h3>
              <p className="text-slate-300">{organization.description}</p>
            </div>
          )}

          {/* Political Relevance */}
          {organization.political_relevance && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Political Relevance
              </h3>
              <p className="text-slate-300">{organization.political_relevance}</p>
            </div>
          )}

          {/* Key Interests */}
          {organization.key_interests && organization.key_interests.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Key Policy Interests</h3>
              <div className="flex flex-wrap gap-2">
                {organization.key_interests.map((interest, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected Politicians */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold mb-4">
              Political Connections ({mandates.length})
            </h3>
            <div className="space-y-3">
              {mandates.map(m => (
                <div
                  key={m.id}
                  onClick={() => onShowDetail({
                    type: 'mandate',
                    title: `${m.politician_first_name} ${m.politician_last_name}`,
                    data: m,
                    source: `mandates where id = '${m.id}'`,
                    details: [
                      { label: 'Role', value: m.role_title },
                      { label: 'Party', value: m.politician_party },
                      { label: 'Compensation', value: m.is_paid ? m.compensation_range || 'Paid' : 'Unpaid' },
                    ],
                    children: m.relationship_context && (
                      <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                        <div className="text-xs text-amber-400 uppercase tracking-wider mb-1">Context</div>
                        <p className="text-sm text-slate-300">{m.relationship_context}</p>
                      </div>
                    )
                  })}
                  className="p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.politician_first_name} {m.politician_last_name}</div>
                      <div className="text-sm text-slate-400">{m.politician_party} • {m.role_title}</div>
                      {m.relationship_context && (
                        <div className="text-xs text-amber-400 mt-1">{m.relationship_context}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${m.is_paid ? 'text-green-400' : 'text-slate-400'}`}>
                        {m.is_paid ? 'Paid' : 'Unpaid'}
                      </div>
                      <div className="text-xs text-slate-500">{m.politician_chamber}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          {organization.founded_year && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Founded</div>
              <div className="text-2xl font-bold">{organization.founded_year}</div>
            </div>
          )}

          {organization.employees_range && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Employees</div>
              <div className="text-xl font-semibold">{organization.employees_range}</div>
            </div>
          )}

          {organization.revenue_range && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Revenue</div>
              <div className="text-xl font-semibold">{organization.revenue_range}</div>
            </div>
          )}

          {organization.headquarters_canton && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Headquarters</div>
              <div className="text-xl font-semibold">{organization.headquarters_canton}</div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500">Political Connections</div>
            <div className="text-3xl font-bold text-blue-400">{mandates.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              {mandates.filter(m => m.is_paid).length} paid positions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
