import { Position } from '../electrical/Wire';

export type NodeType = 'connector' | 'p-clip' | 'grounding-point' | 'hole';

export interface ProjectNode {
  id: string;
  type: NodeType;
  position: Position;
  name: string;
  grounded?: boolean;
}

export interface Obstacle {
  id: string;
  position: Position;
  size: Position;
  type: 'uncrossable' | 'interference' | 'hole' | 'cable-only';
  allowedCableTypes?: string[]; // Using string[] to avoid circular dependency, cast when needed
  name?: string;
  color?: string;
  shape?: 'box' | 'sphere' | 'cylinder';
  radius?: number;
}
