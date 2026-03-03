import { CableSegment, MATERIAL_CONSTANTS } from '../../entities/electrical/Wire';

export function calculateMass(cable: CableSegment): number {
  if (cable.length === 0) return 0;

  // Mass Calculation (g) = Volume (cm³) * Density (g/cm³)
  // Length is in meters, crossSection in mm²
  // Volume in cm³ = (Length * 100) * (crossSection / 100) = Length * crossSection
  const conductorMass = cable.length * cable.crossSection * MATERIAL_CONSTANTS.COPPER_DENSITY;
  const insulationMass = conductorMass * 0.4; // 40% overhead for insulation/shielding
  const totalMass = conductorMass + insulationMass;
  
  return totalMass;
}
