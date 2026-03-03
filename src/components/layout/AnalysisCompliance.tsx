import React from 'react';
import { useStore } from '../../store/useStore';
import { Eye, Activity, Layers, Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const AnalysisCompliance = () => {
  const { 
    viewSettings, 
    toggleViewSetting, 
    cables, 
    setActiveView,
    activeView
  } = useStore();

  const complianceChecks = [
    { id: 'R-01', name: 'Bend Radius', status: cables.some(c => c.violations.some(v => v.includes('Bend'))) ? 'fail' : 'pass' },
    { id: 'R-02', name: 'Separation', status: cables.some(c => c.violations.some(v => v.includes('Separation'))) ? 'fail' : 'pass' },
    { id: 'R-03', name: 'Connectivity', status: cables.some(c => c.status === 'error') ? 'fail' : 'pass' },
    { id: 'R-04', name: 'Thermal', status: cables.some(c => (c.temperatureRise || 0) > 50) ? 'fail' : 'pass' },
    { id: 'MIL-EMC', name: 'MIL-EMC Compliance', status: cables.some(c => c.violations.some(v => v.includes('EMC'))) ? 'fail' : 'pass' },
  ];

  const handleExport = () => {
    const data = JSON.stringify({ cables, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_export.json';
    a.click();
  };

  return (
    <div className="w-72 bg-gray-50 border-l border-gray-300 flex flex-col h-full p-4 gap-6 overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-300 pb-2">
        Analysis & Compliance
      </h2>

      {/* Visual Analysis */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">Visual Analysis</h3>
        <div className="flex flex-col gap-2">
          <button 
            className={`w-full py-3 px-4 rounded shadow font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
              activeView === 'editor-3d' 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
            }`}
            onClick={() => setActiveView(activeView === 'editor-3d' ? 'editor-2d' : 'editor-3d')}
          >
            <Eye size={16} />
            {activeView === 'editor-3d' ? 'SWITCH TO 2D VIEW' : 'SWITCH TO 3D VIEW'}
          </button>

          <button 
            className={`w-full py-2 px-3 rounded border text-xs transition-colors flex items-center justify-center gap-2 ${
              viewSettings.showPathMetrics 
                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => toggleViewSetting('showPathMetrics')}
          >
            <Activity size={14} />
            Toggle Path Metrics
          </button>

          <button 
            className={`w-full py-2 px-3 rounded border text-xs transition-colors flex items-center justify-center gap-2 ${
              viewSettings.showDensityHeatmap 
                ? 'bg-red-100 border-red-300 text-red-800' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => toggleViewSetting('showDensityHeatmap')}
          >
            <Layers size={14} />
            Toggle Density Heatmap
          </button>

          <button 
            className="w-full py-2 px-3 rounded border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs transition-colors flex items-center justify-center gap-2"
            onClick={() => {/* Ribbon logic */}}
          >
            Ribbon Connector (Nappe)
          </button>
        </div>
      </div>

      {/* Cable Legend */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">Cable Legend</h3>
        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">POWER (High Noise)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 border-t-2 border-dotted border-pink-500"></div>
            <span className="text-xs text-gray-600">SENSITIVE (Isolated)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">DATA (Standard)</span>
          </div>
        </div>
      </div>

      {/* Normative Checklist */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">Normative Checklist</h3>
        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
          {complianceChecks.map(check => (
            <div key={check.id} className="flex items-center gap-2">
              {check.status === 'pass' ? (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              )}
              <span className={`text-xs ${check.status === 'pass' ? 'text-green-700' : 'text-red-700 font-medium'}`}>
                {check.name}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
