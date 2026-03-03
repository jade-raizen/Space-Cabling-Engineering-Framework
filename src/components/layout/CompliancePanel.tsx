import React from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle, CheckCircle, XCircle, Activity, Zap, ShieldAlert, Download } from 'lucide-react';

export const CompliancePanel = () => {
  const { cables, checkCompliance } = useStore();

  const powerCables = cables.filter(c => c.type === 'power');
  const totalMass = cables.reduce((acc, c) => acc + (c.mass || 0), 0) / 1000; // Convert g to kg
  const maxTemp = Math.max(0, ...cables.map(c => c.temperatureRise || 0));

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700 text-slate-200 w-80">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Mission Assurance</h2>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">Standard:</span>
          <span className="text-xs font-mono text-emerald-400">ECSS-Q-ST-70</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800 p-2 rounded border border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase">Total Mass</div>
            <div className="text-lg font-mono text-white">{totalMass.toFixed(3)} <span className="text-xs text-slate-500">kg</span></div>
          </div>
          <div className="bg-slate-800 p-2 rounded border border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase">Max Temp Rise</div>
            <div className="text-lg font-mono text-white">
              {maxTemp.toFixed(1)} <span className="text-xs text-slate-500">°C</span>
            </div>
          </div>
        </div>

        {/* Compliance List */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Compliance Matrix (RTM)</h3>
          <div className="space-y-2">
            <ComplianceItem 
              id="R-01" 
              label="Bend Radius (Power >10x, Sig >6x)" 
              status={cables.every(c => !c.violations.some(v => v.includes('Bend'))) ? 'pass' : 'fail'} 
            />
            <ComplianceItem 
              id="R-02" 
              label="EMC Separation (>50mm)" 
              status={cables.every(c => !c.violations.some(v => v.includes('EMC'))) ? 'pass' : 'fail'} 
            />
            <ComplianceItem 
              id="R-03" 
              label="Redundancy Sep. (>40mm)" 
              status={cables.every(c => !c.violations.some(v => v.includes('Redundancy'))) ? 'pass' : 'fail'} 
            />
            <ComplianceItem 
              id="R-04" 
              label="Grounding (Signal/Shield)" 
              status={cables.every(c => !c.violations.some(v => v.includes('Grounding') || v.includes('Shielding'))) ? 'pass' : 'fail'} 
            />
             <ComplianceItem 
              id="R-05" 
              label="Thermal Derating (Joule)" 
              status={cables.every(c => !c.violations.some(v => v.includes('Thermal'))) ? 'pass' : 'warn'} 
            />
          </div>
        </div>

        {/* Active Alerts */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Active Alerts</h3>
          {cables.filter(c => c.status !== 'compliant').length === 0 ? (
            <div className="text-xs text-slate-500 italic">No active violations.</div>
          ) : (
            <div className="space-y-2">
              {cables.filter(c => c.status !== 'compliant').map(cable => (
                <div key={cable.id} className={`p-2 rounded border text-xs ${cable.status === 'error' ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-amber-900/20 border-amber-800 text-amber-200'}`}>
                  <div className="font-bold flex items-center gap-1">
                    {cable.status === 'error' ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}
                    Cable {cable.id.slice(0,4)} ({cable.type})
                  </div>
                  <ul className="mt-1 list-disc list-inside opacity-80">
                    {cable.violations.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800 space-y-2">
        <button 
          onClick={() => checkCompliance()}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          <Activity size={14} />
          Run Certification Check
        </button>
        <button 
          onClick={() => {
             const report = `GEOSYNTH PRO - COMPLIANCE REPORT\nDate: ${new Date().toISOString()}\n\n` +
               `SUMMARY:\nTotal Cables: ${cables.length}\nMass: ${totalMass.toFixed(2)} kg\n\n` +
               `VIOLATIONS:\n` + 
               cables.filter(c => c.status !== 'compliant').map(c => `- Cable ${c.id.slice(0,4)}: ${c.violations.join(', ')}`).join('\n') +
               (cables.every(c => c.status === 'compliant') ? 'None. All systems nominal.' : '');
             
             const blob = new Blob([report], { type: 'text/plain' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = 'compliance_report.txt';
             a.click();
          }}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          <Download size={14} />
          Export Report (TXT)
        </button>
      </div>
    </div>
  );
};

const ComplianceItem = ({ id, label, status }: { id: string, label: string, status: 'pass' | 'fail' | 'warn' }) => {
  const color = status === 'pass' ? 'text-emerald-400' : status === 'fail' ? 'text-red-400' : 'text-amber-400';
  const Icon = status === 'pass' ? CheckCircle : status === 'fail' ? XCircle : AlertTriangle;
  
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon size={14} className={`mt-0.5 ${color} shrink-0`} />
      <div>
        <span className="font-mono text-slate-500 mr-1">{id}</span>
        <span className="text-slate-300">{label}</span>
      </div>
    </div>
  );
};
