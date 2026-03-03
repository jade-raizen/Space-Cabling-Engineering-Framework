import React from 'react';
import { useStore } from '../../store/useStore';
import { LayoutDashboard, Map, Box } from 'lucide-react';

export const Navbar = () => {
  const { activeView, setActiveView } = useStore();

  const NavItem = ({ view, icon: Icon, label }: { view: typeof activeView, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
        activeView === view 
          ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center font-bold text-white">
          GS
        </div>
        <span className="font-bold text-slate-200 tracking-tight">GeoSynth <span className="text-blue-400">Pro</span></span>
      </div>

      <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem view="editor-2d" icon={Map} label="2D Editor" />
        <NavItem view="viewer-3d" icon={Box} label="3D Viewer" />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
          System Online
        </div>
      </div>
    </div>
  );
};
