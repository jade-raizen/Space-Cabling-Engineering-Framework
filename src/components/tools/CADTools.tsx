import React, { useRef, useState } from 'react';
import { useStore, Obstacle, CableType } from '../../store/useStore';
import { Upload, Settings, Eye, EyeOff, Box, Ban, Activity, Maximize } from 'lucide-react';

export const CADTools = () => {
  const { importCAD, obstacles, updateObstacle, viewSettings, toggleViewMode } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedObsId, setSelectedObsId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importCAD(e.target.files[0]);
    }
  };

  const selectedObs = obstacles.find(o => o.id === selectedObsId);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 w-64">
      {/* View Mode Toggle */}
      <div className="bg-slate-800 p-2 rounded border border-slate-700 shadow-lg flex items-center justify-between">
         <span className="text-xs font-bold text-slate-300 uppercase">View Mode</span>
         <button 
           onClick={toggleViewMode}
           className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
         >
           {viewSettings.viewMode === '3d' ? <Box size={14} /> : <Maximize size={14} />}
           {viewSettings.viewMode === '3d' ? '3D View' : '2D Plan'}
         </button>
      </div>

      {/* CAD Import */}
      <div className="bg-slate-800 p-3 rounded border border-slate-700 shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
          <Upload size={12} /> CAD Import (STEP)
        </h3>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".step,.stp" 
          onChange={handleFileChange} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase flex items-center justify-center gap-2"
        >
          <Upload size={14} /> Load STEP File
        </button>
      </div>

      {/* Object Labeling / Properties */}
      {obstacles.length > 0 && (
        <div className="bg-slate-800 p-3 rounded border border-slate-700 shadow-lg max-h-96 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <Settings size={12} /> Object Properties
          </h3>
          <div className="space-y-2">
            {obstacles.map(obs => (
              <div key={obs.id} className={`p-2 rounded border ${selectedObsId === obs.id ? 'border-blue-500 bg-slate-700' : 'border-slate-600 bg-slate-900'}`}>
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setSelectedObsId(selectedObsId === obs.id ? null : obs.id)}
                >
                  <span className="text-xs font-mono text-slate-300 truncate w-32">{obs.name || obs.id.slice(0,8)}</span>
                  <span className={`text-[10px] px-1 rounded ${
                    obs.type === 'uncrossable' ? 'bg-red-900 text-red-200' : 
                    obs.type === 'interference' ? 'bg-orange-900 text-orange-200' :
                    obs.type === 'hole' ? 'bg-emerald-900 text-emerald-200' : 'bg-blue-900 text-blue-200'
                  }`}>
                    {obs.type}
                  </span>
                </div>
                
                {selectedObsId === obs.id && (
                  <div className="space-y-2 pt-2 border-t border-slate-600">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Type</label>
                      <select 
                        className="w-full bg-slate-800 border border-slate-600 rounded text-xs p-1 text-slate-200"
                        value={obs.type}
                        onChange={(e) => updateObstacle(obs.id, { type: e.target.value as any })}
                      >
                        <option value="uncrossable">Uncrossable (Solid)</option>
                        <option value="interference">Interference Zone (Warning)</option>
                        <option value="hole">Hole / Feedthrough (Passable)</option>
                        <option value="cable-only">Restricted (Type Specific)</option>
                      </select>
                    </div>
                    
                    {obs.type === 'cable-only' && (
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Allowed Cables</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 text-xs text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={obs.allowedCableTypes?.includes('power')}
                              onChange={(e) => {
                                const types = obs.allowedCableTypes || [];
                                updateObstacle(obs.id, { 
                                  allowedCableTypes: e.target.checked 
                                    ? [...types, 'power'] 
                                    : types.filter(t => t !== 'power') 
                                });
                              }}
                            /> Power
                          </label>
                          <label className="flex items-center gap-1 text-xs text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={obs.allowedCableTypes?.includes('signal')}
                              onChange={(e) => {
                                const types = obs.allowedCableTypes || [];
                                updateObstacle(obs.id, { 
                                  allowedCableTypes: e.target.checked 
                                    ? [...types, 'signal'] 
                                    : types.filter(t => t !== 'signal') 
                                });
                              }}
                            /> Signal
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
