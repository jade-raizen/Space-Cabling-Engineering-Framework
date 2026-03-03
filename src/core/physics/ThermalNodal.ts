import { CableSegment, MATERIAL_CONSTANTS } from '../../entities/electrical/Wire';

export function calculateThermal(cable: CableSegment): number {
  if (cable.length === 0) return 0;

  // Thermal Calculation (Simplified Joule Heating)
  // R = ρ * L / A
  const resistance = (MATERIAL_CONSTANTS.RESISTIVITY * cable.length) / cable.crossSection;
  const powerDissipation = Math.pow(cable.current, 2) * resistance; // I²R
  
  // Temp Rise approximation (very simplified)
  // ΔT = P * R_th (Thermal Resistance to ambient)
  // Assuming linear relation for demo
  const temperatureRise = powerDissipation * MATERIAL_CONSTANTS.THERMAL_COEFF;

  return temperatureRise;
}
