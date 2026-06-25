'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionCalculator } from '@/components/production-calculator'
import { ProductionHistory } from '@/components/production-history'
import { ProductSpecifications } from '@/components/product-specifications'
import { StockAlerts } from '@/components/stock-alerts'
import { StockManagement } from '@/components/stock-management'
import { ProductionRecords } from '@/components/production-records'
import { MagasinierDashboard } from '@/components/magasinier-dashboard'
import { BarChart3, History, Wrench, AlertCircle, Package, FileText, Zap, Store } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { isMagasinier } from '@/lib/auth'

export function AppTabs() {
  const [activeTab, setActiveTab] = useState('calculator')
  const { isAdmin, isConducteur, role } = useAuth()
  const isMagasinierRole = isMagasinier()

  // Déterminer le nombre de tabs à afficher
  const tabCount = [
    isAdmin,
    isAdmin || isConducteur,
    isAdmin || isConducteur,
    isAdmin,
    isAdmin || isConducteur,
    isAdmin || isConducteur,
    isConducteur,
    isMagasinierRole,
  ].filter(Boolean).length

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar avec les onglets - Desktop */}
        <div className="hidden lg:block w-64 shrink-0">
          {/* En-tête avec titre */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Production
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isAdmin ? '👨‍💼 Admin' : isMagasinierRole ? '📦 Magasinier' : '👷 Conducteur'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs List verticale */}
          <TabsList className="flex flex-col gap-2 bg-transparent p-0 h-auto w-full">
            {/* Calculatrice - Admin only */}
            {isAdmin && (
              <TabsTrigger
                value="calculator"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <BarChart3 className="h-5 w-5 shrink-0" />
                <span>Calculatrice</span>
              </TabsTrigger>
            )}

            {/* Stock - Admin & Conducteur */}
            {(isAdmin || isConducteur || is) && (
              <TabsTrigger
                value="stock"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <Package className="h-5 w-5 shrink-0" />
                <span>Stocks</span>
              </TabsTrigger>
            )}

            {/* Alertes - Admin & Conducteur */}
            {(isAdmin || isConducteur) && (
              <TabsTrigger
                value="alerts"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Alertes</span>
              </TabsTrigger>
            )}

            {/* Historique - Admin only */}
            {isAdmin && (
              <TabsTrigger
                value="history"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <History className="h-5 w-5 shrink-0" />
                <span>Statistiques</span>
              </TabsTrigger>
            )}

            {/* Spécifications - Admin & Conducteur */}
            {(isAdmin || isConducteur) && (
              <TabsTrigger
                value="specs"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <Wrench className="h-5 w-5 shrink-0" />
                <span>Spécifications</span>
              </TabsTrigger>
            )}

            {/* Tableau de Bord Magasinier - Magasinier only */}
            {isMagasinierRole && (
              <TabsTrigger
                value="magasinier"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <Store className="h-5 w-5 shrink-0" />
                <span>Magasinier</span>
              </TabsTrigger>
            )}

            {/* Fiches de Production - Conducteur only */}
            {isConducteur && (
              <TabsTrigger
                value="productions"
                className="w-full justify-start gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
              >
                <FileText className="h-5 w-5 shrink-0" />
                <span>Fiches</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tabs horizontales - Mobile */}
        <div className="lg:hidden mb-8 flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Production
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isAdmin ? '👨‍💼 Admin' : isMagasinierRole ? '📦 Magasinier' : '👷 Conducteur'}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <TabsList className="inline-flex gap-2 bg-transparent p-0 h-auto min-w-full">
              {/* Calculatrice - Admin only */}
              {isAdmin && (
                <TabsTrigger
                  value="calculator"
                  className="gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  <span>Calculatrice</span>
                </TabsTrigger>
              )}

              {/* Stock - Admin & Conducteur */}
              {(isAdmin || isConducteur) && (
                <TabsTrigger
                  value="stock"
                  className="gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <Package className="h-4 w-4 shrink-0" />
                  <span>Stocks</span>
                </TabsTrigger>
              )}

              {/* Alertes - Admin & Conducteur */}
              {(isAdmin || isConducteur) && (
                <TabsTrigger
                  value="alerts"
                  className="gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Alertes</span>
                </TabsTrigger>
              )}

              {/* Historique - Admin only */}
              {isAdmin && (
                <TabsTrigger
                  value="history"
                  className="gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>Statistiques</span>
                </TabsTrigger>
              )}

              {/* Spécifications - Admin & Conducteur */}
              {(isAdmin || isConducteur) && (
                <TabsTrigger
                  value="specs"
                  className="gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <Wrench className="h-4 w-4 shrink-0" />
                  <span>Spécifications</span>
                </TabsTrigger>
              )}

              {/* Tableau de Bord Magasinier - Magasinier only */}
              {isMagasinierRole && (
                <TabsTrigger
                  value="magasinier"
                  className="gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <Store className="h-4 w-4 shrink-0" />
                  <span>Magasinier</span>
                </TabsTrigger>
              )}

              {/* Fiches de Production - Conducteur only */}
              {isConducteur && (
                <TabsTrigger
                  value="productions"
                  className="gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>Fiches</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          {/* Calculatrice - Admin only */}
          {isAdmin && (
            <TabsContent value="calculator" className="space-y-6 animate-in fade-in-50 duration-300">
              <ProductionCalculator />
            </TabsContent>
          )}

          {/* Stock */}
          {(isAdmin || isConducteur) && (
            <TabsContent value="stock" className="space-y-6 animate-in fade-in-50 duration-300">
              <StockManagement isReadOnly={isConducteur} />
            </TabsContent>
          )}

          {/* Alertes */}
          {(isAdmin || isConducteur) && (
            <TabsContent value="alerts" className="space-y-6 animate-in fade-in-50 duration-300">
              <StockAlerts />
            </TabsContent>
          )}

          {/* Historique - Admin only */}
          {isAdmin && (
            <TabsContent value="history" className="space-y-6 animate-in fade-in-50 duration-300">
              <ProductionHistory />
            </TabsContent>
          )}

          {/* Spécifications */}
          {(isAdmin || isConducteur) && (
            <TabsContent value="specs" className="space-y-6 animate-in fade-in-50 duration-300">
              <ProductSpecifications />
            </TabsContent>
          )}

          {/* Fiches de Production - Conducteur only */}
          {isConducteur && (
            <TabsContent value="productions" className="space-y-6 animate-in fade-in-50 duration-300">
              <ProductionRecords />
            </TabsContent>
          )}

          {/* Tableau de Bord Magasinier - Magasinier only */}
          {isMagasinierRole && (
            <TabsContent value="magasinier" className="space-y-6 animate-in fade-in-50 duration-300">
              <MagasinierDashboard />
            </TabsContent>
          )}

          {/* Message si conducteur */}
          {isConducteur && (
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <Alert className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                <div className="flex gap-4">
                  <div className="shrink-0 pt-0.5">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-base">
                      Vue Conducteur Activée
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed space-y-2">
                      <div>
                        ✓ Vous avez accès à : <span className="font-semibold">Stocks</span>, <span className="font-semibold">Alertes</span>, <span className="font-semibold">Spécifications</span> et <span className="font-semibold">Fiches de production</span>
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 pt-1">
                        💡 Pour accéder à la calculatrice et l'historique, contactez un administrateur.
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            </div>
          )}

          {/* Message si magasinier */}
          {isMagasinierRole && (
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <Alert className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                <div className="flex gap-4">
                  <div className="shrink-0 pt-0.5">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 text-base">
                      Vue Magasinier Activée
                    </h4>
                    <div className="text-sm text-green-800 dark:text-green-200 leading-relaxed space-y-2">
                      <div>
                        ✓ Vous avez accès au : <span className="font-semibold">Tableau de Bord</span> pour valider les productions en attente
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 pt-1">
                        💡 Vous pouvez valider les productions en statut "Brouillon" et mettre à jour les stocks.
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </Tabs>
  )
}
