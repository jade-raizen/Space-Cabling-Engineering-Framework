import { CableSegment, CableType, Position } from '../../entities/electrical/Wire';

function areIncompatible(t1: CableType, t2: CableType): boolean {
  if ((t1 === 'power' || t1 === 'hv') && t2 === 'sensitive') return true;
  if (t1 === 'sensitive' && (t2 === 'power' || t2 === 'hv')) return true;
  return false;
}

function checkProximity(path1: Position[], path2: Position[], threshold: number): boolean {
  if (!path1.length || !path2.length) return false;
  const step = 2; 
  for (let i = 0; i < path1.length; i += step) {
    for (let j = 0; j < path2.length; j += step) {
      const p1 = path1[i];
      const p2 = path2[j];
      const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
      if (dist < threshold) return true;
    }
  }
  return false;
}

export function checkEMCSegregation(cable: CableSegment, allCables: CableSegment[]): string[] {
  const violations: string[] = [];
  allCables.forEach(other => {
    if (cable.id === other.id) return;
    if (areIncompatible(cable.type, other.type)) {
       if (checkProximity(cable.path, other.path, 0.6)) {
         violations.push(`EMC Violation: Proximity to ${other.type} harness < 600mm`);
       }
    }
  });
  return violations;
}
