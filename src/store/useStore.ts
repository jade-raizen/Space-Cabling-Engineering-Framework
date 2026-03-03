import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CableSegment, CableType, RedundancyType, Position } from '../entities/electrical/Wire';
import { ProjectNode, Obstacle, NodeType } from '../entities/mechanical/Connector';
import { calculateThermal } from '../core/physics/ThermalNodal';
import { calculateMass } from '../core/physics/PowerDerating';
import { checkBendRadius } from '../compliance/validators/BendingChecker';
import { checkEMCSegregation } from '../compliance/validators/EMCSegregation';
import { calculateLength } from '../core/routing/AStar';

export type { CableSegment, CableType, RedundancyType, Position, ProjectNode, Obstacle, NodeType };

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
}

interface AppState {
  nodes: ProjectNode[];
  obstacles: Obstacle[];
  cables: CableSegment[];
  logs: LogEntry[];
  selectedId: string | null;
  activeView: 'dashboard' | 'editor-2d' | 'editor-3d' | 'viewer-3d';
  viewSettings: {
    showThermal: boolean;
    showEMC: boolean;
    showGrid: boolean;
    viewMode: '3d' | '2d';
    showPathMetrics: boolean;
    showDensityHeatmap: boolean;
    gridSize: number;
  };
  
  // New State for Tools
  toolSettings: {
    obstacleHeight: number;
    selectedSignalCategory: CableType;
    infrastructureType: 'raceway' | 'holder' | null;
    interactionMode: 'select' | 'draw-obstacle' | 'draw-wire' | 'set-start' | 'set-end';
    tempStartNodeId: string | null;
  };

  // Actions
  addNode: (node: Omit<ProjectNode, 'id'>) => void;
  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  updateNode: (id: string, position: Position) => void;
  addCable: (startId: string, endId: string, type: CableType, redundancy?: RedundancyType) => void;
  selectObject: (id: string | null) => void;
  toggleViewSetting: (setting: keyof AppState['viewSettings']) => void;
  setGridSize: (size: number) => void;
  toggleViewMode: () => void;
  setActiveView: (view: 'dashboard' | 'editor-2d' | 'editor-3d' | 'viewer-3d' | 'analysis') => void;
  setAnalysisSetting: (setting: 'smartMode' | 'faceThreshold', value: boolean | number) => void;
  setToolSetting: (setting: keyof AppState['toolSettings'], value: any) => void;
  importCAD: (file: File, replace?: boolean) => Promise<void>;
  addLog: (level: LogEntry['level'], message: string, source: LogEntry['source']) => void;
  updateCablePath: (id: string, path: Position[]) => void;
  updateCablePhysics: (id: string, params: { current?: number; voltage?: number; crossSection?: number }) => void;
  checkCompliance: () => void;
  clearWorkspace: () => void;
  generateRandomSimulation: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  obstacles: [
    { id: 'obs-1', position: { x: 2, y: 0, z: 2 }, size: { x: 2, y: 4, z: 2 }, type: 'uncrossable' },
    { id: 'obs-2', position: { x: -2, y: 0, z: -1 }, size: { x: 3, y: 2, z: 3 }, type: 'interference' },
  ],
  cables: [],
  logs: [],
  selectedId: null,
  activeView: 'dashboard',
  viewSettings: {
    showThermal: false,
    showEMC: false,
    showGrid: true,
    viewMode: '3d',
    showPathMetrics: false,
    showDensityHeatmap: false,
    gridSize: 10.0,
  },
  analysisSettings: {
    smartMode: true,
    faceThreshold: 12,
  },
  toolSettings: {
    obstacleHeight: 3.0,
    selectedSignalCategory: 'data',
    infrastructureType: null,
    interactionMode: 'select',
    tempStartNodeId: null,
  },

  addNode: (node) => set((state) => {
    const newNode = { ...node, id: uuidv4() };
    get().addLog('info', `Node added: ${newNode.name}`, 'System');
    return { nodes: [...state.nodes, newNode] };
  }),

  addObstacle: (obstacle) => set((state) => ({
    obstacles: [...state.obstacles, { ...obstacle, id: uuidv4() }]
  })),

  removeObstacle: (id) => set((state) => ({
    obstacles: state.obstacles.filter(obs => obs.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  updateObstacle: (id, updates) => set((state) => ({
    obstacles: state.obstacles.map(obs => obs.id === id ? { ...obs, ...updates } : obs)
  })),

  updateNode: (id, position) => set((state) => ({
    nodes: state.nodes.map(node => node.id === id ? { ...node, position } : node),
    cables: state.cables.map(cable => {
      if (cable.startNodeId === id || cable.endNodeId === id) {
        return { ...cable, path: [] };
      }
      return cable;
    })
  })),

  addCable: (startId, endId, type, redundancy) => set((state) => {
    let current = 0.5;
    let voltage = 5;
    let crossSection = 0.5;

    switch (type) {
      case 'power': current = 10; voltage = 28; crossSection = 4.0; break;
      case 'hv': current = 1; voltage = 1000; crossSection = 2.5; break;
      case 'data': current = 0.5; voltage = 5; crossSection = 0.25; break;
      case 'sensitive': current = 0.1; voltage = 3.3; crossSection = 0.14; break;
      case 'signal': current = 0.5; voltage = 12; crossSection = 0.34; break;
    }

    const newCable: CableSegment = {
      id: uuidv4(),
      startNodeId: startId,
      endNodeId: endId,
      type,
      path: [],
      length: 0,
      mass: 0,
      shielded: type === 'sensitive' || type === 'data',
      status: 'compliant',
      violations: [],
      redundancy,
      current,
      voltage,
      crossSection,
      temperatureRise: 0
    };
    get().addLog('info', `Cable created: ${type.toUpperCase()} harness initiated.`, 'System');
    return { cables: [...state.cables, newCable] };
  }),

  selectObject: (id) => set({ selectedId: id }),

  toggleViewSetting: (setting) => set((state) => ({
    viewSettings: { ...state.viewSettings, [setting]: !state.viewSettings[setting] }
  })),

  setGridSize: (size) => set((state) => ({
    viewSettings: { ...state.viewSettings, gridSize: size }
  })),

  toggleViewMode: () => set((state) => ({
    viewSettings: { ...state.viewSettings, viewMode: state.viewSettings.viewMode === '3d' ? '2d' : '3d' }
  })),

  setActiveView: (view) => set((state) => {
    const newViewMode = view === 'editor-2d' ? '2d' : '3d';
    return { 
      activeView: view,
      viewSettings: { ...state.viewSettings, viewMode: newViewMode }
    };
  }),

  setAnalysisSetting: (setting, value) => set((state) => ({
    analysisSettings: { ...state.analysisSettings, [setting]: value }
  })),

  setToolSetting: (setting, value) => set((state) => ({
    toolSettings: { ...state.toolSettings, [setting]: value }
  })),

  importCAD: async (file, replace = false) => {
    get().addLog('info', `Importing CAD file: ${file.name} (${replace ? 'Overwrite' : 'Append'})...`, 'System');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data based on the user's screenshot (approximate scaling 1:100 for visualization)
    const newObstacles: Obstacle[] = [
      // Base Plate (Grey)
      { id: uuidv4(), position: { x: 1, y: 0.5, z: 7 }, size: { x: 24, y: 1, z: 12 }, type: 'uncrossable', name: 'Base Plate', color: '#cbd5e1' },
      
      // Left Group
      { id: uuidv4(), position: { x: -8, y: 3, z: 4.5 }, size: { x: 3, y: 4, z: 3 }, type: 'interference', name: 'Unit A1' },
      { id: uuidv4(), position: { x: -8, y: 2, z: 8 }, size: { x: 3, y: 2, z: 2 }, type: 'interference', name: 'Unit A2' },
      { id: uuidv4(), position: { x: -5, y: 3, z: 4.5 }, size: { x: 2, y: 4, z: 3 }, type: 'interference', name: 'Unit B1' },
      { id: uuidv4(), position: { x: -5, y: 2.5, z: 7.5 }, size: { x: 2, y: 3, z: 2 }, type: 'interference', name: 'Unit B2' },

      // Center Group
      { id: uuidv4(), position: { x: -2, y: 3.5, z: 5 }, size: { x: 2.5, y: 5, z: 4 }, type: 'interference', name: 'Unit C1' },
      { id: uuidv4(), position: { x: -2, y: 2.5, z: 9 }, size: { x: 2.5, y: 3, z: 2 }, type: 'interference', name: 'Unit C2' },

      // Right Group (Large blocks)
      { id: uuidv4(), position: { x: 4, y: 4, z: 7 }, size: { x: 4, y: 6, z: 8 }, type: 'interference', name: 'Payload Main' },
      { id: uuidv4(), position: { x: 9, y: 4, z: 7 }, size: { x: 4, y: 6, z: 8 }, type: 'interference', name: 'Payload Secondary' },
      
      // Far Right
      { id: uuidv4(), position: { x: 13, y: 3, z: 5 }, size: { x: 2, y: 4, z: 3 }, type: 'interference', name: 'Antenna Unit' },
      { id: uuidv4(), position: { x: 13, y: 2, z: 9 }, size: { x: 2, y: 2, z: 3 }, type: 'interference', name: 'Sensor' },
    ];
    
    set(state => ({
      obstacles: replace ? newObstacles : [...state.obstacles, ...newObstacles]
    }));
    get().addLog('success', `CAD Import Complete. ${newObstacles.length} objects ${replace ? 'replaced' : 'added'}.`, 'System');
  },

  addLog: (level, message, source) => set((state) => ({
    logs: [{
      id: uuidv4(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      source
    }, ...state.logs].slice(0, 100)
  })),

  updateCablePath: (id, path) => set((state) => {
    const newCables = state.cables.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, path, length: calculateLength(path) };
      const mass = calculateMass(updated);
      const temperatureRise = calculateThermal(updated);
      return { ...updated, mass, temperatureRise };
    });
    return { cables: newCables };
  }),

  updateCablePhysics: (id, params) => set((state) => {
    const newCables = state.cables.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...params };
      const mass = calculateMass(updated);
      const temperatureRise = calculateThermal(updated);
      return { ...updated, mass, temperatureRise };
    });
    return { cables: newCables };
  }),

  checkCompliance: () => {
    const state = get();
    const newCables = state.cables.map(cable => {
      const violations: string[] = [];
      let status: CableSegment['status'] = 'compliant';
      const startNode = state.nodes.find(n => n.id === cable.startNodeId);
      const endNode = state.nodes.find(n => n.id === cable.endNodeId);

      // 1. ECSS-Q-ST-70-08 (Bend Radius)
      violations.push(...checkBendRadius(cable));
      
      // 2. ECSS-E-ST-20-07C (EMC Separation)
      violations.push(...checkEMCSegregation(cable, state.cables));

      // 3. Grounding check (NASA-STD-4003)
      if (cable.type === 'sensitive' || cable.shielded) {
         const isStartGrounded = startNode?.type === 'grounding-point' || startNode?.grounded || startNode?.name.includes('GND');
         const isEndGrounded = endNode?.type === 'grounding-point' || endNode?.grounded || endNode?.name.includes('GND');
         
         if (!isStartGrounded && !isEndGrounded) {
           violations.push('Grounding Violation: Shield/Sensitive line floating (No GND ref)');
           status = 'error';
         }
      }

      // 4. Obstacle Interference Check
      for (const obs of state.obstacles) {
        if (obs.type === 'interference') {
           if (checkPathIntersection(cable.path, obs)) {
             violations.push(`Interference Warning: Path traverses Restricted Zone ${obs.id.slice(0,4)}`);
             if (status !== 'error') status = 'warning';
           }
        }
      }

      if (violations.length > 0) {
        if (violations.some(v => v.includes('Grounding') || v.includes('EMC'))) status = 'error';
        else if (status === 'compliant') status = 'warning';
      }

      return { ...cable, violations, status };
    });

    set({ cables: newCables });
    
    const errorCount = newCables.filter(c => c.status === 'error').length;
    const warnCount = newCables.filter(c => c.status === 'warning').length;
    
    if (errorCount > 0) {
      get().addLog('error', `Compliance Check: ${errorCount} Errors, ${warnCount} Warnings.`, 'Compliance');
    } else if (warnCount > 0) {
      get().addLog('warning', `Compliance Check: ${warnCount} Warnings found.`, 'Compliance');
    } else {
      get().addLog('success', 'Compliance Check Passed: All systems nominal.', 'Compliance');
    }
  },

  clearWorkspace: () => set({
    nodes: [],
    obstacles: [],
    cables: [],
    logs: [],
    selectedId: null
  }),

  generateRandomSimulation: () => {
    const nodes: ProjectNode[] = [];
    const cables: CableSegment[] = [];
    
    // Generate random nodes
    for (let i = 0; i < 5; i++) {
      nodes.push({
        id: uuidv4(),
        name: `Node ${i+1}`,
        position: { 
          x: Math.floor(Math.random() * 10) - 5, 
          y: 0, 
          z: Math.floor(Math.random() * 10) - 5 
        },
        type: Math.random() > 0.8 ? 'grounding-point' : 'connector',
        grounded: Math.random() > 0.8
      });
    }

    set({ nodes });
    get().addLog('info', 'Generated random simulation scenario.', 'System');
  }
}));

function checkPathIntersection(path: Position[], obs: Obstacle): boolean {
   const minX = obs.position.x - obs.size.x / 2;
   const maxX = obs.position.x + obs.size.x / 2;
   const minY = obs.position.y - obs.size.y / 2;
   const maxY = obs.position.y + obs.size.y / 2;
   const minZ = obs.position.z - obs.size.z / 2;
   const maxZ = obs.position.z + obs.size.z / 2;

   for (const p of path) {
     if (p.x >= minX && p.x <= maxX &&
         p.y >= minY && p.y <= maxY &&
         p.z >= minZ && p.z <= maxZ) {
       return true;
     }
   }
   return false;
}
