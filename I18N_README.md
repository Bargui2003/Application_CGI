# 🌍 Système Multilingue (i18n) - CGI Production

## Bienvenue ! 🎉

L'application supporte maintenant **Français** et **Chinois (中文)** ! Changez de langue en un clic grâce au bouton dans le header.

## Démarrage Rapide

### 1. Lancez l'application
```bash
npm run dev
```

### 2. Cherchez le bouton de langue
Dans le header, vous verrez : **🇫🇷** (Français) et **🇨🇳** (Chinois)

### 3. Cliquez pour changer
- **🇫🇷** → Mode Français
- **🇨🇳** → Mode Chinois (中文)

Votre choix est automatiquement sauvegardé et restauré à chaque visite !

---

## Architecture

```
Application i18n
├── Context (Language Management)
│   └── language-context.tsx
│       ├── LanguageProvider (enveloppe toute l'app)
│       └── useLanguage() hook (utilisé dans chaque composant)
│
├── Traductions (200+ clés FR/ZH)
│   └── lib/i18n/translations.ts
│       ├── français: { 'clé': 'Valeur FR', ... }
│       └── chinois: { 'clé': '值CN', ... }
│
└── UI (Language Switcher)
    └── components/language-switcher.tsx
        └── Boutons 🇫🇷 / 🇨🇳
```

---

## Comment ça Marche

### 1. Structure de Fichiers

```
lib/i18n/
├── translations.ts          ← 200+ clés traduites FR + ZH
├── component-helpers.ts     ← Helpers (getDiameterLabel, formatTime, etc.)
```

### 2. Provider (Layout)

Le `LanguageProvider` est configuré dans `app/layout.tsx`:

```tsx
<LanguageProvider>
  <AuthProvider>
    <ProductionProvider>
      {children}
    </ProductionProvider>
  </AuthProvider>
</LanguageProvider>
```

### 3. Utilisation dans les Composants

```tsx
'use client'
import { useLanguage } from '@/context/language-context'

export function MonComposant() {
  const { t, language } = useLanguage()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      {/* Affiche: "Tableau de Bord" (FR) ou "仪表板" (ZH) */}
      <button>{t('action.save')}</button>
      {/* Affiche: "Enregistrer" (FR) ou "保存" (ZH) */}
    </div>
  )
}
```

---

## Traductions Disponibles

### ✅ Complètement Traduites
| Composant | FR | ZH | Lieu |
|-----------|----|----|------|
| Header & Navigation | ✅ | ✅ | `components/header.tsx` |
| Login Page | ✅ | ✅ | `app/login/page.tsx` |
| Main Dashboard | ✅ | ✅ | `app/page.tsx` |
| Language Switcher | ✅ | ✅ | `components/language-switcher.tsx` |

### 🔄 Partiellement Traduites (Infrastructure Ready)
| Composant | État | Lieu |
|-----------|------|------|
| Production Calculator | 🔄 Hooks ajoutés | `components/production-calculator.tsx` |
| App Tabs | 🔄 Prêt | `components/app-tabs.tsx` |

### 📋 À Traduire
- Magasinier Dashboard
- Production Records
- Stock Levels
- Settings & Profile
- Admin Panels

---

## Ajouter des Traductions

### Étape 1 : Ajouter les Clés

Éditez `/lib/i18n/translations.ts`:

```ts
export const translations = {
  fr: {
    // ... existantes
    'myFeature.title': 'Mon Titre',
    'myFeature.description': 'Ma description',
  },
  zh: {
    // ... existantes
    'myFeature.title': '我的标题',
    'myFeature.description': '我的描述',
  },
}
```

### Étape 2 : Utiliser dans un Composant

```tsx
import { useLanguage } from '@/context/language-context'

export function MyFeature() {
  const { t } = useLanguage()
  
  return (
    <div>
      <h2>{t('myFeature.title')}</h2>
      <p>{t('myFeature.description')}</p>
    </div>
  )
}
```

### Étape 3 : Tester

1. Lancez l'app
2. Changez la langue avec les boutons 🇫🇷/🇨🇳
3. Vérifiez que votre texte s'affiche dans les deux langues

---

## Catégories de Traductions

### 1. Actions Communes
```
action.save      → Enregistrer / 保存
action.delete    → Supprimer / 删除
action.edit      → Modifier / 编辑
action.cancel    → Annuler / 取消
```

### 2. Dashboard
```
dashboard.title       → Tableau de Bord / 仪表板
conductor.title       → Tableau de Bord Conducteur / 导管员仪表板
magasinier.title      → Tableau de Bord Magasinier / 库管员仪表板
```

### 3. Production
```
calc.title        → Calculatrice de Production / 生产计算器
calc.quantity     → Quantité (kg) / 数量 (kg)
calc.diameter     → Diamètre (mm) / 直径 (mm)
calc.speed        → Vitesse (%) / 速度 (%)
```

### 4. Messages
```
message.success   → Succès / 成功
message.error     → Erreur / 错误
message.loading   → Chargement... / 加载中...
message.noData    → Aucune donnée / 无数据
```

### 5. Calibre
```
calibre.title               → Changement de Calibre / 口径变化
calibre.detected            → Changement de Calibre Détecté / 检测到口径变化
calibre.timeLoss            → Perte de Temps / 时间损失
```

---

## Helpers Utiles

### Format Time
```tsx
import { formatTime } from '@/lib/i18n/component-helpers'
import { useLanguage } from '@/context/language-context'

const { language } = useLanguage()
formatTime(90, language)  // "1h 30min" (FR) ou "1小时30分钟" (ZH)
```

### Get Diameter Label
```tsx
import { getDiameterLabel } from '@/lib/i18n/component-helpers'

getDiameterLabel('25', 'fr')  // "Ø25"
getDiameterLabel('25', 'zh')  // "Ø25"
```

### Format Quantity
```tsx
import { formatQuantity } from '@/lib/i18n/component-helpers'

formatQuantity(50.5, 'kg', 'fr')  // "50.50 kg"
formatQuantity(50.5, 'kg', 'zh')  // "50.50 kg"
```

---

## Variables dans les Traductions

Certaines traductions contiennent des variables :

```tsx
const message = t('calibre.changeSummary', {
  from: '25',
  to: '40'
})
// FR: "Passage de Ø25mm à Ø40mm"
// ZH: "从 Ø25mm 变为 Ø40mm"
```

---

## Stockage et Persistance

La langue sélectionnée est sauvegardée dans `localStorage`:
- **Clé**: `language`
- **Valeur**: `'fr'` ou `'zh'`

Elle est automatiquement restaurée au chargement de la page.

Pour **forcer** une langue au démarrage, modifiez `context/language-context.tsx`:
```tsx
const savedLanguage = localStorage.getItem('language') as Language | null
const defaultLanguage = 'zh'  // ← Changer ici
if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'zh')) {
  setLanguageState(savedLanguage)
} else {
  setLanguageState(defaultLanguage)
}
```

---

## Traduction de Composants Complexes

### Exemple : Production Calculator

Le Production Calculator est volumineux. Voici comment le traduire progressivement:

1. **Importer le hook**:
```tsx
import { useLanguage } from '@/context/language-context'

export function ProductionCalculator() {
  const { t } = useLanguage()
  // ...
}
```

2. **Traduire les labels**:
```tsx
<Label>{t('calc.quantity')}</Label>
<Input placeholder={t('calc.diameter')} />
```

3. **Traduire les messages**:
```tsx
if (error) {
  setValidationError(t('form.required'))
}
```

4. **Utiliser les helpers**:
```tsx
import { formatTime } from '@/lib/i18n/component-helpers'
const timeDisplay = formatTime(result.productionTime, language)
```

---

## Ajouter une Nouvelle Langue (ex: Anglais)

### 1. Mettre à Jour le Type
```ts
// lib/i18n/translations.ts
export type Language = 'fr' | 'zh' | 'en'  // ← Ajouter 'en'
```

### 2. Ajouter les Traductions
```ts
export const translations = {
  fr: { ... },
  zh: { ... },
  en: {                        // ← Ajouter complètement
    'login.title': 'Login',
    'dashboard.title': 'Dashboard',
    // ... toutes les clés
  },
}
```

### 3. Mettre à Jour le Language Switcher
```tsx
<button onClick={() => setLanguage('en')} ...>🇬🇧</button>
```

---

## Dépannage

### ❌ "useLanguage must be used within a LanguageProvider"
**Cause**: Le composant n'est pas enveloppé par `LanguageProvider`
**Solution**: Vérifiez que `app/layout.tsx` contient bien le Provider

### ❌ Texte n'apparaît pas après changement de langue
**Cause**: Clé inexistante dans `translations.ts`
**Solution**: Vérifiez la clé dans le fichier et l'orthographe exacte

### ❌ undefined ou [object Object] s'affiche
**Cause**: `t()` est appelé avec une mauvaise clé
**Solution**: Ouvrez la console (DevTools) et vérifiez les erreurs

### ❌ localStorage pas clair
Les préférences persistent automatiquement. Pour les effacer:
```js
// Dans la console du navigateur
localStorage.removeItem('language')
```

---

## Performance

✅ **Zéro dépendances externes** - Utilise uniquement React Context API
✅ **Pas de bundle supplémentaire** - Toutes les traductions sont incluses
✅ **Changement instantané** - Pas d'appels réseau pour changer de langue
✅ **SSR-friendly** - Fonctionne avec Next.js App Router

---

## Prochaines Étapes

1. **Traduire les Dashboards**:
   - Magasinier Dashboard
   - Production Records
   - Stock Management

2. **Ajouter l'Anglais** pour une portée mondiale

3. **Intégration avec Service i18n** pour traductions dynamiques

4. **Support RTL** pour les langues de droite à gauche

---

## Fichiers Clés

| Fichier | Description |
|---------|------------|
| `/lib/i18n/translations.ts` | Dictionnaire FR + ZH (200+ clés) |
| `/context/language-context.tsx` | Context + Hook useLanguage() |
| `/components/language-switcher.tsx` | Boutons 🇫🇷/🇨🇳 |
| `/lib/i18n/component-helpers.ts` | Helpers de formatage |
| `I18N_GUIDE.md` | Guide détaillé pour développeurs |

---

## Support

Pour toute question ou problème :
1. Consultez `I18N_GUIDE.md`
2. Vérifiez `lib/i18n/translations.ts` pour les clés disponibles
3. Inspectez le console du navigateur pour les erreurs

🌍 **Bonne traduction !** (Happy translating!)
