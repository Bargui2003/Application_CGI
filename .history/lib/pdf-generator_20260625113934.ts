export interface ProductionSheetData {
  date: string
  conductor: string
  shift: string
  diameter: string
  pressure: string
  targetQuantity: number
  targetPieces: number
  speed: number
  productionTime: number
  hdPercentage: number
  ldPercentage: number
  wastePercentage: number
  startingShiftIndex?: number // Starting from which shift (0, 1, 2)
  availableMinutesForFirstShift?: number // Remaining minutes in the starting shift
  startingMinuteOffsetInShift?: number // How many minutes into the shift we already are (for display)
}
 
export interface ProductionStatus {
  lastShiftIndex: number // Which team finished last (0, 1, 2)
  remainingMinutes: number // Minutes left in their 8-hour shift
  totalPiecesProduced: number
}
 
export interface ProductionSheetResult {
  html: string
  status: ProductionStatus
}
 
/**
 * SHIFT DEFINITIONS
 * Shift 0 - 1ère Équipe : 07:00 → 15:00  (starts at minute 420, ends at minute 900)
 * Shift 1 - 2ème Équipe : 15:00 → 23:00  (starts at minute 900, ends at minute 1380)
 * Shift 2 - 3ème Équipe : 23:00 → 07:00  (starts at minute 1380/day, ends at minute 420/next day)
 */
const SHIFTS = [
  { name: '1ère Équipe', startHour: 7,  endHour: 15 },
  { name: '2ème Équipe', startHour: 15, endHour: 23 },
  { name: '3ème Équipe', startHour: 23, endHour: 7  },
]
 
const MAX_SHIFT_DURATION = 480 // 8 hours in minutes
 
/**
 * Determines which shift index is active at a given hour:minute,
 * and how many minutes are remaining in that shift.
 *
 * Returns { shiftIndex, remainingMinutes, minutesElapsed }
 *   minutesElapsed = how many minutes into the shift have already passed
 */
export function getCurrentShiftInfo(nowDate?: Date): {
  shiftIndex: number
  remainingMinutes: number
  minutesElapsed: number
} {
  const now = nowDate ?? new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()
 
  // Shift 0: 07:00–15:00  → [420, 900)
  // Shift 1: 15:00–23:00  → [900, 1380)
  // Shift 2: 23:00–07:00  → [1380, 1440) ∪ [0, 420)
 
  let shiftIndex: number
  let minutesElapsed: number
 
  if (totalMinutes >= 420 && totalMinutes < 900) {
    // Inside Shift 0 (07:00–15:00)
    shiftIndex = 0
    minutesElapsed = totalMinutes - 420
  } else if (totalMinutes >= 900 && totalMinutes < 1380) {
    // Inside Shift 1 (15:00–23:00)
    shiftIndex = 1
    minutesElapsed = totalMinutes - 900
  } else {
    // Inside Shift 2 (23:00–07:00)
    shiftIndex = 2
    minutesElapsed = totalMinutes >= 1380 ? totalMinutes - 1380 : totalMinutes + 60 // 00:00–07:00 range
  }
 
  const remainingMinutes = MAX_SHIFT_DURATION - minutesElapsed
 
  return { shiftIndex, remainingMinutes, minutesElapsed }
}
 
/**
 * Resolves the starting shift and available minutes for the FIRST production ever.
 * Uses the current time to find the active shift and how many minutes remain in it.
 * 
 * If startingShiftIndex and availableMinutesForFirstShift are both provided
 * (i.e. a previous production exists), those values are used directly.
 */
function resolveStartingShift(data: ProductionSheetData): {
  shiftIndex: number
  availableMinutes: number
  minutesElapsed: number  // minutes already used in this shift (for start-time display)
} {
  // If caller explicitly provided state from a previous production, use it
  if (
    data.startingShiftIndex !== undefined &&
    data.availableMinutesForFirstShift !== undefined
  ) {
    const elapsed = MAX_SHIFT_DURATION - data.availableMinutesForFirstShift
    return {
      shiftIndex: data.startingShiftIndex,
      availableMinutes: data.availableMinutesForFirstShift,
      minutesElapsed: Math.max(0, elapsed),
    }
  }
 
  // First production ever: use real clock
  const info = getCurrentShiftInfo()
  return {
    shiftIndex: info.shiftIndex,
    availableMinutes: info.remainingMinutes,
    minutesElapsed: info.minutesElapsed,
  }
}
 
export function generateProductionSheet(data: ProductionSheetData): ProductionSheetResult {
  const {
    date,
    conductor,
    diameter,
    pressure,
    targetQuantity,
    targetPieces,
    speed,
    hdPercentage,
    ldPercentage,
    wastePercentage,
  } = data
 
  const METERS_PER_ROLL = 100
  const timePerRoll = METERS_PER_ROLL / speed // minutes per roll
 
  // ── Resolve starting position ──────────────────────────────────────────────
  const starting = resolveStartingShift(data)
  let currentShiftIndex = starting.shiftIndex
  let minutesAvailableThisShift = starting.availableMinutes
  // For the first sheet, how many minutes into the shift the work actually starts
  let minutesAlreadyUsedInShift = starting.minutesElapsed
 
  // ── Distribute rolls across shifts ────────────────────────────────────────
  const shiftAssignments: Array<{
    shiftIndex: number
    pieces: number
    actualDuration: number
    quantity: number
    startMinuteInShift: number // minute offset within the shift when work begins
  }> = []
 
  let remainingPieces = targetPieces
  let lastUsedShiftIndex = currentShiftIndex
  let lastRemainingMinutes = minutesAvailableThisShift
 
  while (remainingPieces > 0) {
    const shiftIndex = currentShiftIndex % 3
 
    const maxRollsThisShift = Math.floor(minutesAvailableThisShift / timePerRoll)
    const piecesForThisShift = Math.min(maxRollsThisShift, remainingPieces)
 
    if (piecesForThisShift > 0) {
      const actualDuration = piecesForThisShift * timePerRoll
      const quantityForThisShift = (piecesForThisShift * targetQuantity) / targetPieces
 
      shiftAssignments.push({
        shiftIndex,
        pieces: piecesForThisShift,
        actualDuration,
        quantity: quantityForThisShift,
        startMinuteInShift: minutesAlreadyUsedInShift,
      })
 
      remainingPieces -= piecesForThisShift
      lastUsedShiftIndex = shiftIndex
      lastRemainingMinutes = minutesAvailableThisShift - actualDuration
    } else if (maxRollsThisShift === 0 && remainingPieces > 0) {
      // This shift has no time left (e.g. less than 1 roll worth), skip to next
      // (safety guard – normally shouldn't happen with valid data)
    }
 
    // Move to next shift: new shift always starts fresh (480 min) from its own beginning
    currentShiftIndex++
    minutesAvailableThisShift = MAX_SHIFT_DURATION
    minutesAlreadyUsedInShift = 0 // subsequent shifts always start at the beginning
  }
 
  // ── Generate HTML ──────────────────────────────────────────────────────────
  const addDays = (dateStr: string, days: number): string => {
    const [day, month, year] = dateStr.split('/').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString('fr-FR')
  }
 
  let allShiftsHTML = ''
  const totalSheets = shiftAssignments.length
 
  // Track calendar day: shift 2 (23h→7h) crosses midnight, so we need careful day tracking.
  // We accumulate elapsed minutes from the very first shift-start to compute day offsets.
  let accumulatedMinutes = starting.minutesElapsed // start from where we are in the first shift
 
  for (let i = 0; i < totalSheets; i++) {
    const assignment = shiftAssignments[i]
    const shiftDef = SHIFTS[assignment.shiftIndex]
 
    // Compute calendar day offset from the initial date.
    // We count how many times we cross midnight (00:00) starting from the initial shift start.
    const shiftStartAbsoluteMinute = shiftAbsoluteStart(assignment.shiftIndex)
    // Day offset: each full "day block" = 1440 minutes; rough approximation via sheet count
    // Better approach: track absolute minutes from a fixed anchor (00:00 of the starting date)
    const dayOffset = computeDayOffset(starting.shiftIndex, starting.minutesElapsed, i, shiftAssignments)
    const sheetDate = dayOffset === 0 ? date : addDays(date, dayOffset)
 
    allShiftsHTML += generateShiftSheet(
      sheetDate,
      conductor,
      shiftDef.name,
      shiftDef.startHour,
      shiftDef.endHour,
      diameter,
      pressure,
      assignment.quantity,
      assignment.pieces,
      speed,
      assignment.actualDuration,
      hdPercentage,
      ldPercentage,
      wastePercentage,
      assignment.startMinuteInShift, // real start offset in shift
      i + 1,
      totalSheets,
    )
 
    if (i < totalSheets - 1) {
      allShiftsHTML += '<div style="page-break-after: always;"></div>'
    }
  }
 
  return {
    html: allShiftsHTML,
    status: {
      lastShiftIndex: lastUsedShiftIndex,
      remainingMinutes: Math.max(0, lastRemainingMinutes),
      totalPiecesProduced: targetPieces,
    },
  }
}
 
/** Returns the minute-of-day when a shift starts (used for day-offset math) */
function shiftAbsoluteStart(shiftIndex: number): number {
  return [7 * 60, 15 * 60, 23 * 60][shiftIndex % 3]
}
 
/**
 * Compute how many calendar days have passed since the very first sheet.
 * We convert everything to "absolute minutes since 00:00 of the starting date"
 * and count how many full 1440-minute blocks have elapsed.
 */
function computeDayOffset(
  firstShiftIndex: number,
  firstShiftMinutesElapsed: number,
  sheetIndex: number,
  assignments: Array<{ shiftIndex: number; startMinuteInShift: number; actualDuration: number }>,
): number {
  if (sheetIndex === 0) return 0
 
  // Anchor: absolute minute of day when the very first work starts
  const firstShiftStart = shiftAbsoluteStart(firstShiftIndex)
  const firstWorkAbsMinute = firstShiftStart + firstShiftMinutesElapsed
 
  // Absolute minute when the current sheet starts
  const targetShiftStart = shiftAbsoluteStart(assignments[sheetIndex].shiftIndex)
  const targetWorkAbsMinute = targetShiftStart + assignments[sheetIndex].startMinuteInShift
 
  // Raw difference in minutes (may be negative if shift wraps midnight, so we add 1440 as needed)
  // Walk forward shift by shift to accumulate days properly
  let absMinute = firstWorkAbsMinute
  let days = 0
 
  for (let i = 1; i <= sheetIndex; i++) {
    const prevShiftIdx = assignments[i - 1].shiftIndex
    const currShiftIdx = assignments[i].shiftIndex
 
    // Previous shift ends at: shiftAbsoluteStart(prev) + 480
    // Current shift starts at: shiftAbsoluteStart(curr) + startMinuteInShift (always 0 for i>0)
    const prevShiftEndAbs = shiftAbsoluteStart(prevShiftIdx) + 480
    const currShiftStartAbs = shiftAbsoluteStart(currShiftIdx)
 
    if (currShiftStartAbs < prevShiftEndAbs % 1440 || prevShiftEndAbs >= 1440) {
      // Crossed midnight
      days++
    }
  }
 
  return days
}
 
export function getProductionSheetHtml(data: ProductionSheetData): string {
  return generateProductionSheet(data).html
}
 
function generateShiftSheet(
  date: string,
  conductor: string,
  shiftName: string,
  shiftStartHour: number,
  shiftEndHour: number,
  diameter: string,
  pressure: string,
  targetQuantity: number,
  targetPieces: number,
  speed: number,
  shiftDuration: number,    // actual working time in minutes for this sheet
  hdPercentage: number,
  ldPercentage: number,
  wastePercentage: number,
  startMinuteOffsetInShift: number, // how many minutes into the shift the work actually starts
  pageNumber: number,
  totalPages: number,
): string {
  const hours = Math.floor(shiftDuration / 60)
  const minutes = Math.round(shiftDuration % 60)
  const timeFormatted = `${hours}h ${minutes}min`
 
  // Actual start time = shift start + offset already consumed
  const actualStartTotalMin = shiftStartHour * 60 + startMinuteOffsetInShift
  const actualStartH = Math.floor(actualStartTotalMin / 60) % 24
  const actualStartM = actualStartTotalMin % 60
 
  // Actual end time = actual start + working duration
  const actualEndTotalMin = actualStartTotalMin + shiftDuration
  const actualEndH = Math.floor(actualEndTotalMin / 60) % 24
  const actualEndM = Math.round(actualEndTotalMin % 60)
 
  const fmt = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
 
  const actualShiftHours = `${fmt(actualStartH, actualStartM)} - ${fmt(actualEndH, actualEndM)}`
  const fullShiftHours = `${fmt(shiftStartHour, 0)} - ${fmt(shiftEndHour, 0)}`
 
  const tableRows = Array.from({ length: 8 }, (_, i) => `
    <tr style="border: 1px solid #999;">
      <td style="border: 1px solid #999; padding: 8px; text-align: center;">${i + 1}</td>
      <td style="border: 1px solid #999; padding: 8px;"></td>
      <td style="border: 1px solid #999; padding: 8px;"></td>
      <td style="border: 1px solid #999; padding: 8px;"></td>
      <td style="border: 1px solid #999; padding: 8px;"></td>
      <td style="border: 1px solid #999; padding: 8px;"></td>
    </tr>
  `).join('')
 
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fiche de Production</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.6;
          color: #333;
        }
        .sheet {
          page-break-after: always;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px dashed #ccc;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0052A3;
          padding-bottom: 15px;
        }
        .header h1 { margin: 0; font-size: 24px; color: #0052A3; }
        .header p  { margin: 5px 0; font-size: 12px; color: #666; }
        .info-section {
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        .info-item {
          padding: 10px;
          background-color: #f9f9f9;
          border-left: 3px solid #0052A3;
        }
        .info-label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; }
        .info-value { font-size: 13px; color: #333; margin-top: 5px; font-weight: bold; }
        .objective-section { margin-bottom: 25px; }
        .section-title {
          font-weight: bold; font-size: 14px; margin-bottom: 10px;
          color: #0052A3; border-bottom: 2px solid #0052A3; padding-bottom: 5px;
        }
        .objective-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .objective-table th, .objective-table td { border: 1px solid #999; padding: 10px; text-align: left; }
        .objective-table th { background-color: #0052A3; color: white; font-weight: bold; }
        .objective-table td { background-color: #f9f9f9; }
        .observation-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .observation-table th, .observation-table td {
          border: 1px solid #999; padding: 8px; text-align: left; font-size: 11px;
        }
        .observation-table th { background-color: #0052A3; color: white; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
        .material-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 12px; }
        .material-item { background-color: #f0f0f0; padding: 8px; border-radius: 4px; }
        .material-item strong { display: block; color: #0052A3; }
        .page-indicator { text-align: right; font-size: 10px; color: #999; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <h1>FICHE DE PRODUCTION - POSTE ${pageNumber}/${totalPages}</h1>
          <p>COMPTOIR GUETAT INDUSTRIE - Système de Gestion de Stock</p>
        </div>
 
        <div class="info-section">
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${date}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Équipe</div>
            <div class="info-value">${shiftName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Poste (officiel)</div>
            <div class="info-value">${fullShiftHours}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Horaire Réel</div>
            <div class="info-value">${actualShiftHours}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Conducteur</div>
            <div class="info-value">${conductor || 'À remplir'}</div>
          </div>
        </div>
 
        <div class="objective-section">
          <div class="section-title">OBJECTIF POUR CE POSTE</div>
          <table class="objective-table">
            <thead>
              <tr>
                <th style="width: 50%">Article</th>
                <th style="width: 50%">Quantité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${diameter}mm ${pressure}</td>
                <td>${targetPieces} rouleau(x)</td>
              </tr>
              <tr>
                <td colspan="2">
                  <div class="material-info">
                    <div class="material-item">
                      <strong>HD (${hdPercentage}%)</strong>
                      ${(targetQuantity * hdPercentage / 100).toFixed(2)} kg
                    </div>
                    <div class="material-item">
                      <strong>LD (${ldPercentage}%)</strong>
                      ${(targetQuantity * ldPercentage / 100).toFixed(2)} kg
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
 
          <div class="material-info" style="margin-bottom: 15px;">
            <div class="material-item">
              <strong>Quantité Totale</strong>
              ${targetQuantity.toFixed(2)} kg
            </div>
            <div class="material-item">
              <strong>Taux Déchet</strong>
              ${wastePercentage.toFixed(1)}%
            </div>
            <div class="material-item">
              <strong>Vitesse Production</strong>
              ${speed.toFixed(2)} m/min
            </div>
            <div class="material-item">
              <strong>Durée Poste</strong>
              ${timeFormatted}
            </div>
          </div>
        </div>
 
        <div class="objective-section">
          <div class="section-title">SUIVI DE PRODUCTION</div>
          <p style="font-size: 12px; color: #666; margin-bottom: 10px;">À compléter au fur et à mesure de la production</p>
          <table class="observation-table">
            <thead>
              <tr>
                <th style="width: 8%;">Num</th>
                <th style="width: 15%;">Heure</th>
                <th style="width: 15%;">Longueur (m)</th>
                <th style="width: 15%;">Poids (kg)</th>
                <th style="width: 15%;">Déchet (kg)</th>
                <th style="width: 32%;">Observation</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="page-indicator">Page ${pageNumber} sur ${totalPages}</div>
        </div>
      </div>
 
      <div class="footer">
        <p>Fiche générée automatiquement par COMPTOIR GUETAT INDUSTRIE - ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    </body>
    </html>
  `
 
  return html
}
 
export function downloadPDF(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' })
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = URL.createObjectURL(blob)
  document.body.appendChild(iframe)
  iframe.onload = function () {
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(iframe.src)
    }, 100)
  }
}
 