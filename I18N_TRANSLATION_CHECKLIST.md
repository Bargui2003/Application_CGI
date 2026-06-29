# Checklist de Traduction (i18n)

## 📋 État Global

**Statut**: 40% Complété
- ✅ Infrastructure: 100%
- ✅ Login Page: 100%
- ✅ Header: 100%
- 🔄 Production Calculator: 20%
- 📋 Dashboards: 0%

---

## ✅ Composants Complètement Traduits

### 1. Language Infrastructure
- [x] `context/language-context.tsx` - Context + Hook
- [x] `components/language-switcher.tsx` - Boutons 🇫🇷/🇨🇳
- [x] `lib/i18n/translations.ts` - 200+ clés
- [x] `lib/i18n/component-helpers.ts` - Helpers

### 2. Login Page (`app/login/page.tsx`)
- [x] Importer `useLanguage()`
- [x] Importer `LanguageSwitcher`
- [x] Traduire titre ("Connexion" → t('login.title'))
- [x] Traduire labels Email/Password
- [x] Traduire bouton "Se connecter"
- [x] Traduire message loading
- [x] Traduire lien "S'inscrire"
- [x] Ajouter Language Switcher au formulaire

### 3. Header (`components/header.tsx`)
- [x] Importer `LanguageSwitcher`
- [x] Ajouter `LanguageSwitcher` dans le header
- [x] Positionner correctement

### 4. Main Page (`app/page.tsx`)
- [x] Importer `useLanguage()`
- [x] Traduire titre "Tableau de Bord"
- [x] Appeler `t('dashboard.title')`

### 5. Layout (`app/layout.tsx`)
- [x] Importer `LanguageProvider`
- [x] Envelopper avec `LanguageProvider`
- [x] Placer avant `AuthProvider`

---

## 🔄 Composants Partiellement Traduits

### Production Calculator (`components/production-calculator.tsx`)

#### Phase 1 - Infrastructure (✅ FAIT)
- [x] Importer `useLanguage()`
- [x] Ajouter `const { t } = useLanguage()`
- [x] Traduire messages de validation

#### Phase 2 - Labels & Buttons (⏳ À FAIRE)
- [ ] `<Label>Nombre de Pièces</Label>` → `t('calc.piecesCount')`
- [ ] `<Label>Quantité (kg)</Label>` → `t('calc.quantity')`
- [ ] `<Label>Diamètre</Label>` → `t('calc.diameter')`
- [ ] `<Label>Pression</Label>` → `t('calc.pressure')`
- [ ] `<Label>Vitesse (%)</Label>` → `t('calc.speed')`
- [ ] `<Label>Déchets (%)</Label>` → `t('calc.waste')`
- [ ] Bouton "Calculer" → `t('calc.calculate')`
- [ ] Bouton "Enregistrer" → `t('action.save')`

#### Phase 3 - Results Display (⏳ À FAIRE)
- [ ] "Quantité HD" → `t('calc.hdQuantity')`
- [ ] "Quantité LD" → `t('calc.ldQuantity')`
- [ ] "Quantité Utile" → `t('calc.usefulQuantity')`
- [ ] "Quantité Totale" → `t('calc.totalQuantity')`
- [ ] "Longueur Totale" → `t('calc.totalLength')`
- [ ] "Temps de Production" → `t('calc.productionTime')`

#### Phase 4 - Calibre Change (⏳ À FAIRE)
- [ ] "Changement de Calibre" → `t('calibre.title')`
- [ ] "Perte de Temps" → `t('calibre.timeLoss')`
- [ ] Messages de changement de calibre

---

## 📋 Composants À Traduire (Nouveau)

### App Tabs (`components/app-tabs.tsx`)
- [ ] Importer `useLanguage()`
- [ ] Ajouter hook `const { t } = useLanguage()`
- [ ] Traduire onglets (Conducteur, Magasinier, etc.)
- [ ] Traduire descriptions

### Magasinier Dashboard (`app/magasinier/page.tsx`)
- [ ] Importer `useLanguage()`
- [ ] Traduire titre du dashboard
- [ ] Traduire sections (Stock, Inventory, etc.)
- [ ] Traduire boutons (Valider, Rejeter, etc.)
- [ ] Traduire tableau des stocks

### Production Records (`components/production-records.tsx`)
- [ ] Importer `useLanguage()`
- [ ] Traduire colonnes du tableau
- [ ] Traduire actions (Modifier, Supprimer)
- [ ] Traduire statuts
- [ ] Traduire messages

### Stock Level Manager (`components/stock-level-manager.tsx`)
- [ ] Importer `useLanguage()`
- [ ] Traduire labels
- [ ] Traduire boutons
- [ ] Traduire messages d'alerte

### User Profile (`components/user-profile.tsx`)
- [ ] Importer `useLanguage()`
- [ ] Traduire menu déroulant
- [ ] Traduire options (Profil, Paramètres, Déconnexion)

### Settings Page
- [ ] Importer `useLanguage()`
- [ ] Traduire sections (Compte, Sécurité, Langue)
- [ ] Traduire labels
- [ ] Traduire boutons

---

## 🎯 Templates de Traduction

### Template Basique
```tsx
// 1. Import
import { useLanguage } from '@/context/language-context'

// 2. Dans le composant
export function MonComposant() {
  const { t } = useLanguage()
  
  // 3. Utiliser
  return (
    <div>
      <h2>{t('myFeature.title')}</h2>
      <button>{t('action.save')}</button>
    </div>
  )
}
```

### Template avec Variables
```tsx
const message = t('calibre.changeSummary', {
  from: '25',
  to: '40'
})
```

### Template avec Helpers
```tsx
import { formatTime, getDiameterLabel } from '@/lib/i18n/component-helpers'

const { language } = useLanguage()

const timeStr = formatTime(150, language)  // "2h 30min"
const diameterStr = getDiameterLabel('25', language)  // "Ø25"
```

---

## 🎨 Clés de Traduction à Ajouter

### Pour Production Calculator
```ts
// lib/i18n/translations.ts

// Ajouter ces clés si absentes:
'calc.recalculate': 'Recalculer / 重新计算',
'calc.reset': 'Réinitialiser / 重置',
'calc.conductor': 'Conducteur / 导管员',
'calc.shift': 'Quart / 轮班',
```

### Pour Magasinier Dashboard
```ts
'magasinier.stockLevels': 'Niveaux de Stock / 库存水平',
'magasinier.validate': 'Valider / 验证',
'magasinier.reject': 'Rejeter / 拒绝',
```

---

## 📝 Processus de Traduction

### Pour Chaque Composant

1. **Ajouter l'Import**
```tsx
import { useLanguage } from '@/context/language-context'
```

2. **Ajouter le Hook**
```tsx
const { t } = useLanguage()
```

3. **Ajouter les Clés** (si nouvelles)
```ts
// Dans lib/i18n/translations.ts
fr: { 'component.key': 'Texte FR', ... }
zh: { 'component.key': '文本ZH', ... }
```

4. **Remplacer les Textes**
```tsx
// Avant
<h1>Mon Titre</h1>

// Après
<h1>{t('component.title')}</h1>
```

5. **Tester**
- Lancer l'app
- Changer la langue 🇫🇷 ↔️ 🇨🇳
- Vérifier que tout s'affiche correctement

---

## 🔍 Checklist de Vérification

Pour chaque composant traduit :

- [ ] Tous les textes utilisent `t('cle')`
- [ ] Pas de texte dur en français ou chinois
- [ ] Les clés existent dans `translations.ts`
- [ ] Les deux versions FR et ZH existent
- [ ] Testé en changeant de langue
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'undefined ou [object Object]
- [ ] Le CSS/layout reste correct

---

## 📊 Progression

| Componant | État | % |
|-----------|------|---|
| Infrastructure | ✅ | 100% |
| Login | ✅ | 100% |
| Header | ✅ | 100% |
| Main Page | ✅ | 100% |
| Prod Calculator | 🔄 | 20% |
| App Tabs | 📋 | 0% |
| Magasinier | 📋 | 0% |
| Stock Manager | 📋 | 0% |
| User Profile | 📋 | 0% |
| Settings | 📋 | 0% |
| **TOTAL** | **🔄** | **40%** |

---

## 🚀 Prochaines Étapes (Priorité)

### 1. Court terme (Cette semaine)
- [ ] Terminer Production Calculator (80% → 100%)
- [ ] Traduire App Tabs (0% → 100%)
- [ ] Traduire Magasinier Dashboard (0% → 100%)

### 2. Moyen terme (Semaine prochaine)
- [ ] Traduire Stock Manager (0% → 100%)
- [ ] Traduire Production Records (0% → 100%)
- [ ] Traduire User Profile (0% → 100%)

### 3. Long terme
- [ ] Ajouter support pour l'Anglais
- [ ] Intégration avec service i18n externe
- [ ] Support RTL pour les langues arabes

---

## 💡 Astuces

1. **Trouver les textes**:
   ```bash
   grep -r "français" /vercel/share/v0-project/components --include="*.tsx"
   ```

2. **Vérifier les clés**:
   Utilisez Ctrl+F dans `translations.ts`

3. **Tester rapidement**:
   Ouvrez DevTools et changez la langue 🇫🇷/🇨🇳

4. **Déboguer**:
   Ajoutez des `console.log(t('clé'))` pour vérifier

---

## 📖 Documentation

- `I18N_README.md` - Guide complet et exemples
- `I18N_GUIDE.md` - Guide technique pour développeurs
- `lib/i18n/translations.ts` - Dictionnaire complet
- `context/language-context.tsx` - Implementation du Context

---

**Dernier Update**: 29/06/2026
**Prochaine Review**: Après traduction des Dashboards
