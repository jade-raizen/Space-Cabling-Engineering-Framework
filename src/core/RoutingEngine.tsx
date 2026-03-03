import React from 'react';
import { useStore } from '../store/useStore';
import { findPath, calculateLength } from './routing/AStar';

// A simplified A* implementation for the 3D grid
export const RoutingEngine = () => {
  const { nodes, obstacles, cables, updateCablePath, addLog } = useStore();

  // Run routing whenever cables or obstacles change
  React.useEffect(() => {
    cables.forEach(cable => {
      if (cable.path.length > 0) return; // Already routed

      const startNode = nodes.find(n => n.id === cable.startNodeId);
      const endNode = nodes.find(n => n.id === cable.endNodeId);

      if (!startNode || !endNode) return;

      // addLog('info', `Routing cable ${cable.id.slice(0,4)}...`, 'Routing'); // Reduce log spam
      
      const path = findPath(startNode.position, endNode.position, obstacles);
      if (path && path.length > 0) {
        updateCablePath(cable.id, path);
        addLog('success', `Route found for ${cable.type} harness. Length: ${calculateLength(path).toFixed(2)}m`, 'Routing');
      } else {
        // addLog('error', `Failed to route cable ${cable.id.slice(0,4)}: No path found.`, 'Routing');
      }
    });
  }, [cables, nodes, obstacles]); // Re-run if these change

  return null; // Headless component
};
