import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSortProps {
  filters: {
    party?: FilterOption[];
    canton?: FilterOption[];
    chamber?: FilterOption[];
    sector?: FilterOption[];
    gender?: FilterOption[];
    paid?: FilterOption[];
  };
  sortOptions?: FilterOption[];
  activeFilters: Record<string, string>;
  activeSort: { field: string; direction: 'asc' | 'desc' };
  onFilterChange: (filters: Record<string, string>) => void;
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

export function FilterSort({
  filters,
  sortOptions,
  activeFilters,
  activeSort,
  onFilterChange,
  onSortChange
}: FilterSortProps) {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === '') {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }
    onFilterChange(newFilters);
  };

  const toggleSortDirection = () => {
    onSortChange({
      field: activeSort.field,
      direction: activeSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => onFilterChange({})}
              className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {sortOptions && sortOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={activeSort.field}
              onChange={(e) => onSortChange({ field: e.target.value, direction: activeSort.direction })}
              className="text-sm bg-slate-800 border border-slate-700 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={toggleSortDirection}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition"
              title={activeSort.direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg className={`w-4 h-4 transition ${activeSort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filters.party && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Party</label>
              <select
                value={activeFilters.party || ''}
                onChange={(e) => handleFilterChange('party', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Parties</option>
                {filters.party.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.canton && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Canton</label>
              <select
                value={activeFilters.canton || ''}
                onChange={(e) => handleFilterChange('canton', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Cantons</option>
                {filters.canton.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.chamber && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Chamber</label>
              <select
                value={activeFilters.chamber || ''}
                onChange={(e) => handleFilterChange('chamber', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">Both Chambers</option>
                {filters.chamber.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.sector && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sector</label>
              <select
                value={activeFilters.sector || ''}
                onChange={(e) => handleFilterChange('sector', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Sectors</option>
                {filters.sector.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.gender && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gender</label>
              <select
                value={activeFilters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                {filters.gender.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.paid && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Compensation</label>
              <select
                value={activeFilters.paid || ''}
                onChange={(e) => handleFilterChange('paid', e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                {filters.paid.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
