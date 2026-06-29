/**
 * Utility functions for calculating time loss due to caliber/diameter changes
 * 
 * Rules:
 * - 25 → 32: 1 hour loss
 * - 40 → 50: 1 hour loss
 * - 63 → 75 or 63 → 90: 1 hour loss
 * - 25 or 32 → (40, 50, 63, 75, 90): 2 hours loss
 * - (40, 50) → other diameters: 2 hours loss
 */

const SMALL_DIAMETERS = ['25', '32']
const MEDIUM_DIAMETERS = ['40', '50']
const LARGE_DIAMETERS = ['63', '75', '90']
const ALL_DIAMETERS = [...SMALL_DIAMETERS, ...MEDIUM_DIAMETERS, ...LARGE_DIAMETERS]

/**
 * Calculate time loss in hours when changing from one diameter to another
 * @param fromDiameter Previous production diameter
 * @param toDiameter Current production diameter
 * @returns Time loss in hours (0, 1, or 2)
 */
export function calculateCalibreChangeLoss(fromDiameter: string, toDiameter: string): number {
  // No change = no loss
  if (fromDiameter === toDiameter) {
    return 0
  }

  // Rule 1: 25 → 32 (or reverse): 1 hour
  if ((fromDiameter === '25' && toDiameter === '32') || 
      (fromDiameter === '32' && toDiameter === '25')) {
    return 1
  }

  // Rule 2: 40 → 50 (or reverse): 1 hour
  if ((fromDiameter === '40' && toDiameter === '50') || 
      (fromDiameter === '50' && toDiameter === '40')) {
    return 1
  }

  // Rule 3: 63 → 75, 63 → 90, 75 → 90, etc. within large diameters: 1 hour
  if (LARGE_DIAMETERS.includes(fromDiameter) && LARGE_DIAMETERS.includes(toDiameter)) {
    return 1
  }

  // Rule 4: From small (25, 32) to any medium/large (40, 50, 63, 75, 90): 2 hours
  if (SMALL_DIAMETERS.includes(fromDiameter) && 
      (MEDIUM_DIAMETERS.includes(toDiameter) || LARGE_DIAMETERS.includes(toDiameter))) {
    return 2
  }

  // Rule 5: From medium (40, 50) to any other diameter (not 40↔50): 2 hours
  if (MEDIUM_DIAMETERS.includes(fromDiameter)) {
    // If going to another medium (40↔50), that's already handled in Rule 2
    // If going to small, that's 2 hours
    if (SMALL_DIAMETERS.includes(toDiameter) || LARGE_DIAMETERS.includes(toDiameter)) {
      return 2
    }
  }

  // Rule 6: From large to small or medium (not within large): 2 hours
  if (LARGE_DIAMETERS.includes(fromDiameter)) {
    if (SMALL_DIAMETERS.includes(toDiameter) || MEDIUM_DIAMETERS.includes(toDiameter)) {
      return 2
    }
  }

  // Default: no loss
  return 0
}

/**
 * Convert hours to minutes
 */
export function hoursToMinutes(hours: number): number {
  return hours * 60
}

/**
 * Get the calibre change loss in minutes
 */
export function getCalibreChangeLossMinutes(fromDiameter: string, toDiameter: string): number {
  const hours = calculateCalibreChangeLoss(fromDiameter, toDiameter)
  return hoursToMinutes(hours)
}

/**
 * Check if diameter is valid
 */
export function isValidDiameter(diameter: string): boolean {
  return ALL_DIAMETERS.includes(diameter)
}

/**
 * Get all available diameters
 */
export function getAvailableDiameters(): string[] {
  return ALL_DIAMETERS
}
