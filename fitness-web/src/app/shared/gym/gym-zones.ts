/**
 * The areas of the 3D gym. Each zone matches one equipment category from the database
 * (Dictionary group 2), so clicking a zone shows the exercises that use that equipment.
 * No three.js import here, so pages can use this file without loading the 3D library.
 */
export interface GymZone {
  key: string;
  name: string;
  color: string;
  /** Floor point the camera flies to (x, y, z in metres) */
  center: [number, number, number];
  /** Where the label pin floats */
  pin: [number, number, number];
}

export const GYM_ZONES: GymZone[] = [
  { key: 'barbell', name: 'Barbell', color: '#ec5a5f', center: [-11.5, 0, -8], pin: [-11.5, 3.4, -9.4] },
  { key: 'cable', name: 'Cable', color: '#4a86f5', center: [1.5, 0, -9.6], pin: [1.5, 3.4, -10.4] },
  { key: 'machine', name: 'Machines', color: '#f2b632', center: [13, 0, -5.5], pin: [13, 3.2, -6.6] },
  { key: 'cardio', name: 'Cardio', color: '#5fc4c9', center: [-14.6, 0, 4.6], pin: [-14.6, 2.6, 4.6] },
  { key: 'bodyweight', name: 'Bodyweight', color: '#8e99a8', center: [-6.8, 0, 2.6], pin: [-6.8, 3.4, 0.6] },
  { key: 'kettlebell', name: 'Kettlebells', color: '#34ab72', center: [0.4, 0, 2.2], pin: [0.4, 1.9, 1.4] },
  { key: 'ball', name: 'Balls', color: '#f2b632', center: [6.4, 0, 2.6], pin: [6.4, 2.0, 2.6] },
  { key: 'band', name: 'Resistance bands', color: '#ec5a5f', center: [13.8, 0, 6.4], pin: [13.8, 2.6, 6.6] },
];

/** Equipment name from the database → zone key (case-insensitive, singular or plural) */
const EQUIPMENT_TO_ZONE: Record<string, string> = {
  barbell: 'barbell',
  cable: 'cable',
  machine: 'machine',
  cardio: 'cardio',
  treadmill: 'cardio',
  bike: 'cardio',
  rower: 'cardio',
  bodyweight: 'bodyweight',
  kettlebell: 'kettlebell',
  ball: 'ball',
  'medicine ball': 'ball',
  'resistance band': 'band',
  band: 'band',
};

export function zoneForEquipment(equipmentName: string | null | undefined): string | null {
  if (!equipmentName) return null;
  const name = equipmentName.trim().toLowerCase();
  return EQUIPMENT_TO_ZONE[name] ?? EQUIPMENT_TO_ZONE[name.replace(/s$/, '')] ?? null;
}
