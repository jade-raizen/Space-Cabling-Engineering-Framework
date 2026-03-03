export type CableType = 'power' | 'data' | 'sensitive' | 'hv' | 'signal';
export type RedundancyType = 'none' | 'A' | 'B';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface CableSegment {
  id: string;
  startNodeId: string;
  endNodeId: string;
  type: CableType;
  path: Position[];
  length: number;
  mass: number;
  shielded: boolean;
  status: 'compliant' | 'warning' | 'error';
  violations: string[];
  temperatureRise?: number;
  redundancy?: RedundancyType;
  current: number;
  voltage: number;
  crossSection: number;
}

export const MATERIAL_CONSTANTS = {
  COPPER_DENSITY: 8.96, // g/cm³
  RESISTIVITY: 0.0172, // Ω⋅mm²/m
  THERMAL_COEFF: 5.0, // Simplified thermal coefficient
};
