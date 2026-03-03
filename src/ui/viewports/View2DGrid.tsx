import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { ProjectNode, Obstacle } from '../../entities/mechanical/Connector';
import { CableSegment } from '../../entities/electrical/Wire';

export const View2DGrid = () => {
  const { 
    nodes, 
    obstacles, 
    cables, 
    viewSettings, 
    toolSettings, 
    setToolSetting, 
    addCable, 
    selectObject, 
    selectedId,
    addObstacle, 
    updateObstacle, 
    updateNode
  } = useStore();
  
  const [scale, setScale] = useState(40); // Pixels per unit
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Center offset
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragObject, setDragObject] = useState<{ id: string, type: 'obstacle' | 'node', startPos: {x: number, z: number} } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { interactionMode, tempStartNodeId } = toolSettings;

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
        // Center the view initially
        setOffset({ x: entry.contentRect.width / 2, y: entry.contentRect.height / 2 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to transform world coordinates to canvas coordinates
  const toCanvas = useCallback((x: number, z: number) => ({
    x: x * scale + offset.x,
    y: z * scale + offset.y
  }), [scale, offset]);

  // Helper to transform canvas coordinates to world coordinates
  const toWorld = useCallback((cx: number, cy: number) => ({
    x: (cx - offset.x) / scale,
    z: (cy - offset.y) / scale
  }), [scale, offset]);

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.max(5, Math.min(100, scale - e.deltaY * 0.05));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldPos = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Pan
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      if (toolSettings.interactionMode === 'draw-obstacle') {
        addObstacle({
          position: { x: Math.round(worldPos.x), y: 0, z: Math.round(worldPos.z) },
          size: { x: 2, y: toolSettings.obstacleHeight || 2, z: 2 },
          type: 'uncrossable',
          name: 'New Obstacle'
        });
        setToolSetting('interactionMode', 'select');
        return;
      }

      // Check for node clicks
      const clickedNode = nodes.find(n => {
        const dist = Math.sqrt(Math.pow(n.position.x - worldPos.x, 2) + Math.pow(n.position.z - worldPos.z, 2));
        return dist < 0.5;
      });

      if (clickedNode) {
        if (toolSettings.interactionMode === 'set-start') {
          setToolSetting('tempStartNodeId', clickedNode.id);
          setToolSetting('interactionMode', 'set-end');
        } else if (toolSettings.interactionMode === 'set-end') {
          if (tempStartNodeId && tempStartNodeId !== clickedNode.id) {
            addCable(tempStartNodeId, clickedNode.id, toolSettings.selectedSignalCategory);
            setToolSetting('tempStartNodeId', null);
            setToolSetting('interactionMode', 'select');
          }
        } else {
          selectObject(clickedNode.id);
          setDragObject({ id: clickedNode.id, type: 'node', startPos: { x: worldPos.x, z: worldPos.z } });
        }
        return;
      }

      // Check for obstacle clicks
      const clickedObstacle = obstacles.find(obs => {
        const halfX = obs.size.x / 2;
        const halfZ = obs.size.z / 2;
        return worldPos.x >= obs.position.x - halfX && worldPos.x <= obs.position.x + halfX &&
               worldPos.z >= obs.position.z - halfZ && worldPos.z <= obs.position.z + halfZ;
      });

      if (clickedObstacle) {
        selectObject(clickedObstacle.id);
        setDragObject({ id: clickedObstacle.id, type: 'obstacle', startPos: { x: worldPos.x, z: worldPos.z } });
      } else {
        selectObject(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (dragStart) { // Panning
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (dragObject) { // Dragging Object
      const worldPos = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      
      // Calculate delta from drag start (not implemented perfectly here, simplified to absolute position for now or delta)
      // Actually, let's just snap to grid or move directly
      
      if (dragObject.type === 'obstacle') {
        const obs = obstacles.find(o => o.id === dragObject.id);
        if (obs) {
           updateObstacle(obs.id, { position: { ...obs.position, x: worldPos.x, z: worldPos.z } });
        }
      } else if (dragObject.type === 'node') {
        const node = nodes.find(n => n.id === dragObject.id);
        if (node) {
           updateNode(node.id, { ...node.position, x: worldPos.x, z: worldPos.z });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setDragObject(null);
  };

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    if (viewSettings.showGrid) {
      ctx.beginPath();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      const startX = Math.floor(-offset.x / scale);
      const endX = Math.floor((canvas.width - offset.x) / scale);
      const startY = Math.floor(-offset.y / scale);
      const endY = Math.floor((canvas.height - offset.y) / scale);

      for (let x = startX; x <= endX; x++) {
        const pos = toCanvas(x, 0);
        ctx.moveTo(pos.x, 0);
        ctx.lineTo(pos.x, canvas.height);
      }
      for (let y = startY; y <= endY; y++) {
        const pos = toCanvas(0, y);
        ctx.moveTo(0, pos.y);
        ctx.lineTo(canvas.width, pos.y);
      }
      ctx.stroke();

      // Axes
      ctx.beginPath();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      const origin = toCanvas(0, 0);
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, canvas.height);
      ctx.moveTo(0, origin.y);
      ctx.lineTo(canvas.width, origin.y);
      ctx.stroke();
    }

    // Draw Obstacles
    obstacles.forEach(obs => {
      const shape = obs.shape || 'box';
      const radius = obs.radius || 1;
      
      ctx.fillStyle = obs.color ? obs.color + '33' : // Add transparency
                      obs.type === 'uncrossable' ? 'rgba(239, 68, 68, 0.2)' : 
                      obs.type === 'interference' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = obs.color ? obs.color :
                        obs.type === 'uncrossable' ? '#ef4444' : 
                        obs.type === 'interference' ? '#f97316' : '#10b981';
      
      if (selectedId === obs.id) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
      } else {
        ctx.lineWidth = 1;
      }

      if (shape === 'box') {
        const pos = toCanvas(obs.position.x - obs.size.x / 2, obs.position.z - obs.size.z / 2);
        const width = obs.size.x * scale;
        const height = obs.size.z * scale;
        
        ctx.fillRect(pos.x, pos.y, width, height);
        ctx.strokeRect(pos.x, pos.y, width, height);
      } else {
        // Sphere or Cylinder (Top-down view is a circle)
        const center = toCanvas(obs.position.x, obs.position.z);
        const r = radius * scale;
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw Cables
    cables.forEach(cable => {
      if (cable.path.length < 2) return;
      
      ctx.beginPath();
      const start = toCanvas(cable.path[0].x, cable.path[0].z);
      ctx.moveTo(start.x, start.y);
      
      for (let i = 1; i < cable.path.length; i++) {
        const p = toCanvas(cable.path[i].x, cable.path[i].z);
        ctx.lineTo(p.x, p.y);
      }

      ctx.strokeStyle = cable.type === 'power' ? '#ef4444' : 
                        cable.type === 'sensitive' ? '#ec4899' : '#3b82f6';
      ctx.lineWidth = cable.type === 'power' ? 3 : 2;
      if (cable.type === 'sensitive') ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);
      
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Nodes
    nodes.forEach(node => {
      const pos = toCanvas(node.position.x, node.position.z);
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = node.type === 'connector' ? '#fbbf24' : '#facc15';
      if (selectedId === node.id || tempStartNodeId === node.id) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
      }
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, pos.x, pos.y + 18);
    });

  }, [nodes, obstacles, cables, viewSettings, scale, offset, selectedId, tempStartNodeId, dimensions, toCanvas]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-crosshair block"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded text-xs text-gray-500 pointer-events-none border border-gray-200 shadow-sm">
        Scale: {scale.toFixed(0)} px/unit | Pan: Alt+Drag / Middle Click
      </div>
    </div>
  );
};
