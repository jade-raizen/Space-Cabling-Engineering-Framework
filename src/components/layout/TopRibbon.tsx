import React from 'react';
import { useStore } from '../../store/useStore';
import { Box, Move, Maximize, RotateCw, Type, Palette } from 'lucide-react';

export const TopRibbon = () => {
  const { 
    selectedId, 
    obstacles, 
    nodes, 
    updateObstacle, 
    updateNode 
  } = useStore();

  const selectedObstacle = obstacles.find(o => o.id === selectedId);
  const selectedNode = nodes.find(n => n.id === selectedId);

  if (!selectedId) {
    return (
      <div className="h-16 bg-gray-100 border-b border-gray-300 flex items-center px-4 text-gray-400 text-sm">
        Select an object to edit its properties
      </div>
    );
  }

  return (
    <div className="h-16 bg-gray-100 border-b border-gray-300 flex items-center px-4 gap-6 overflow-x-auto whitespace-nowrap">
      
      {/* Identity Group */}
      <div className="flex flex-col gap-1 border-r border-gray-300 pr-4">
        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
          <Type size={10} /> Identity
        </span>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            className="text-xs border border-gray-300 rounded px-2 py-1 w-32"
            value={selectedObstacle?.name || selectedNode?.name || ''}
            onChange={(e) => {
              if (selectedObstacle) updateObstacle(selectedObstacle.id, { name: e.target.value });
              if (selectedNode) updateNode(selectedNode.id, { ...selectedNode.position }); // Hack: updateNode signature in store is (id, pos), need to fix if we want to update name
            }}
            placeholder="Name"
          />
          {selectedObstacle && (
            <input 
              type="color" 
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer p-0.5 bg-white"
              value={selectedObstacle.color || '#ef4444'}
              onChange={(e) => updateObstacle(selectedObstacle.id, { color: e.target.value })}
              title="Object Color"
            />
          )}
        </div>
      </div>

      {/* Position Group */}
      <div className="flex flex-col gap-1 border-r border-gray-300 pr-4">
        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
          <Move size={10} /> Position (X, Y, Z)
        </span>
        <div className="flex items-center gap-1">
          {(['x', 'y', 'z'] as const).map(axis => (
            <div key={axis} className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">{axis}</span>
              <input 
                type="number" 
                className="text-xs border border-gray-300 rounded pl-4 pr-1 py-1 w-16 text-right"
                value={selectedObstacle?.position[axis] ?? selectedNode?.position[axis] ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (selectedObstacle) {
                    updateObstacle(selectedObstacle.id, { position: { ...selectedObstacle.position, [axis]: val } });
                  }
                  if (selectedNode) {
                    updateNode(selectedNode.id, { ...selectedNode.position, [axis]: val });
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size Group (Obstacles Only) */}
      {selectedObstacle && (
        <div className="flex flex-col gap-1 border-r border-gray-300 pr-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
            <Maximize size={10} /> Dimensions
          </span>
          <div className="flex items-center gap-2">
            {/* Shape Selector */}
            <select 
              className="text-xs border border-gray-300 rounded px-1 py-1 w-20 bg-white"
              value={selectedObstacle.shape || 'box'}
              onChange={(e) => updateObstacle(selectedObstacle.id, { shape: e.target.value as any })}
            >
              <option value="box">Box</option>
              <option value="sphere">Sphere</option>
              <option value="cylinder">Cylinder</option>
            </select>

            {/* Dimensions based on shape */}
            {(selectedObstacle.shape === 'box' || !selectedObstacle.shape) && (
              <div className="flex items-center gap-1">
                {(['x', 'y', 'z'] as const).map(axis => (
                  <div key={axis} className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">{axis === 'x' ? 'W' : axis === 'y' ? 'H' : 'D'}</span>
                    <input 
                      type="number" 
                      className="text-xs border border-gray-300 rounded pl-4 pr-1 py-1 w-12 text-right"
                      value={selectedObstacle.size[axis]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateObstacle(selectedObstacle.id, { size: { ...selectedObstacle.size, [axis]: val } });
                      }}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                ))}
              </div>
            )}

            {(selectedObstacle.shape === 'sphere' || selectedObstacle.shape === 'cylinder') && (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">R</span>
                  <input 
                    type="number" 
                    className="text-xs border border-gray-300 rounded pl-4 pr-1 py-1 w-12 text-right"
                    value={selectedObstacle.radius || 1}
                    onChange={(e) => updateObstacle(selectedObstacle.id, { radius: parseFloat(e.target.value) })}
                    min="0.1"
                    step="0.1"
                  />
                </div>
                {selectedObstacle.shape === 'cylinder' && (
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">H</span>
                    <input 
                      type="number" 
                      className="text-xs border border-gray-300 rounded pl-4 pr-1 py-1 w-12 text-right"
                      value={selectedObstacle.size.y}
                      onChange={(e) => updateObstacle(selectedObstacle.id, { size: { ...selectedObstacle.size, y: parseFloat(e.target.value) } })}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rotation Group (Obstacles Only - Placeholder for now as rotation isn't fully in store logic yet) */}
      {selectedObstacle && (
        <div className="flex flex-col gap-1 border-r border-gray-300 pr-4 opacity-50" title="Rotation not yet implemented">
          <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
            <RotateCw size={10} /> Rotation
          </span>
          <div className="flex items-center gap-1">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">{axis}</span>
                <input 
                  type="number" 
                  className="text-xs border border-gray-300 rounded pl-4 pr-1 py-1 w-16 text-right"
                  value={0}
                  disabled
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
          <Box size={10} /> Type
        </span>
        <select 
          className="text-xs border border-gray-300 rounded px-2 py-1 w-32 bg-white"
          value={selectedObstacle?.type || selectedNode?.type || ''}
          onChange={(e) => {
            if (selectedObstacle) updateObstacle(selectedObstacle.id, { type: e.target.value as any });
            // Node type update not fully supported in store yet without casting, skipping for now or adding later
          }}
        >
          {selectedObstacle ? (
            <>
              <option value="uncrossable">Uncrossable</option>
              <option value="interference">Interference</option>
              <option value="hole">Hole</option>
              <option value="cable-only">Cable Only</option>
            </>
          ) : (
            <>
              <option value="connector">Connector</option>
              <option value="grounding-point">Grounding Point</option>
              <option value="p-clip">P-Clip</option>
            </>
          )}
        </select>
      </div>

    </div>
  );
};
