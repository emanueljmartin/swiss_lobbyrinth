import type { SectorExposure } from '../types';

interface SectorChartProps {
  data: SectorExposure[];
  title?: string;
  onSectorClick?: (sector: string) => void;
}

export function SectorChart({ data, title = 'Sector Exposure', onSectorClick }: SectorChartProps) {
  const top = data.slice(0, 10);
  const maxCount = top[0]?.count ?? 1;

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>}
      <div className="space-y-2.5">
        {top.map(item => (
          <button
            key={item.sector}
            onClick={() => onSectorClick?.(item.sector)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors truncate max-w-[60%]">
                {item.sector}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{item.count} mandates</span>
                <span className="text-xs font-semibold" style={{ color: item.color }}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface SectorDonutProps {
  data: SectorExposure[];
}

export function SectorDonut({ data }: SectorDonutProps) {
  const top = data.slice(0, 8);
  const total = top.reduce((acc, d) => acc + d.count, 0);

  // Build SVG arc paths
  const cx = 80, cy = 80, r = 60, ir = 35;
  let cumulative = 0;

  const slices = top.map(item => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += item.count;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + ir * Math.cos(startAngle);
    const iy1 = cy + ir * Math.sin(startAngle);
    const ix2 = cx + ir * Math.cos(endAngle);
    const iy2 = cy + ir * Math.sin(endAngle);

    const largeArc = item.count / total > 0.5 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return { ...item, d };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" width={140} height={140} className="flex-shrink-0">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.d}
            fill={slice.color}
            opacity={0.85}
            stroke="#0f172a"
            strokeWidth={1.5}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-300" fontSize={10} fontWeight={600}>
          {total}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-slate-500" fontSize={8}>
          mandates
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {top.slice(0, 6).map(item => (
          <div key={item.sector} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-400 truncate flex-1">{item.sector.split(' ')[0]}</span>
            <span className="text-xs text-slate-500 flex-shrink-0">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
