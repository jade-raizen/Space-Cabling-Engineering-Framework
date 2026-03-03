import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Text, CatmullRomLine, TransformControls } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';
import { ProjectNode, Obstacle } from '../../entities/mechanical/Connector';
import { CableSegment } from '../../entities/electrical/Wire';
import { MousePointer2, Box, Zap, Move } from 'lucide-react';

const NodeMesh = ({ node, selected, mode, onClick }: { node: ProjectNode; selected: boolean; mode: string; onClick: () => void }) => {
  const { updateNode } = useStore();
  const meshRef = useRef<THREE.Group>(null);
  const color = node.type === 'connector' ? '#fbbf24' : node.type === 'grounding-point' ? '#facc15' : '#ffffff';
  const shape = node.type === 'connector' ? <boxGeometry args={[0.3, 0.3, 0.3]} /> : <sphereGeometry args={[0.2]} />;
  
  return (
    <>
      <group 
        ref={meshRef}
        position={[node.position.x, node.position.y, node.position.z]} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <mesh>
          {shape}
          <meshStandardMaterial color={selected ? '#00ffff' : color} />
        </mesh>
        <Text position={[0, 0.4, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
          {node.name}
        </Text>
        {node.grounded && (
           <Text position={[0, 0.6, 0]} fontSize={0.15} color="#4ade80" anchorX="center" anchorY="middle">
             [GND]
           </Text>
        )}
      </group>
      {selected && mode === 'select' && meshRef.current && (
        <TransformControls 
          object={meshRef.current} 
          mode="translate"
          onMouseUp={() => {
            if (meshRef.current) {
              const { x, y, z } = meshRef.current.position;
              updateNode(node.id, { x, y, z });
            }
          }}
        />
      )}
    </>
  );
};

const ObstacleMesh = ({ obstacle, selected, mode, onClick }: { obstacle: Obstacle, selected: boolean, mode: string, onClick: () => void }) => {
  const { updateObstacle } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  
  const isInterference = obstacle.type === 'interference';
  const isHole = obstacle.type === 'hole';
  const isCableOnly = obstacle.type === 'cable-only';
  
  let color = '#ef4444'; // Uncrossable
  if (isInterference) color = '#f97316';
  if (isHole) color = '#10b981';
  if (isCableOnly) color = '#3b82f6';
  
  if (obstacle.color) color = obstacle.color;

  const shape = obstacle.shape || 'box';
  const radius = obstacle.radius || 1;

  return (
    <>
      <mesh 
        ref={meshRef}
        position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {shape === 'box' && <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />}
        {shape === 'sphere' && <sphereGeometry args={[radius, 32, 32]} />}
        {shape === 'cylinder' && <cylinderGeometry args={[radius, radius, obstacle.size.y, 32]} />}

        <meshStandardMaterial 
          color={hover || selected ? '#00ffff' : color} 
          transparent 
          opacity={isInterference || isHole ? 0.3 : 0.6} 
          wireframe={isHole}
        />
        
        {/* Selection Highlight */}
        {selected && (
          <lineSegments>
            {shape === 'box' && <edgesGeometry args={[new THREE.BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z)]} />}
            {shape === 'sphere' && <edgesGeometry args={[new THREE.SphereGeometry(radius, 32, 32)]} />}
            {shape === 'cylinder' && <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, obstacle.size.y, 32)]} />}
            <lineBasicMaterial color="#00ffff" linewidth={2} />
          </lineSegments>
        )}
        
        {!isInterference && !isHole && !selected && (
          <lineSegments>
            {shape === 'box' && <edgesGeometry args={[new THREE.BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z)]} />}
            {shape === 'sphere' && <edgesGeometry args={[new THREE.SphereGeometry(radius, 32, 32)]} />}
            {shape === 'cylinder' && <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, obstacle.size.y, 32)]} />}
            <lineBasicMaterial color="black" />
          </lineSegments>
        )}

        {(isHole || isCableOnly) && (
          <Text position={[0, 0, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
            {isHole ? 'HOLE' : 'RESTRICTED'}
          </Text>
        )}
      </mesh>
      {selected && mode === 'select' && meshRef.current && (
        <TransformControls 
          object={meshRef.current} 
          mode="translate"
          onMouseUp={() => {
            if (meshRef.current) {
              const { x, y, z } = meshRef.current.position;
              updateObstacle(obstacle.id, { position: { x, y, z } });
            }
          }}
        />
      )}
    </>
  );
};

const DrawingPlane = ({ mode, onAddObstacle }: { mode: string, onAddObstacle: (pos: THREE.Vector3) => void }) => {
  if (mode !== 'draw-obstacle') return null;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onAddObstacle(e.point); }}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
      <gridHelper args={[100, 100, 0x00ffff, 0x00ffff]} rotation={[-Math.PI/2, 0, 0]} />
    </mesh>
  );
};

const getThermalColor = (temp: number) => {
  // Heatmap: 0 (Green) -> 50+ (Red)
  const t = Math.min(Math.max(temp, 0) / 50, 1);
  const color = new THREE.Color();
  color.setHSL(0.33 * (1 - t), 1.0, 0.5); // 0.33 is Green, 0 is Red
  return color;
};

const CableMesh = ({ cable, showEMC, showThermal }: { cable: CableSegment, showEMC: boolean, showThermal: boolean }) => {
  if (cable.path.length < 2) return null;
  
  const points = useMemo(() => cable.path.map(p => new THREE.Vector3(p.x, p.y, p.z)), [cable.path]);
  
  let color = '#ffffff';
  if (cable.status === 'error') color = '#ff00ff';
  else if (cable.type === 'power') color = '#ef4444';
  else if (cable.type === 'signal') color = '#3b82f6';
  
  // Override color if thermal view is active
  const thermalColor = useMemo(() => getThermalColor(cable.temperatureRise || 0), [cable.temperatureRise]);
  
  const lineWidth = cable.type === 'power' ? 5 : 2;

  return (
    <group>
      <CatmullRomLine 
        points={points} 
        color={showThermal ? thermalColor : color} 
        lineWidth={lineWidth} 
        segments={20}
        closed={false}
        dashed={cable.redundancy === 'B'}
        dashScale={2}
        dashSize={0.5}
        gapSize={0.2}
      />
      
      {cable.redundancy !== 'none' && (
         <Text position={points[Math.floor(points.length/2)].clone().add(new THREE.Vector3(0,0.2,0))} fontSize={0.15} color="white">
           {`Chain ${cable.redundancy}`}
         </Text>
      )}
      
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04]} />
          <meshBasicMaterial color={showThermal ? thermalColor : color} />
        </mesh>
      ))}
      
      {showEMC && (cable.type === 'power' || cable.type === 'hv') && (
        <group>
           {/* EMC Field Visualization */}
           {points.map((p, i) => i % 3 === 0 && (
             <group key={`emc-${i}`} position={p}>
               {/* Inner intense field */}
               <mesh>
                 <sphereGeometry args={[0.3, 16, 16]} />
                 <meshBasicMaterial color="#d946ef" transparent opacity={0.4} depthWrite={false} />
               </mesh>
               {/* Outer radiation field */}
               <mesh>
                 <sphereGeometry args={[0.6, 16, 16]} />
                 <meshBasicMaterial color="#a855f7" transparent opacity={0.15} depthWrite={false} />
               </mesh>
               {/* Far field */}
               <mesh>
                 <sphereGeometry args={[0.9, 16, 16]} />
                 <meshBasicMaterial color="#8b5cf6" transparent opacity={0.05} depthWrite={false} />
               </mesh>
             </group>
           ))}
           
           {/* Field Label */}
           <Text 
             position={points[Math.floor(points.length/2)].clone().add(new THREE.Vector3(0, 0.8, 0))} 
             fontSize={0.15} 
             color="#d946ef"
             anchorX="center" 
             anchorY="bottom"
           >
             High E-Field
           </Text>
        </group>
      )}

      {showThermal && (
        <group>
           {/* Thermal Halo */}
           {points.map((p, i) => i % 2 === 0 && (
             <mesh key={`therm-${i}`} position={p}>
                <sphereGeometry args={[0.2 + (cable.temperatureRise || 0) * 0.005, 16, 16]} />
                <meshBasicMaterial color={thermalColor} transparent opacity={0.3} depthWrite={false} />
             </mesh>
           ))}
           {/* Temperature Label */}
           <Text 
             position={points[Math.floor(points.length/2)].clone().add(new THREE.Vector3(0, -0.2, 0))} 
             fontSize={0.15} 
             color={thermalColor}
             anchorX="center" 
             anchorY="top"
           >
             {`${(cable.temperatureRise || 0).toFixed(1)}°C`}
           </Text>
        </group>
      )}
      
      {cable.violations.map((v, i) => {
         if (i === 0) {
            return (
              <group key="violation" position={points[Math.floor(points.length/2)]}>
                 <Text fontSize={0.3} color="red" anchorX="center" anchorY="bottom" position={[0, 0.5, 0]}>
                   !
                 </Text>
              </group>
            )
         }
         return null;
      })}
    </group>
  );
};

export const View3DInteractive = () => {
  const { nodes, obstacles, cables, selectObject, selectedId, viewSettings, addCable, addObstacle, toolSettings, setToolSetting } = useStore();
  const { interactionMode, tempStartNodeId } = toolSettings;

  const handleNodeClick = (id: string) => {
    if (interactionMode === 'set-start') {
      setToolSetting('tempStartNodeId', id);
      setToolSetting('interactionMode', 'set-end');
    } else if (interactionMode === 'set-end') {
      if (tempStartNodeId && tempStartNodeId !== id) {
        addCable(tempStartNodeId, id, toolSettings.selectedSignalCategory);
        setToolSetting('tempStartNodeId', null);
        setToolSetting('interactionMode', 'select');
      } else if (!tempStartNodeId) {
        // Fallback if state got desynced
        selectObject(id);
      }
    } else {
      selectObject(id);
    }
  };

  const handleAddObstacle = (point: THREE.Vector3) => {
    addObstacle({
      position: { x: Math.round(point.x), y: Math.max(0, Math.round(point.y)) + 1, z: Math.round(point.z) },
      size: { x: 2, y: toolSettings.obstacleHeight || 2, z: 2 },
      type: 'uncrossable',
      name: 'New Obstacle'
    });
    setToolSetting('interactionMode', 'select');
  };

  return (
    <div className="w-full h-full bg-slate-900 overflow-hidden relative">
      {/* Toolbar - Optional now since we have the left panel, but good for 3D specific context */}
      {/* 
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-800 p-1 rounded border border-slate-700">
        ...
      </div> 
      */}

      {interactionMode === 'set-end' && tempStartNodeId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow-lg animate-pulse">
          Select second node to complete wire
        </div>
      )}

      {interactionMode === 'draw-obstacle' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow-lg animate-pulse">
          Click on grid to place obstacle
        </div>
      )}

      <Canvas 
        camera={
          viewSettings.viewMode === '2d' 
            ? { position: [0, 10, 0], fov: 50, up: [0, 0, -1] }
            : { position: [5, 5, 5], fov: 50 }
        }
        orthographic={viewSettings.viewMode === '2d'}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls 
          makeDefault 
          enabled={interactionMode === 'select' || interactionMode === 'set-start' || interactionMode === 'set-end'} 
          enableRotate={viewSettings.viewMode === '3d'}
          screenSpacePanning={true}
        />
        {viewSettings.showGrid && <Grid infiniteGrid fadeDistance={30} sectionColor="#4f4f4f" cellColor="#2f2f2f" position={[0, -0.01, 0]} />}
        <Environment preset="city" />

        <DrawingPlane mode={interactionMode} onAddObstacle={handleAddObstacle} />

        {nodes.map(node => (
          <NodeMesh 
            key={node.id} 
            node={node} 
            selected={selectedId === node.id || tempStartNodeId === node.id}
            mode={interactionMode}
            onClick={() => handleNodeClick(node.id)} 
          />
        ))}

        {obstacles.map(obs => (
          <ObstacleMesh 
            key={obs.id} 
            obstacle={obs} 
            selected={selectedId === obs.id}
            mode={interactionMode}
            onClick={() => interactionMode === 'select' && selectObject(obs.id)} 
          />
        ))}

        {cables.map(cable => (
          <CableMesh key={cable.id} cable={cable} showEMC={viewSettings.showEMC} showThermal={viewSettings.showThermal} />
        ))}
      </Canvas>
    </div>
  );
};
