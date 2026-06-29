# Guide d'Implémentation i18n (Multilingue)

## Vue d'ensemble

Le système i18n permet de traduire l'application entière en **Français** et **Chinois** avec un simple bouton de changement de langue dans le header. Les préférences sont sauvegardées dans `localStorage`.

## Architecture

### 1. Fichiers Clés

```
lib/i18n/
├── translations.ts          # Dictionnaire FR + ZH (200+ clés)
├── component-helpers.ts     # Helpers pour formater les textes

context/
└── language-context.tsx     # Context React + Hook useLanguage()

components/
└── language-switcher.tsx    # Bouton 🇫🇷/🇨🇳 dans le Header
```

### 2. Comment Utiliser

#### Dans un Composant

```tsx
'use client'
import { useLanguage } from '@/context/language-context'

export function MonComposant() {
  const { t } = useLanguage()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('action.save')}</button>
    </div>
  )
}
```

#### Avec des Variables

```tsx
const message = t('calibre.changeSummary', {
  from: '25',
  to: '40'
})
// Résultat FR: "Passage de Ø25mm à Ø40mm"
// Résultat ZH: "从 Ø25mm 变为 Ø40mm"
```

#### Utiliser les Helpers

```tsx
import { getDiameterLabel, formatTime } from '@/lib/i18n/component-helpers'
import { useLanguage } from '@/context/language-context'

export function MyComponent() {
  const { language } = useLanguage()
  
  const label = getDiameterLabel('25', language)    // "Ø25"
  const time = formatTime(150, language)              // "2h 30min"
}
```

## Ajouter des Traductions

### 1. Ajouter une Clé

Éditez `/lib/i18n/translations.ts` et ajoutez dans les deux sections `fr:` et `zh:`:

```ts
export const translations = {
  fr: {
    'myFeature.title': 'Mon Titre',
    'myFeature.description': 'Ma description',
    // ... rest
  },
  zh: {
    'myFeature.title': '我的标题',
    'myFeature.description': '我的描述',
    // ... rest
  },
}
```

### 2. Utiliser dans un Composant

```tsx
const { t } = useLanguage()
return <h1>{t('myFeature.title')}</h1>
```

## Composants Traduits

### ✅ Complètement Traduits
- **Header** (avec Language Switcher)
- **Login Page** (formulaire de connexion)
- **Main Dashboard** (page d'accueil)
- **Language Context & Provider**

### 🔄 Partiellement Traduits
- **Production Calculator** (imports + hooks ajoutés, labels à traduire graduellement)
- **App Tabs** (imports ajoutés, structure prête)

### 📋 À Traduire
- **Magasinier Dashboard** (page complète)
- **Production Records** (tableau et détails)
- **Stock Level Management** (gestion des stocks)
- **User Profile & Settings** (profil utilisateur)
- **Admin Panels** (si applicable)

## Flux de Traduction Recommandé

1. **Ajouter les clés** dans `translations.ts` (FR + ZH)
2. **Importer** `useLanguage()` dans le composant
3. **Remplacer** les textes durs par `t('cle.sousCle')`
4. **Tester** en changeant la langue via le bouton

## Exemple Complet

### Avant
```tsx
export function ProductionList() {
  return (
    <div>
      <h2>Mes Productions</h2>
      <button>Ajouter</button>
      <p>Aucune donnée</p>
    </div>
  )
}
```

### Après
```tsx
import { useLanguage } from '@/context/language-context'

export function ProductionList() {
  const { t } = useLanguage()
  
  return (
    <div>
      <h2>{t('conductor.production')}</h2>
      <button>{t('action.add')}</button>
      <p>{t('message.noData')}</p>
    </div>
  )
}
```

## Persistance

La langue sélectionnée est automatiquement sauvegardée dans `localStorage` sous la clé `'language'`. Elle est restaurée au chargement de la page.

## Performance

- **Zéro dépendances externes** : Implémentation légère avec Context API
- **Pas de bundle supplémentaire** : Textes inclus dans l'app
- **Chargement instantané** : Pas d'appels API pour changer de langue

## Ajouter une Nouvelle Langue

1. Ajouter la langue au type `Language`:
```ts
export type Language = 'fr' | 'zh' | 'en' // ← ajouter 'en'
```

2. Ajouter les traductions complètes:
```ts
export const translations = {
  fr: { ... },
  zh: { ... },
  en: { ... }, // ← ajouter complètement
}
```

3. Mettre à jour le Language Switcher:
```tsx
<button onClick={() => setLanguage('en')} ...>🇬🇧</button>
```

## Raccourcis Clés

| Clé Commune | FR | ZH |
|-------------|----|----|
| `action.save` | Enregistrer | 保存 |
| `action.cancel` | Annuler | 取消 |
| `action.delete` | Supprimer | 删除 |
| `message.success` | Succès | 成功 |
| `message.error` | Erreur | 错误 |
| `form.required` | Requis | 必填项 |

## Dépannage

### "useLanguage must be used within a LanguageProvider"
- Assurez-vous que `LanguageProvider` enveloppe le composant dans `layout.tsx`
- Vérifiez que le composant est marqué avec `'use client'`

### Texte ne change pas
- Inspectez le navigateur : allez dans DevTools > Console
- Vérifiez que la clé existe dans `translations.ts`
- Vérifiez que `useLanguage()` est appelé

### localStorage pas clair
- Les paramètres de langue persistent automatiquement
- Pour forcer une langue au démarrage, modifiez `language-context.tsx`

## Feuille de Route Future

- [ ] Ajouter l'anglais (`'en'`)
- [ ] Ajouter l'arabe (`'ar'`)
- [ ] Intégration avec service i18n externe pour traductions dynamiques
- [ ] RTL support pour les langues arabes
