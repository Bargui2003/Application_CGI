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
  availableMinutesForFirstShift?: number // Remaining minutes from previous order
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

export function generateProductionSheet(data: ProductionSheetData): ProductionSheetResult {
  const { 
    date, 
    conductor, 
    shift, 
    diameter, 
    pressure, 
    targetQuantity, 
    targetPieces, 
    speed, 
    hdPercentage, 
    ldPercentage, 
    wastePercentage,
    startingShiftIndex = 0,
    availableMinutesForFirstShift = 480
  } = data

  // Define shifts (each 8 hours = 480 minutes)
  const shifts = [
    { name: '1ère Équipe', hours: '07:00 - 15:00' },
    { name: '2ème Équipe', hours: '15:00 - 23:00' },
    { name: '3ème Équipe', hours: '23:00 - 07:00' },
  ]

  const MAX_SHIFT_DURATION = 480 // 8 hours in minutes
  
  // Calculate time needed to produce one roll (each roll = 100 meters)
  const METERS_PER_ROLL = 100
  const timePerRoll = METERS_PER_ROLL / speed // in minutes
  
  // Calculate maximum rolls each team can produce in 8 hours
  const maxRollsPerShift = Math.floor(MAX_SHIFT_DURATION / timePerRoll)
  
  // Distribute rolls to shifts optimally with continuity support
  const shiftAssignments: Array<{ shiftIndex: number; pieces: number; actualDuration: number; quantity: number }> = []
  let remainingPieces = targetPieces
  let shiftCounter = 0
  let currentShiftIndex = startingShiftIndex
  let minutesAvailableThisShift = availableMinutesForFirstShift
  let lastUsedShiftIndex = startingShiftIndex
  let lastRemainingMinutes = availableMinutesForFirstShift
  
  while (remainingPieces > 0) {
    const shiftIndex = currentShiftIndex % 3
    
    // Calculate max rolls this shift can handle with available minutes
    const maxRollsThisShift = Math.floor(minutesAvailableThisShift / timePerRoll)
    const piecesForThisShift = Math.min(maxRollsThisShift, remainingPieces)
    
    // Only create assignment if pieces can be completed
    if (piecesForThisShift > 0) {
      const actualDuration = piecesForThisShift * timePerRoll
      const quantityForThisShift = (piecesForThisShift * targetQuantity) / targetPieces
      
      shiftAssignments.push({
        shiftIndex,
        pieces: piecesForThisShift,
        actualDuration,
        quantity: quantityForThisShift,
      })
      
      remainingPieces -= piecesForThisShift
      lastUsedShiftIndex = shiftIndex
      lastRemainingMinutes = minutesAvailableThisShift - actualDuration
    }
    
    // Move to next shift
    currentShiftIndex++
    minutesAvailableThisShift = MAX_SHIFT_DURATION
  }

  // Generate HTML for all shifts
  let allShiftsHTML = ''
  const totalSheets = shiftAssignments.length
  
  // Helper function to add days to a date
  const addDays = (dateStr: string, days: number): string => {
    const [day, month, year] = dateStr.split('/').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString('fr-FR')
  }
  
  for (let i = 0; i < totalSheets; i++) {
    const assignment = shiftAssignments[i]
    const shiftInfo = shifts[assignment.shiftIndex]
    
    // Calculate which day this production is on (3 shifts per day)
    const dayOffset = Math.floor(i / 3)
    const sheetDate = dayOffset === 0 ? date : addDays(date, dayOffset)
    
    allShiftsHTML += generateShiftSheet(
      sheetDate,
      conductor,
      shiftInfo.name,
      shiftInfo.hours,
      diameter,
      pressure,
      assignment.quantity,
      assignment.pieces,
      speed,
      assignment.actualDuration,
      hdPercentage,
      ldPercentage,
      wastePercentage,
      i + 1,
      totalSheets
    )
    
    // Add page break between sheets (except after last one)
    if (i < totalSheets - 1) {
      allShiftsHTML += '<div style="page-break-after: always;"></div>'
    }
  }

  return {
    html: allShiftsHTML,
    status: {
      lastShiftIndex: lastUsedShiftIndex,
      remainingMinutes: Math.max(0, lastRemainingMinutes),
      totalPiecesProduced: targetPieces
    }
  }
}

export function getProductionSheetHtml(data: ProductionSheetData): string {
  return generateProductionSheet(data).html
}

function generateShiftSheet(
  date: string,
  conductor: string,
  shiftName: string,
  shiftHours: string,
  diameter: string,
  pressure: string,
  targetQuantity: number,
  targetPieces: number,
  speed: number,
  shiftDuration: number,
  hdPercentage: number,
  ldPercentage: number,
  wastePercentage: number,
  pageNumber: number,
  totalPages: number
): string {
  // Format time for this shift (actual working time)
  const hours = Math.floor(shiftDuration / 60)
  const minutes = Math.round(shiftDuration % 60)
  const timeFormatted = `${hours}h ${minutes}min`
  
  // Format start and end time based on actual duration
  const getEndTime = (hours: number, minutes: number, startHour: number): string => {
    let totalMinutes = startHour * 60 + hours * 60 + minutes
    const endHour = Math.floor((totalMinutes / 60) % 24)
    const endMin = Math.floor(totalMinutes % 60)
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
  }
  
  const getStartTime = (shiftHours: string): number => {
    const [start] = shiftHours.split(' - ')
    return parseInt(start.split(':')[0])
  }
  
  const startHour = getStartTime(shiftHours)
  const endTime = getEndTime(hours, minutes, startHour)
  const actualShiftHours = `${String(startHour).padStart(2, '0')}:00 - ${endTime}`

  // Create HTML table rows for observation table (empty for user to fill)
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
        
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #0052A3;
        }
        
        .header p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        
        .info-section {
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 15px;
        }
        
        .info-item {
          padding: 10px;
          background-color: #f9f9f9;
          border-left: 3px solid #0052A3;
        }
        
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 11px;
          text-transform: uppercase;
        }
        
        .info-value {
          font-size: 14px;
          color: #333;
          margin-top: 5px;
          font-weight: bold;
        }
        
        .objective-section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
          color: #0052A3;
          border-bottom: 2px solid #0052A3;
          padding-bottom: 5px;
        }
        
        .objective-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .objective-table th,
        .objective-table td {
          border: 1px solid #999;
          padding: 10px;
          text-align: left;
        }
        
        .objective-table th {
          background-color: #0052A3;
          color: white;
          font-weight: bold;
        }
        
        .objective-table td {
          background-color: #f9f9f9;
        }
        
        .observation-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .observation-table th,
        .observation-table td {
          border: 1px solid #999;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        
        .observation-table th {
          background-color: #0052A3;
          color: white;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          font-size: 10px;
          color: #999;
          text-align: center;
        }
        
        .material-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
          font-size: 12px;
        }
        
        .material-item {
          background-color: #f0f0f0;
          padding: 8px;
          border-radius: 4px;
        }
        
        .material-item strong {
          display: block;
          color: #0052A3;
        }
        
        .page-indicator {
          text-align: right;
          font-size: 10px;
          color: #999;
          margin-top: 10px;
        }
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
          
          <div class="page-indicator">
            Page ${pageNumber} sur ${totalPages}
          </div>
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

function getShiftInfo(shiftIndex: number): { name: string; hours: string } {
  const shifts = [
    { name: '1ère Équipe', hours: '07:00 - 15:00' },
    { name: '2ème Équipe', hours: '15:00 - 23:00' },
    { name: '3ème Équipe', hours: '23:00 - 07:00' },
  ]
  return shifts[shiftIndex % 3]
}

export function downloadPDF(html: string, filename: string) {
  // Create a blob from the HTML
  const blob = new Blob([html], { type: 'text/html' })
  
  // Create an iframe to print
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = URL.createObjectURL(blob)
  
  document.body.appendChild(iframe)
  
  iframe.onload = function() {
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(iframe.src)
    }, 100)
  }
}
