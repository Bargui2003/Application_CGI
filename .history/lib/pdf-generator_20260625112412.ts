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
  startingShiftIndex?: number
  availableMinutesForFirstShift?: number
}

export interface ProductionStatus {
  lastShiftIndex: number       // Équipe qui a terminé en dernier (0, 1, 2)
  remainingMinutes: number     // Minutes restantes dans son poste
  totalPiecesProduced: number
  // Champs de persistence : horodatage absolu de fin de production
  // (permet de recalculer l'état même après rechargement de la page)
  absoluteEndTimestamp?: number // Date.now() au moment où la fiche a été générée + durée
}

export interface ProductionSheetResult {
  html: string
  status: ProductionStatus
}

// ─── Définitions des équipes ──────────────────────────────────────────────────
const SHIFTS = [
  { name: '1ère Équipe', startHour: 7,  endHour: 15 },
  { name: '2ème Équipe', startHour: 15, endHour: 23 },
  { name: '3ème Équipe', startHour: 23, endHour: 7  },
]

const MAX_SHIFT_DURATION = 480 // 8h en minutes

// ─── Utilitaires de temps ─────────────────────────────────────────────────────

/** Retourne l'index de l'équipe active pour un instant donné */
function shiftIndexAt(date: Date): number {
  const h = date.getHours()
  if (h >= 7 && h < 15) return 0
  if (h >= 15 && h < 23) return 1
  return 2
}

/** Minutes écoulées depuis le début du poste pour un instant donné */
function minutesElapsedInShift(date: Date): number {
  const h = date.getHours()
  const m = date.getMinutes()
  const total = h * 60 + m
  const si = shiftIndexAt(date)
  if (si === 0) return total - 7 * 60
  if (si === 1) return total - 15 * 60
  // Shift 2 : 23h→7h
  return total >= 23 * 60 ? total - 23 * 60 : total + 60
}

/** Minutes restantes dans le poste actif pour un instant donné */
function minutesRemainingInShift(date: Date): number {
  return MAX_SHIFT_DURATION - minutesElapsedInShift(date)
}

/**
 * Reconstruit l'état de production à partir d'un timestamp absolu de fin.
 * Permet de retrouver sur quelle équipe / combien de minutes restantes
 * même après rechargement de la page.
 */
export function resolveStatusFromTimestamp(endTimestamp: number): {
  shiftIndex: number
  remainingMinutes: number
} {
  const endDate = new Date(endTimestamp)
  const si = shiftIndexAt(endDate)
  const remaining = minutesRemainingInShift(endDate)
  return { shiftIndex: si, remainingMinutes: Math.max(0, remaining) }
}

/**
 * Formate l'état de la chaîne de production en texte lisible.
 * Ex: "Prochaine production : 2ème Équipe à partir de 18:30"
 */
export function formatProductionQueueStatus(status: ProductionStatus): string {
  if (!status.absoluteEndTimestamp) {
    return formatShiftStatus(status.lastShiftIndex, status.remainingMinutes)
  }
  const resolved = resolveStatusFromTimestamp(status.absoluteEndTimestamp)
  return formatShiftStatus(resolved.shiftIndex, resolved.remainingMinutes)
}

function formatShiftStatus(shiftIndex: number, remainingMinutes: number): string {
  const shift = SHIFTS[shiftIndex % 3]
  if (remainingMinutes <= 0) {
    // Le poste est terminé, la prochaine production commence au début du poste suivant
    const nextShiftIndex = (shiftIndex + 1) % 3
    const next = SHIFTS[nextShiftIndex]
    return `Prochaine : ${next.name} dès ${String(next.startHour).padStart(2, '0')}:00`
  }
  // Calculer l'heure de début = heure de fin du poste - minutes restantes
  const endHourMin = SHIFTS[shiftIndex % 3].endHour * 60
  const startMin = endHourMin - remainingMinutes
  const h = Math.floor(((startMin % 1440) + 1440) % 1440 / 60)
  const m = ((startMin % 60) + 60) % 60
  return `Prochaine : ${shift.name} à partir de ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── Résolution du point de départ ───────────────────────────────────────────

function resolveStartingShift(data: ProductionSheetData): {
  shiftIndex: number
  availableMinutes: number
  minutesElapsed: number
} {
  // Cas 1 : il y a une production précédente (startingShiftIndex + availableMinutesForFirstShift fournis)
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

  // Cas 2 : première production → utiliser l'heure actuelle
  const now = new Date()
  const si = shiftIndexAt(now)
  const elapsed = minutesElapsedInShift(now)
  const remaining = MAX_SHIFT_DURATION - elapsed
  return {
    shiftIndex: si,
    availableMinutes: remaining,
    minutesElapsed: elapsed,
  }
}

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateProductionSheet(data: ProductionSheetData): ProductionSheetResult {
  const {
    date, conductor, diameter, pressure,
    targetQuantity, targetPieces, speed,
    hdPercentage, ldPercentage, wastePercentage,
  } = data

  const timePerRoll = 100 / speed // minutes par rouleau (100 m)

  const starting = resolveStartingShift(data)
  let currentShiftIndex = starting.shiftIndex
  let minutesAvailableThisShift = starting.availableMinutes
  let minutesAlreadyUsedInShift = starting.minutesElapsed

  // ── Distribution des rouleaux ──
  const shiftAssignments: Array<{
    shiftIndex: number
    pieces: number
    actualDuration: number
    quantity: number
    startMinuteInShift: number
  }> = []

  let remainingPieces = targetPieces
  let lastUsedShiftIndex = currentShiftIndex
  let lastRemainingMinutes = minutesAvailableThisShift

  while (remainingPieces > 0) {
    const shiftIndex = currentShiftIndex % 3
    const maxRolls = Math.floor(minutesAvailableThisShift / timePerRoll)
    const pieces = Math.min(maxRolls, remainingPieces)

    if (pieces > 0) {
      const actualDuration = pieces * timePerRoll
      shiftAssignments.push({
        shiftIndex,
        pieces,
        actualDuration,
        quantity: (pieces * targetQuantity) / targetPieces,
        startMinuteInShift: minutesAlreadyUsedInShift,
      })
      remainingPieces -= pieces
      lastUsedShiftIndex = shiftIndex
      lastRemainingMinutes = minutesAvailableThisShift - actualDuration
    }

    currentShiftIndex++
    minutesAvailableThisShift = MAX_SHIFT_DURATION
    minutesAlreadyUsedInShift = 0
  }

  // ── Calcul du timestamp absolu de fin de production ──
  // On part de "maintenant" et on ajoute la durée totale de production
  // (en ignorant les pauses entre équipes, car la machine tourne en continu)
  const totalProductionMinutes = shiftAssignments.reduce((sum, a) => sum + a.actualDuration, 0)
  const absoluteEndTimestamp = Date.now() + totalProductionMinutes * 60 * 1000

  // ── Génération HTML ──
  const addDays = (dateStr: string, days: number): string => {
    const [day, month, year] = dateStr.split('/').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString('fr-FR')
  }

  let allShiftsHTML = ''
  const totalSheets = shiftAssignments.length

  for (let i = 0; i < totalSheets; i++) {
    const a = shiftAssignments[i]
    const shiftDef = SHIFTS[a.shiftIndex]
    const dayOffset = computeDayOffset(starting.shiftIndex, i, shiftAssignments)
    const sheetDate = dayOffset === 0 ? date : addDays(date, dayOffset)

    allShiftsHTML += generateShiftSheet(
      sheetDate, conductor, shiftDef.name,
      shiftDef.startHour, shiftDef.endHour,
      diameter, pressure,
      a.quantity, a.pieces, speed, a.actualDuration,
      hdPercentage, ldPercentage, wastePercentage,
      a.startMinuteInShift,
      i + 1, totalSheets,
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
      absoluteEndTimestamp,
    },
  }
}

function computeDayOffset(
  firstShiftIndex: number,
  sheetIndex: number,
  assignments: Array<{ shiftIndex: number }>,
): number {
  if (sheetIndex === 0) return 0
  let days = 0
  for (let i = 1; i <= sheetIndex; i++) {
    const prev = assignments[i - 1].shiftIndex
    const curr = assignments[i].shiftIndex
    // On traverse minuit si l'équipe courante précède l'équipe précédente dans la journée
    if (curr <= prev) days++
  }
  return days
}

export function getProductionSheetHtml(data: ProductionSheetData): string {
  return generateProductionSheet(data).html
}

// ─── Génération d'une fiche par équipe ───────────────────────────────────────

function generateShiftSheet(
  date: string, conductor: string,
  shiftName: string, shiftStartHour: number, shiftEndHour: number,
  diameter: string, pressure: string,
  targetQuantity: number, targetPieces: number,
  speed: number, shiftDuration: number,
  hdPercentage: number, ldPercentage: number, wastePercentage: number,
  startMinuteOffsetInShift: number,
  pageNumber: number, totalPages: number,
): string {
  const hours = Math.floor(shiftDuration / 60)
  const minutes = Math.round(shiftDuration % 60)
  const timeFormatted = `${hours}h ${minutes}min`

  const actualStartTotalMin = shiftStartHour * 60 + startMinuteOffsetInShift
  const actualStartH = Math.floor(actualStartTotalMin / 60) % 24
  const actualStartM = actualStartTotalMin % 60
  const actualEndTotalMin = actualStartTotalMin + shiftDuration
  const actualEndH = Math.floor(actualEndTotalMin / 60) % 24
  const actualEndM = Math.round(actualEndTotalMin % 60)

  const fmt = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  const actualShiftHours = `${fmt(actualStartH, actualStartM)} - ${fmt(actualEndH, actualEndM)}`
  const fullShiftHours   = `${fmt(shiftStartHour, 0)} - ${fmt(shiftEndHour, 0)}`

  const tableRows = Array.from({ length: 8 }, (_, i) => `
    <tr>
      <td style="border:1px solid #999;padding:8px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #999;padding:8px;"></td>
      <td style="border:1px solid #999;padding:8px;"></td>
      <td style="border:1px solid #999;padding:8px;"></td>
      <td style="border:1px solid #999;padding:8px;"></td>
      <td style="border:1px solid #999;padding:8px;"></td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de Production</title>
  <style>
    body { font-family:Arial,sans-serif; padding:20px; max-width:900px; margin:0 auto; line-height:1.6; color:#333; }
    .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #0052A3; padding-bottom:15px; }
    .header h1 { margin:0; font-size:24px; color:#0052A3; }
    .header p  { margin:5px 0; font-size:12px; color:#666; }
    .info-section { margin-bottom:25px; display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
    .info-item { padding:10px; background:#f9f9f9; border-left:3px solid #0052A3; }
    .info-label { font-weight:bold; color:#666; font-size:11px; text-transform:uppercase; }
    .info-value { font-size:13px; color:#333; margin-top:5px; font-weight:bold; }
    .section-title { font-weight:bold; font-size:14px; margin-bottom:10px; color:#0052A3; border-bottom:2px solid #0052A3; padding-bottom:5px; }
    .objective-table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    .objective-table th, .objective-table td { border:1px solid #999; padding:10px; text-align:left; }
    .objective-table th { background:#0052A3; color:white; }
    .objective-table td { background:#f9f9f9; }
    .observation-table { width:100%; border-collapse:collapse; margin-top:15px; }
    .observation-table th, .observation-table td { border:1px solid #999; padding:8px; font-size:11px; }
    .observation-table th { background:#0052A3; color:white; }
    .material-info { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; font-size:12px; }
    .material-item { background:#f0f0f0; padding:8px; border-radius:4px; }
    .material-item strong { display:block; color:#0052A3; }
    .page-indicator { text-align:right; font-size:10px; color:#999; margin-top:10px; }
    .footer { margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:10px; color:#999; text-align:center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FICHE DE PRODUCTION - POSTE ${pageNumber}/${totalPages}</h1>
    <p>COMPTOIR GUETAT INDUSTRIE - Système de Gestion de Stock</p>
  </div>
  <div class="info-section">
    <div class="info-item"><div class="info-label">Date</div><div class="info-value">${date}</div></div>
    <div class="info-item"><div class="info-label">Équipe</div><div class="info-value">${shiftName}</div></div>
    <div class="info-item"><div class="info-label">Poste officiel</div><div class="info-value">${fullShiftHours}</div></div>
    <div class="info-item"><div class="info-label">Horaire réel</div><div class="info-value">${actualShiftHours}</div></div>
    <div class="info-item"><div class="info-label">Conducteur</div><div class="info-value">${conductor || 'À remplir'}</div></div>
  </div>
  <div style="margin-bottom:25px;">
    <div class="section-title">OBJECTIF POUR CE POSTE</div>
    <table class="objective-table">
      <thead><tr><th style="width:50%">Article</th><th style="width:50%">Quantité</th></tr></thead>
      <tbody>
        <tr><td>${diameter}mm ${pressure}</td><td>${targetPieces} rouleau(x)</td></tr>
        <tr><td colspan="2">
          <div class="material-info">
            <div class="material-item"><strong>HD (${hdPercentage}%)</strong>${(targetQuantity * hdPercentage / 100).toFixed(2)} kg</div>
            <div class="material-item"><strong>LD (${ldPercentage}%)</strong>${(targetQuantity * ldPercentage / 100).toFixed(2)} kg</div>
          </div>
        </td></tr>
      </tbody>
    </table>
    <div class="material-info" style="margin-bottom:15px;">
      <div class="material-item"><strong>Quantité Totale</strong>${targetQuantity.toFixed(2)} kg</div>
      <div class="material-item"><strong>Taux Déchet</strong>${wastePercentage.toFixed(1)}%</div>
      <div class="material-item"><strong>Vitesse Production</strong>${speed.toFixed(2)} m/min</div>
      <div class="material-item"><strong>Durée Poste</strong>${timeFormatted}</div>
    </div>
  </div>
  <div>
    <div class="section-title">SUIVI DE PRODUCTION</div>
    <p style="font-size:12px;color:#666;margin-bottom:10px;">À compléter au fur et à mesure de la production</p>
    <table class="observation-table">
      <thead><tr>
        <th style="width:8%">Num</th><th style="width:15%">Heure</th>
        <th style="width:15%">Longueur (m)</th><th style="width:15%">Poids (kg)</th>
        <th style="width:15%">Déchet (kg)</th><th style="width:32%">Observation</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="page-indicator">Page ${pageNumber} sur ${totalPages}</div>
  </div>
  <div class="footer">
    <p>Fiche générée automatiquement par COMPTOIR GUETAT INDUSTRIE - ${new Date().toLocaleString('fr-FR')}</p>
  </div>
</body>
</html>`
}

// ─── Téléchargement PDF ───────────────────────────────────────────────────────

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

// ─── Clé localStorage ────────────────────────────────────────────────────────
export const PRODUCTION_QUEUE_KEY = 'cgi_production_queue_status'