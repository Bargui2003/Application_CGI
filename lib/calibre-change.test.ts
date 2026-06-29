/**
 * Tests pour la logique de changement de calibre
 * 
 * À exécuter avec : npx ts-node lib/calibre-change.test.ts
 */

import { calculateCalibreChangeLoss, hoursToMinutes, getCalibreChangeLossMinutes } from './calibre-change'

interface TestCase {
  from: string
  to: string
  expectedHours: number
}

const testCases: TestCase[] = [
  // Pas de changement
  { from: '25', to: '25', expectedHours: 0 },
  
  // Petits diamètres entre eux : 1h
  { from: '25', to: '32', expectedHours: 1 },
  { from: '32', to: '25', expectedHours: 1 },
  
  // Diamètres moyens entre eux : 1h
  { from: '40', to: '50', expectedHours: 1 },
  { from: '50', to: '40', expectedHours: 1 },
  
  // Grands diamètres entre eux : 1h
  { from: '63', to: '75', expectedHours: 1 },
  { from: '63', to: '90', expectedHours: 1 },
  { from: '75', to: '90', expectedHours: 1 },
  { from: '90', to: '75', expectedHours: 1 },
  
  // Petit vers moyen/grand : 2h
  { from: '25', to: '40', expectedHours: 2 },
  { from: '25', to: '50', expectedHours: 2 },
  { from: '25', to: '63', expectedHours: 2 },
  { from: '25', to: '75', expectedHours: 2 },
  { from: '25', to: '90', expectedHours: 2 },
  { from: '32', to: '40', expectedHours: 2 },
  { from: '32', to: '50', expectedHours: 2 },
  
  // Moyen vers petit/grand (pas 40↔50) : 2h
  { from: '40', to: '25', expectedHours: 2 },
  { from: '40', to: '32', expectedHours: 2 },
  { from: '40', to: '63', expectedHours: 2 },
  { from: '40', to: '75', expectedHours: 2 },
  { from: '50', to: '25', expectedHours: 2 },
  { from: '50', to: '63', expectedHours: 2 },
  
  // Grand vers petit/moyen : 2h
  { from: '63', to: '25', expectedHours: 2 },
  { from: '63', to: '32', expectedHours: 2 },
  { from: '63', to: '40', expectedHours: 2 },
  { from: '63', to: '50', expectedHours: 2 },
]

// Tests
console.log('🧪 Tests de Changement de Calibre\n')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = calculateCalibreChangeLoss(test.from, test.to)
  const isPass = result === test.expectedHours
  
  if (isPass) {
    passed++
    console.log(`✅ Test ${index + 1}: Ø${test.from}mm → Ø${test.to}mm = ${result}h`)
  } else {
    failed++
    console.log(`❌ Test ${index + 1}: Ø${test.from}mm → Ø${test.to}mm`)
    console.log(`   Attendu: ${test.expectedHours}h, Reçu: ${result}h`)
  }
})

console.log('=' .repeat(60))
console.log(`\n📊 Résultats: ${passed} réussis, ${failed} échoués sur ${testCases.length} tests\n`)

// Tests de conversion
console.log('🔄 Tests de Conversion Heure → Minutes\n')
console.log('=' .repeat(60))

const conversionTests = [
  { hours: 0, expectedMinutes: 0 },
  { hours: 1, expectedMinutes: 60 },
  { hours: 2, expectedMinutes: 120 },
  { hours: 1.5, expectedMinutes: 90 },
]

conversionTests.forEach((test, index) => {
  const result = hoursToMinutes(test.hours)
  const isPass = result === test.expectedMinutes
  
  if (isPass) {
    console.log(`✅ Test ${index + 1}: ${test.hours}h = ${result}min`)
  } else {
    console.log(`❌ Test ${index + 1}: ${test.hours}h`)
    console.log(`   Attendu: ${test.expectedMinutes}min, Reçu: ${result}min`)
  }
})

console.log('=' .repeat(60))
console.log('\n✨ Tests complétés!\n')
