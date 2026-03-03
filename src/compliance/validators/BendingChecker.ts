import { CableSegment, Position } from '../../entities/electrical/Wire';

export function checkBendRadius(cable: CableSegment): string[] {
  const violations: string[] = [];
  if (cable.path.length > 2) {
    for (let i = 1; i < cable.path.length - 1; i++) {
      const prev = cable.path[i-1];
      const curr = cable.path[i];
      const next = cable.path[i+1];
      
      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y, z: curr.z - prev.z };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y, z: next.z - curr.z };
      
      const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
      
      if (Math.abs(dot) < 0.01) { // 90 degree turn
         if (cable.type === 'power' || cable.type === 'hv') {
           violations.push(`Bend Radius Violation at segment ${i} (Sharp 90° turn on High Gauge)`);
         }
      }
    }
  }
  return violations;
}
