import { Position } from '../../entities/electrical/Wire';
import { Obstacle } from '../../entities/mechanical/Connector';

const GRID_SIZE = 0.25;

function snapToGrid(p: Position): Position {
  return {
    x: Math.round(p.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(p.y / GRID_SIZE) * GRID_SIZE,
    z: Math.round(p.z / GRID_SIZE) * GRID_SIZE
  };
}

function heuristic(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

function posKey(p: Position): string {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
}

function dist(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

function getNeighbors(p: Position): Position[] {
  const neighbors = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        neighbors.push({
          x: p.x + x * GRID_SIZE,
          y: p.y + y * GRID_SIZE,
          z: p.z + z * GRID_SIZE
        });
      }
    }
  }
  return neighbors;
}

function getCollisionType(p: Position, obstacles: Obstacle[]): 'none' | 'uncrossable' | 'interference' {
  for (const obs of obstacles) {
    const minX = obs.position.x - obs.size.x / 2;
    const maxX = obs.position.x + obs.size.x / 2;
    const minY = obs.position.y - obs.size.y / 2;
    const maxY = obs.position.y + obs.size.y / 2;
    const minZ = obs.position.z - obs.size.z / 2;
    const maxZ = obs.position.z + obs.size.z / 2;
    
    if (p.x >= minX && p.x <= maxX &&
        p.y >= minY && p.y <= maxY &&
        p.z >= minZ && p.z <= maxZ) {
      return obs.type as 'none' | 'uncrossable' | 'interference';
    }
  }
  return 'none';
}

function isNearObstacle(p: Position, obstacles: Obstacle[]): boolean {
   const margin = GRID_SIZE * 2;
   for (const obs of obstacles) {
     if (obs.type === 'uncrossable') {
        const minX = obs.position.x - obs.size.x / 2 - margin;
        const maxX = obs.position.x + obs.size.x / 2 + margin;
        const minY = obs.position.y - obs.size.y / 2 - margin;
        const maxY = obs.position.y + obs.size.y / 2 + margin;
        const minZ = obs.position.z - obs.size.z / 2 - margin;
        const maxZ = obs.position.z + obs.size.z / 2 + margin;
        
        if (p.x >= minX && p.x <= maxX &&
            p.y >= minY && p.y <= maxY &&
            p.z >= minZ && p.z <= maxZ) {
          return true;
        }
     }
   }
   return false;
}

function reconstructPath(node: any, realEnd: Position): Position[] {
  const path = [];
  let curr = node;
  while (curr) {
    path.push(curr.pos);
    curr = curr.parent;
  }
  path.reverse();
  path.push(realEnd);
  return path;
}

export function findPath(start: Position, end: Position, obstacles: Obstacle[]): Position[] | null {
  const openSet: any[] = [];
  const closedSet = new Set<string>();
  
  const startNode = { 
    pos: snapToGrid(start), 
    g: 0, 
    h: heuristic(start, end), 
    f: 0, 
    parent: null 
  };
  startNode.f = startNode.g + startNode.h;
  
  openSet.push(startNode);
  
  let iterations = 0;
  const MAX_ITERATIONS = 5000;

  while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    const key = posKey(current.pos);
    if (closedSet.has(key)) continue;
    closedSet.add(key);
    
    if (dist(current.pos, end) < GRID_SIZE * 1.5) {
      return reconstructPath(current, end);
    }
    
    const neighbors = getNeighbors(current.pos);
    
    for (const neighborPos of neighbors) {
      if (closedSet.has(posKey(neighborPos))) continue;
      
      const collisionType = getCollisionType(neighborPos, obstacles);
      if (collisionType === 'uncrossable') continue;
      
      let stepCost = dist(current.pos, neighborPos);
      
      if (collisionType === 'interference') {
        stepCost *= 10;
      }
      
      if (isNearObstacle(neighborPos, obstacles)) {
         stepCost *= 2;
      }
      
      const gScore = current.g + stepCost;
      const hScore = heuristic(neighborPos, end);
      const fScore = gScore + hScore;
      
      const existing = openSet.find(n => posKey(n.pos) === posKey(neighborPos));
      if (existing && existing.g <= gScore) continue;
      
      openSet.push({
        pos: neighborPos,
        g: gScore,
        h: hScore,
        f: fScore,
        parent: current
      });
    }
  }
  
  return null;
}

export function calculateLength(path: Position[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i-1];
    const b = path[i];
    len += Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2));
  }
  return len;
}
