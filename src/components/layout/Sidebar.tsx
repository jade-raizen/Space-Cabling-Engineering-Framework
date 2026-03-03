import React, { useState } from 'react';
import { useStore, NodeType, CableType, RedundancyType } from '../../store/useStore';
import { Plus, Box, Zap, Wifi, Anchor, Download, Play } from 'lucide-react';

export const Sidebar = () => {
  const { addNode, addObstacle, addCable, nodes, viewSettings, toggleViewSetting } = useStore();
  const [cableStart, setCableStart] = useState<string>('');
  const [cableEnd, setCableEnd] = useState<string>('');
  const [cableType, setCableType] = useState<CableType>('power');
  const [redundancy, setRedundancy] = useState<RedundancyType>('none');
  const [isGrounded, setIsGrounded] = useState(false);
  
  // Physics inputs
  const [current, setCurrent] = useState(10);
  const [voltage, setVoltage] = useState(28);
  const [crossSection, setCrossSection] = useState(4.0);

  const handleCreateCable = () => {
    if (cableStart && cableEnd && cableStart !== cableEnd) {
      addCable(cableStart, cableEnd, cableType, redundancy);
      // We need to find the newly created cable to update its physics
      // This is a bit hacky because addCable doesn't return the ID.
      // Ideally we'd refactor addCable to return ID or accept params.
      // For now, let's just assume the last added cable is the one.
      setTimeout(() => {
        const state = useStore.getState();
        const newCable = state.cables[state.cables.length - 1];
        if (newCable) {
           state.updateCablePhysics(newCable.id, { current, voltage, crossSection });
        }
      }, 100);
    }
  };
  
  // Update defaults when type changes
  React.useEffect(() => {
    switch (cableType) {
      case 'power': setCurrent(10); setVoltage(28); setCrossSection(4.0); break;
      case 'hv': setCurrent(1); setVoltage(1000); setCrossSection(2.5); break;
      case 'data': setCurrent(0.5); setVoltage(5); setCrossSection(0.25); break;
      case 'sensitive': setCurrent(0.1); setVoltage(3.3); setCrossSection(0.14); break;
      case 'signal': setCurrent(0.5); setVoltage(12); setCrossSection(0.34); break;
    }
  }, [cableType]);

  const exportJSON = () => {
    const state = useStore.getState();
    const data = {
      nodes: state.nodes,
      obstacles: state.obstacles,
      cables: state.cables,
      metadata: {
        version: "1.0.0",
        standard: "ECSS-E-ST-20",
        date: new Date().toISOString()
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harness_routing_project.json';
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-700 text-slate-200 w-64">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          GeoSynth Pro
        </h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Space Harness Engineering</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Components Library */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
            <Box size={12} /> Components
          </h3>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
             <input type="checkbox" checked={isGrounded} onChange={e => setIsGrounded(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
             <span>Mark as Grounded (GND)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ToolButton label="Connector" onClick={() => addNode({ type: 'connector', position: { x: Math.random()*4-2, y: Math.random()*2, z: Math.random()*4-2 }, name: `J-${Math.floor(Math.random()*100)}`, grounded: isGrounded })} />
            <ToolButton label="Grounding" onClick={() => addNode({ type: 'grounding-point', position: { x: Math.random()*4-2, y: 0, z: Math.random()*4-2 }, name: `GND-${Math.floor(Math.random()*10)}`, grounded: true })} />
            <ToolButton label="P-Clip" onClick={() => addNode({ type: 'p-clip', position: { x: Math.random()*4-2, y: 0.5, z: Math.random()*4-2 }, name: `P-${Math.floor(Math.random()*100)}` })} />
            <ToolButton label="Obstacle" onClick={() => addObstacle({ type: 'uncrossable', position: { x: Math.random()*4-2, y: 1, z: Math.random()*4-2 }, size: { x: 1, y: 2, z: 1 } })} />
            <ToolButton label="Interference Zone" onClick={() => addObstacle({ type: 'interference', position: { x: Math.random()*4-2, y: 1, z: Math.random()*4-2 }, size: { x: 1.5, y: 1.5, z: 1.5 } })} />
          </div>
        </div>

        {/* Cable Routing */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
            <Zap size={12} /> Routing
          </h3>
          <div className="space-y-3 bg-slate-800 p-3 rounded border border-slate-700">
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1">Start Node</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={cableStart} onChange={e => setCableStart(e.target.value)}>
                <option value="">Select...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1">End Node</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={cableEnd} onChange={e => setCableEnd(e.target.value)}>
                <option value="">Select...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1">Harness Class</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={cableType} onChange={e => setCableType(e.target.value as CableType)}>
                <option value="power">POWER (High Current/HV)</option>
                <option value="signal">SIGNAL (Data/Telemetry)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1">Redundancy Chain</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={redundancy} onChange={e => setRedundancy(e.target.value as RedundancyType)}>
                <option value="none">None (Simplex)</option>
                <option value="A">Chain A (Primary)</option>
                <option value="B">Chain B (Redundant)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-slate-500 block mb-1">Current (A)</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={current} onChange={e => setCurrent(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 block mb-1">Voltage (V)</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={voltage} onChange={e => setVoltage(Number(e.target.value))} />
              </div>
            </div>
            <div>
               <label className="text-[10px] uppercase text-slate-500 block mb-1">Cross-Section (mm²)</label>
               <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1" value={crossSection} onChange={e => setCrossSection(Number(e.target.value))} />
            </div>

            <button 
              onClick={handleCreateCable}
              disabled={!cableStart || !cableEnd}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold uppercase"
            >
              Route Harness
            </button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
            <Play size={12} /> Simulation
          </h3>
          <div className="space-y-2">
             <div className="flex items-center justify-between text-xs text-slate-400 cursor-pointer" onClick={() => toggleViewSetting('showThermal')}>
                <span>Thermal Field</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${viewSettings.showThermal ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${viewSettings.showThermal ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
             </div>
             <div className="flex items-center justify-between text-xs text-slate-400 cursor-pointer" onClick={() => toggleViewSetting('showEMC')}>
                <span>EMC Radiation</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${viewSettings.showEMC ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${viewSettings.showEMC ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
             </div>
             <div className="flex items-center justify-between text-xs text-slate-400 cursor-pointer" onClick={() => toggleViewSetting('showGrid')}>
                <span>Reference Grid</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${viewSettings.showGrid ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${viewSettings.showGrid ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
             </div>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <button onClick={exportJSON} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs flex items-center justify-center gap-2">
          <Download size={14} /> Export Project
        </button>
      </div>
    </div>
  );
};

const ToolButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded transition-all"
  >
    <Plus size={16} className="mb-1 text-slate-400" />
    <span className="text-[10px] font-medium text-slate-300">{label}</span>
  </button>
);
