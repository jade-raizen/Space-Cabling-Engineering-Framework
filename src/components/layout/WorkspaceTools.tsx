import React, { useRef } from 'react';
import { useStore } from '../../store/useStore';
import { CableType } from '../../entities/electrical/Wire';
import { Settings, Play, Trash2, RefreshCw, Box, Zap, Plus, X, Upload } from 'lucide-react';

export const WorkspaceTools = () => {
  const { 
    toolSettings, 
    setToolSetting, 
    viewSettings, 
    setGridSize, 
    checkCompliance, 
    clearWorkspace, 
    generateRandomSimulation,
    selectedId,
    obstacles,
    updateObstacle,
    removeObstacle,
    importCAD,
    cables
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedObstacle = obstacles.find(o => o.id === selectedId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let replace = false;
      if (obstacles.length > 0) {
        // In a real app, use a custom modal. For now, browser confirm is sufficient.
        replace = window.confirm(
          "Existing geometry detected.\n\nClick OK to OVERWRITE existing objects.\nClick Cancel to APPEND to existing objects."
        );
      }
      importCAD(file, replace);
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ cables, obstacles, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_export.json';
    a.click();
  };

  const handleObstacleTypeChange = (type: string) => {
    if (selectedObstacle) {
      updateObstacle(selectedObstacle.id, { type: type as any });
    }
  };

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col h-full p-4 gap-6 overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-300 pb-2">
        Workspace Tools
      </h2>

      {/* 0. Import CAD */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">0. Import Geometry</h3>
        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".step,.stp,.stl,.obj" 
            onChange={handleFileChange}
          />
          <button 
            className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs py-2 px-3 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Import STEP / CAD
          </button>
          <p className="text-[10px] text-gray-400 text-center">Supports .step, .stp, .stl, .obj</p>
        </div>
      </div>

      {/* 1. Environment Config */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">1. Environment Config</h3>
        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Obstacle Type:</label>
            <select 
              className="text-xs p-1 border border-gray-300 rounded"
              value={selectedObstacle ? selectedObstacle.type : 'uncrossable'} 
              onChange={(e) => handleObstacleTypeChange(e.target.value)}
              disabled={!selectedObstacle && toolSettings.interactionMode !== 'draw-obstacle'}
            >
              <option value="uncrossable">uncrossable</option>
              <option value="interference">interference</option>
              <option value="hole">hole</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Height (mm):</label>
            <input 
              type="number" 
              className="text-xs p-1 border border-gray-300 rounded"
              value={selectedObstacle ? selectedObstacle.size.y : toolSettings.obstacleHeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (selectedObstacle) {
                   updateObstacle(selectedObstacle.id, { size: { ...selectedObstacle.size, y: val } });
                } else {
                   setToolSetting('obstacleHeight', val);
                }
              }}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button 
              className={`flex-1 text-xs py-1 px-2 rounded border transition-colors flex items-center justify-center gap-1 ${
                toolSettings.interactionMode === 'draw-obstacle' 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setToolSetting('interactionMode', toolSettings.interactionMode === 'draw-obstacle' ? 'select' : 'draw-obstacle')}
            >
              <Plus size={12} />
              Add Obstacle
            </button>
            
            {selectedObstacle && (
              <button 
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs py-1 px-2 rounded transition-colors flex items-center justify-center gap-1"
                onClick={() => removeObstacle(selectedObstacle.id)}
              >
                <X size={12} />
                Remove
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500">Grid Size (mm):</label>
            <input 
              type="number" 
              className="text-xs p-1 border border-gray-300 rounded"
              value={viewSettings.gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* ... (Rest of the file remains same) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">2. Cable Placement</h3>
        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Signal Category:</label>
            <select 
              className="text-xs p-1 border border-gray-300 rounded uppercase"
              value={toolSettings.selectedSignalCategory}
              onChange={(e) => setToolSetting('selectedSignalCategory', e.target.value as CableType)}
            >
              <option value="data">DATA</option>
              <option value="power">POWER</option>
              <option value="sensitive">SENSITIVE</option>
              <option value="hv">HV</option>
            </select>
          </div>

          <button 
            className={`text-xs py-2 px-2 rounded border transition-colors font-medium ${
              toolSettings.interactionMode === 'set-start' 
                ? 'bg-green-600 text-white border-green-700' 
                : toolSettings.tempStartNodeId 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setToolSetting('interactionMode', toolSettings.interactionMode === 'set-start' ? 'select' : 'set-start')}
          >
            {toolSettings.tempStartNodeId ? `Start: Node ${toolSettings.tempStartNodeId.slice(0,4)}` : 'Set Start Point (S)'}
          </button>

          <button 
            className={`text-xs py-2 px-2 rounded border transition-colors font-medium ${
              toolSettings.interactionMode === 'set-end' 
                ? 'bg-red-600 text-white border-red-700' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setToolSetting('interactionMode', toolSettings.interactionMode === 'set-end' ? 'select' : 'set-end')}
            disabled={!toolSettings.tempStartNodeId}
          >
            Set End Point (E)
          </button>

          <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-gray-500">Infrastructure:</label>
            <div className="flex gap-2">
              <button 
                className={`flex-1 text-xs py-1 rounded border ${
                  toolSettings.infrastructureType === 'raceway' 
                    ? 'bg-blue-100 border-blue-300 text-blue-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
                onClick={() => setToolSetting('infrastructureType', toolSettings.infrastructureType === 'raceway' ? null : 'raceway')}
              >
                Raceway
              </button>
              <button 
                className={`flex-1 text-xs py-1 rounded border ${
                  toolSettings.infrastructureType === 'holder' 
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
                onClick={() => setToolSetting('infrastructureType', toolSettings.infrastructureType === 'holder' ? null : 'holder')}
              >
                Holder
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. AI & Automation */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-600">3. AI & Automation</h3>
        <div className="flex flex-col gap-2">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
            onClick={checkCompliance}
          >
            <RefreshCw size={14} />
            Recalculate Routes
          </button>
          
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
            onClick={generateRandomSimulation}
          >
            <Play size={14} />
            Generate Random Simulation
          </button>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-600">Output</h3>
        <button 
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 px-4 rounded shadow transition-colors flex items-center justify-center gap-2"
          onClick={handleExport}
        >
          <Upload size={14} className="rotate-180" /> {/* Reusing Upload icon rotated as Download */}
          EXPORT PROJECT (JSON)
        </button>

        <button 
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 px-4 rounded shadow transition-colors flex items-center justify-center gap-2"
          onClick={clearWorkspace}
        >
          <Trash2 size={14} />
          CLEAR WORKSPACE
        </button>
      </div>

    </div>
  );
};
