import { useEffect, useState } from 'react';
import { BarChart3, Users, ArrowRight } from 'lucide-react';
import { fetchPoliticians, fetchAllMandates, computeSectorExposure, computePartyStats, fetchIndustrySectors } from '../lib/queries';
import type { Politician, Mandate, SectorExposure, PartyMandateStats, IndustrySector } from '../types';
import { PartyBadge } from '../components/Badge';
import type { ViewType, PartyAffiliation } from '../types';

interface SectorAnalysisProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export function SectorAnalysis({ onNavigate }: SectorAnalysisProps) {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [sectorData, setSectorData] = useState<SectorExposure[]>([]);
  const [partyStats, setPartyStats] = useState<PartyMandateStats[]>([]);
  const [sectors, setSectors] = useState<IndustrySector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pols, mands, secs] = await Promise.all([
          fetchPoliticians(),
          fetchAllMandates(),
          fetchIndustrySectors(),
        ]);
        setPoliticians(pols);
        setMandates(mands);
        setSectors(secs);
        const [secExp, partyS] = await Promise.all([
          computeSectorExposure(mands),
          computePartyStats(pols, mands),
        ]);
        setSectorData(secExp);
        setPartyStats(partyS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getSectorColor = (name: string) => {
    const sec = sectors.find(s => s.name_de === name);
    return sec?.color_hex ?? '#6B7280';
  };

  const selectedSectorData = selectedSector
    ? sectorData.find(s => s.sector === selectedSector)
    : null;

  const selectedSectorPoliticians = selectedSectorData
    ? politicians.filter(p => selectedSectorData.politicians.includes(p.id))
    : [];

  const sectorMandates = selectedSector
    ? mandates.filter(m => m.industry_sector === selectedSector)
    : [];

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
        <h1 className="text-white text-2xl font-bold tracking-tight">Sector Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Industry sector exposure across parliamentary mandates and institutional affiliations.
        </p>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Main chart + selected sector */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">Mandate Distribution by Sector</h2>
              <span className="text-xs text-slate-500 ml-auto">Click a sector to explore</span>
            </div>

            {/* Horizontal bar chart */}
            <div className="space-y-3">
              {sectorData.map(item => {
                const maxCount = sectorData[0]?.count ?? 1;
                const isSelected = selectedSector === item.sector;
                return (
                  <button
                    key={item.sector}
                    onClick={() => setSelectedSector(isSelected ? null : item.sector)}
                    className={`w-full text-left group transition-all rounded-lg p-2 -mx-2 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.sector}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{item.politicians.length} politicians</span>
                        <span className="text-slate-400 font-medium">{item.count} mandates</span>
                        <span className="font-semibold w-12 text-right" style={{ color: item.color }}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                          backgroundColor: item.color,
                          opacity: isSelected ? 1 : 0.75,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected sector detail */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            {selectedSector ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: getSectorColor(selectedSector) }}
                    >
                      SECTOR DETAIL
                    </div>
                    <h3 className="text-white font-semibold text-sm">{selectedSector}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedSector(null)}
                    className="text-slate-600 hover:text-slate-300 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedSectorData?.count}</div>
                    <div className="text-slate-500 text-xs">Total mandates</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedSectorPoliticians.length}</div>
                    <div className="text-slate-500 text-xs">Politicians</div>
                  </div>
                </div>

                <h4 className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">Politicians in this sector</h4>
                <div className="space-y-2">
                  {selectedSectorPoliticians.map(p => {
                    const polMandates = sectorMandates.filter(m => m.politician_id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onNavigate('profile', p.id)}
                        className="w-full flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 transition-colors group"
                      >
                        <div className="text-left min-w-0">
                          <div className="text-slate-200 text-sm font-medium group-hover:text-white truncate">
                            {p.full_name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <PartyBadge party={p.party as PartyAffiliation} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-500">{polMandates.length} role{polMandates.length !== 1 ? 's' : ''}</span>
                          <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <BarChart3 size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Click a sector in the chart to explore details.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Party mandate stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-emerald-400" />
            <h2 className="text-white font-semibold">Mandate Distribution by Party</h2>
            <span className="text-xs text-slate-500 ml-1">Descriptive statistics only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 pr-4">Party</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 pr-4">Total Mandates</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 pr-4">Avg / Politician</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 pr-4">Paid</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 pr-4">Unpaid</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500">Top Sectors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {partyStats.map(stat => (
                  <tr key={stat.party} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <PartyBadge party={stat.party as PartyAffiliation} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(100, (stat.totalMandates / 10) * 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-xs font-semibold">{stat.totalMandates}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{stat.avgMandatesPerPolitician.toFixed(1)}</td>
                    <td className="py-3 pr-4 text-amber-400 text-xs font-medium">{stat.paidMandates}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{stat.unpaidMandates}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {stat.topSectors.slice(0, 2).map(s => (
                          <span
                            key={s}
                            className="text-xs text-slate-400 bg-slate-800 rounded-md px-1.5 py-0.5"
                          >
                            {s.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
