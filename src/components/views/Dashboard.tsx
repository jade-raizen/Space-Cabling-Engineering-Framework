import React from 'react';
import { useStore } from '../../store/useStore';
import { LayoutDashboard, Box, Map, Settings, FileText, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

export const Dashboard = () => {
  const { cables, nodes, obstacles, setActiveView, importCAD, logs } = useStore();
  
  const totalMass = cables.reduce((acc, c) => acc + c.mass, 0);
  const errorCount = cables.filter(c => c.status === 'error').length;
  const warningCount = cables.filter(c => c.status === 'warning').length;
  const powerConsumption = cables.filter(c => c.type === 'power').length * 12.5; // Mock

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importCAD(e.target.files[0]);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mission Dashboard</h1>
        <p className="text-slate-400">Project: NSM Digital Twin (GeoSynth Pro)</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">System Mass</span>
            <Settings size={16} className="text-slate-500" />
          </div>
          <div className="text-2xl font-mono text-white">{totalMass.toFixed(3)} <span className="text-sm text-slate-500">kg</span></div>
        </div>
        
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">Power Dissipation</span>
            <Activity size={16} className="text-slate-500" />
          </div>
          <div className="text-2xl font-mono text-white">{powerConsumption.toFixed(1)} <span className="text-sm text-slate-500">W</span></div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">Components</span>
            <Box size={16} className="text-slate-500" />
          </div>
          <div className="text-2xl font-mono text-white">{nodes.length + obstacles.length} <span className="text-sm text-slate-500">Items</span></div>
        </div>

        <div className={`p-4 rounded-lg border ${errorCount > 0 ? 'bg-red-900/20 border-red-800' : 'bg-emerald-900/20 border-emerald-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs uppercase font-bold ${errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Compliance</span>
            {errorCount > 0 ? <AlertTriangle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
          </div>
          <div className={`text-2xl font-mono ${errorCount > 0 ? 'text-red-200' : 'text-emerald-200'}`}>
            {errorCount > 0 ? `${errorCount} Errors` : 'Nominal'}
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group cursor-pointer" onClick={() => document.getElementById('cad-upload')?.click()}>
          <div className="h-12 w-12 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-900/50 transition-colors">
            <FileText className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Import CAD</h3>
          <p className="text-sm text-slate-400 mb-4">Load STEP/STP files to generate obstacle maps and environment geometry.</p>
          <input type="file" id="cad-upload" className="hidden" accept=".step,.stp" onChange={handleFileUpload} />
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Upload File &rarr;</span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group cursor-pointer" onClick={() => setActiveView('editor-2d')}>
          <div className="h-12 w-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-900/50 transition-colors">
            <Map className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">2D Schematic Editor</h3>
          <p className="text-sm text-slate-400 mb-4">Plan cable routes and define obstacles on a 2D grid plane.</p>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Open Editor &rarr;</span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group cursor-pointer" onClick={() => setActiveView('viewer-3d')}>
          <div className="h-12 w-12 bg-purple-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-900/50 transition-colors">
            <Box className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3D Digital Twin</h3>
          <p className="text-sm text-slate-400 mb-4">Visualize volumetric data, EMC fields, and thermal gradients in 3D.</p>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Enter Simulation &rarr;</span>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-300 uppercase">Recent System Activity</h3>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="text-sm text-slate-500 italic">No activity recorded.</div>
          ) : (
            logs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className="text-slate-600 font-mono text-xs mt-0.5">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  log.level === 'error' ? 'bg-red-900/50 text-red-200' :
                  log.level === 'warning' ? 'bg-amber-900/50 text-amber-200' :
                  log.level === 'success' ? 'bg-emerald-900/50 text-emerald-200' :
                  'bg-blue-900/50 text-blue-200'
                }`}>
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
