import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { View3DInteractive } from '../viewports/View3DInteractive';
import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';

const Canvas2D = ({ draw, title }: { draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, title: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, canvas.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, canvas.width, canvas.height);
  }, [draw]);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300 shadow-sm">
      <div className="bg-gray-100 px-2 py-1 border-b border-gray-300 text-xs font-bold text-gray-700">
        {title}
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export const AnalysisDashboard = () => {
  const { obstacles, analysisSettings, setAnalysisSetting, addLog } = useStore();
  const [processedData, setProcessedData] = useState<any[]>([]);

  // Process Logic (Mimics Python script)
  useEffect(() => {
    const data = obstacles.map(obs => {
      const { x, y, z } = obs.position;
      const { x: dx, y: dy, z: dz } = obs.size;
      
      // Simulated face count based on volume/complexity (random for demo)
      const faceCount = Math.floor((dx * dy * dz) * 5) + 4; 
      
      let isEquipment = false;
      if (analysisSettings.smartMode) {
        isEquipment = faceCount >= analysisSettings.faceThreshold;
      } else {
        isEquipment = dy > Math.max(dx, dz) * 0.1;
      }

      return {
        ...obs,
        bounds: {
          x: [x - dx/2, x + dx/2],
          y: [y - dy/2, y + dy/2],
          z: [z - dz/2, z + dz/2]
        },
        dims: [dx, dy, dz],
        faces: faceCount,
        type: isEquipment ? 'EQUIPMENT' : 'STRUCTURE',
        center: [x, z] // XZ plane for 2D views
      };
    });
    setProcessedData(data);
  }, [obstacles, analysisSettings]);

  // View 1: CAD Source (BBox)
  const drawSource = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) / 10;
    const offsetX = w / 2;
    const offsetY = h / 2;

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;

    processedData.forEach(obj => {
      const x = obj.position.x * scale + offsetX;
      const y = obj.position.z * scale + offsetY; // Z is Y in 2D top-down
      const rw = obj.size.x * scale;
      const rh = obj.size.z * scale;
      ctx.strokeRect(x - rw/2, y - rh/2, rw, rh);
    });
  };

  // View 2: Classification
  const drawClassification = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) / 10;
    const offsetX = w / 2;
    const offsetY = h / 2;

    processedData.forEach(obj => {
      const x = obj.position.x * scale + offsetX;
      const y = obj.position.z * scale + offsetY;
      const rw = obj.size.x * scale;
      const rh = obj.size.z * scale;
      
      ctx.fillStyle = obj.type === 'EQUIPMENT' ? 'rgba(231, 76, 60, 0.7)' : 'rgba(189, 195, 199, 0.7)';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      
      ctx.fillRect(x - rw/2, y - rh/2, rw, rh);
      ctx.strokeRect(x - rw/2, y - rh/2, rw, rh);
    });
  };

  // View 4: Voronoi
  const drawVoronoi = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) / 10;
    const offsetX = w / 2;
    const offsetY = h / 2;

    const points = processedData
      .filter(obj => obj.type === 'EQUIPMENT')
      .map(obj => [
        obj.position.x * scale + offsetX,
        obj.position.z * scale + offsetY
      ] as [number, number]);

    if (points.length < 2) return;

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, w, h]);

    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    voronoi.render(ctx);
    ctx.stroke();

    ctx.fillStyle = 'red';
    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "geosynth_analysis.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog('success', 'Data exported to JSON', 'Analysis');
  };

  return (
    <div className="flex flex-col h-full bg-[#2c3e50]">
      {/* Header */}
      <div className="h-20 bg-[#1c2833] flex items-center px-4 shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-4 mr-8 border-r border-gray-600 pr-8">
           <div className="text-white font-bold text-lg">GeoSynth Pro</div>
           <div className="text-[#f1c40f] font-bold text-sm">Analyseur Topologique</div>
        </div>

        {/* Files Group */}
        <div className="flex flex-col gap-1 mr-8">
           <span className="text-[10px] text-gray-400 uppercase font-bold">Fichiers</span>
           <div className="flex gap-2">
              <button className="px-3 py-1 bg-[#2980b9] text-white text-xs rounded hover:bg-[#3498db]" onClick={() => addLog('info', 'Loading STEP file...', 'System')}>📂 CHARGER STEP</button>
              <button className="px-3 py-1 bg-[#8e44ad] text-white text-xs rounded hover:bg-[#9b59b6]" onClick={() => setProcessedData([...processedData])}>🔄 RAFRAÎCHIR</button>
              <button className="px-3 py-1 bg-[#27ae60] text-white text-xs rounded hover:bg-[#2ecc71]" onClick={handleExport}>💾 EXPORTER JSON</button>
           </div>
        </div>

        {/* Analysis Group */}
        <div className="flex flex-col gap-1 mr-8">
           <span className="text-[10px] text-gray-400 uppercase font-bold">Analyse</span>
           <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white text-xs cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={analysisSettings.smartMode} 
                   onChange={(e) => setAnalysisSetting('smartMode', e.target.checked)}
                   className="accent-[#2ecc71]"
                 />
                 MODE SMART
              </label>
              <div className="flex items-center gap-2">
                 <span className="text-white text-xs">Seuil Faces: {analysisSettings.faceThreshold}</span>
                 <input 
                   type="range" 
                   min="4" max="60" 
                   value={analysisSettings.faceThreshold} 
                   onChange={(e) => setAnalysisSetting('faceThreshold', parseInt(e.target.value))}
                   className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                 />
              </div>
           </div>
        </div>

        <div className="ml-auto text-[#f1c40f] font-bold text-sm">
           Prêt | {processedData.length} objets
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 p-1">
         <Canvas2D title="1. CAD SOURCE (BBOX)" draw={drawSource} />
         <Canvas2D title="2. CLASSIFICATION (EQUIP/STRUCT)" draw={drawClassification} />
         
         <div className="flex flex-col h-full bg-white border border-gray-300 shadow-sm">
            <div className="bg-gray-100 px-2 py-1 border-b border-gray-300 text-xs font-bold text-gray-700">
              3. VOLUMÉTRIE 3D
            </div>
            <div className="flex-1 relative bg-slate-900">
               <View3DInteractive />
            </div>
         </div>

         <Canvas2D title="4. ROUTAGE VORONOI" draw={drawVoronoi} />
      </div>
    </div>
  );
};
