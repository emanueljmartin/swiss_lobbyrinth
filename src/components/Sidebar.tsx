import {
  LayoutDashboard, Network, Users, BarChart3, HelpingHand,
  Vote, Search, Database, ChevronRight, Shield
} from 'lucide-react';
import type { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, description: 'System overview' },
  { id: 'network', label: 'Network Graph', icon: <Network size={18} />, description: 'Influence map' },
  { id: 'politicians', label: 'Politicians', icon: <Users size={18} />, description: 'All legislators' },
  { id: 'sectors', label: 'Sector Analysis', icon: <BarChart3 size={18} />, description: 'Industry exposure' },
  { id: 'votes', label: 'Voting Records', icon: <Vote size={18} />, description: 'Parliamentary votes' },
  { id: 'search', label: 'Search', icon: <Search size={18} />, description: 'Find entities' },
];

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Swiss Transparency</div>
            <div className="text-slate-400 text-xs">Institutional Mapping</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className={`text-xs truncate ${isActive ? 'text-blue-200' : 'text-slate-600 group-hover:text-slate-500'}`}>
                  {item.description}
                </div>
              </div>
              {isActive && <ChevronRight size={14} className="text-blue-300 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Data sources indicator */}
      <div className="px-3 pb-5">
        <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Database size={12} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Data Sources</span>
          </div>
          <div className="space-y-1">
            {['Parlamentsdienste', 'Handelsregister', 'SIMAP', 'Lobbywatch'].map(src => (
              <div key={src} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 truncate">{src}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          Structural transparency platform. Data shows relationships, not wrongdoing.
        </p>
      </div>
    </aside>
  );
}
