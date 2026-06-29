import { Language, translations } from './translations'

/**
 * Helper functions to easily translate component labels and messages
 */

export function getDiameterLabel(diameter: string, language: Language = 'fr'): string {
  const key = `calc.diameter${diameter}` as keyof typeof translations.fr
  return translations[language][key] || `Ø${diameter}`
}

export function getStatusLabel(status: string, language: Language = 'fr'): string {
  const statusMap: Record<string, string> = {
    draft: language === 'fr' ? 'Brouillon' : '草稿',
    validated: language === 'fr' ? 'Validé' : '已验证',
    validated_by_magasinier: language === 'fr' ? 'Validé par Magasinier' : '由库管员验证',
    rejected_by_magasinier: language === 'fr' ? 'Rejeté par Magasinier' : '被库管员拒绝',
  }
  return statusMap[status] || status
}

export function formatTime(minutes: number, language: Language = 'fr'): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (language === 'zh') {
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
  }
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
}

export function formatQuantity(qty: number, unit: string = 'kg', language: Language = 'fr'): string {
  return `${qty.toFixed(2)} ${unit}`
}
