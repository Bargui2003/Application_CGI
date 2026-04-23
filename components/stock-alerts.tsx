'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, TrendingDown, Bell } from 'lucide-react'
import { useProduction } from '@/context/production-context-supabase'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  item: string
  currentStock: number
  minimumThreshold: number
  status: string
  message: string
  percentage: number
}

const MINIMUM_THRESHOLDS = {
  hd: 1000,
  ld: 1000,
  blackColor: 50,
  dryer: 50,
}

const CRITICAL_THRESHOLDS = {
  hd: 500,
  ld: 500,
  blackColor: 25,
  dryer: 25,
}

export function StockAlerts() {
  const { stockLevels } = useProduction()

  const alerts = useMemo(() => {
    const generatedAlerts: Alert[] = []

    // HD Stock
    const hdPercentage = (stockLevels.hd / MINIMUM_THRESHOLDS.hd) * 100
    if (stockLevels.hd <= CRITICAL_THRESHOLDS.hd) {
      generatedAlerts.push({
        id: 'hd-critical',
        type: 'critical',
        item: 'HD (Haute Densité)',
        currentStock: stockLevels.hd,
        minimumThreshold: CRITICAL_THRESHOLDS.hd,
        status: 'Niveau Critique',
        message: 'Le stock est inférieur au seuil critique. Une réapprovision immédiate est recommandée.',
        percentage: hdPercentage,
      })
    } else if (stockLevels.hd <= MINIMUM_THRESHOLDS.hd) {
      generatedAlerts.push({
        id: 'hd-warning',
        type: 'warning',
        item: 'HD (Haute Densité)',
        currentStock: stockLevels.hd,
        minimumThreshold: MINIMUM_THRESHOLDS.hd,
        status: 'Stock Faible',
        message: 'Envisagez une réapprovision au cours du prochain cycle de production.',
        percentage: hdPercentage,
      })
    } else if (stockLevels.hd <= MINIMUM_THRESHOLDS.hd * 1.2) {
      generatedAlerts.push({
        id: 'hd-info',
        type: 'info',
        item: 'HD (Haute Densité)',
        currentStock: stockLevels.hd,
        minimumThreshold: MINIMUM_THRESHOLDS.hd,
        status: 'Approche du Minimum',
        message: 'Le stock approche du seuil minimum.',
        percentage: hdPercentage,
      })
    } else {
      generatedAlerts.push({
        id: 'hd-success',
        type: 'success',
        item: 'HD (Haute Densité)',
        currentStock: stockLevels.hd,
        minimumThreshold: MINIMUM_THRESHOLDS.hd,
        status: 'Stock Optimal',
        message: 'Les niveaux de stock sont sains et dans la plage acceptable.',
        percentage: hdPercentage,
      })
    }

    // LD Stock
    const ldPercentage = (stockLevels.ld / MINIMUM_THRESHOLDS.ld) * 100
    if (stockLevels.ld <= CRITICAL_THRESHOLDS.ld) {
      generatedAlerts.push({
        id: 'ld-critical',
        type: 'critical',
        item: 'LD (Basse Densité)',
        currentStock: stockLevels.ld,
        minimumThreshold: CRITICAL_THRESHOLDS.ld,
        status: 'Niveau Critique',
        message: 'Le stock est inférieur au seuil critique. Une réapprovision immédiate est recommandée.',
        percentage: ldPercentage,
      })
    } else if (stockLevels.ld <= MINIMUM_THRESHOLDS.ld) {
      generatedAlerts.push({
        id: 'ld-warning',
        type: 'warning',
        item: 'LD (Basse Densité)',
        currentStock: stockLevels.ld,
        minimumThreshold: MINIMUM_THRESHOLDS.ld,
        status: 'Stock Faible',
        message: 'Envisagez une réapprovision au cours du prochain cycle de production.',
        percentage: ldPercentage,
      })
    } else if (stockLevels.ld <= MINIMUM_THRESHOLDS.ld * 1.2) {
      generatedAlerts.push({
        id: 'ld-info',
        type: 'info',
        item: 'LD (Basse Densité)',
        currentStock: stockLevels.ld,
        minimumThreshold: MINIMUM_THRESHOLDS.ld,
        status: 'Approche du Minimum',
        message: 'Le stock approche du seuil minimum.',
        percentage: ldPercentage,
      })
    } else {
      generatedAlerts.push({
        id: 'ld-success',
        type: 'success',
        item: 'LD (Basse Densité)',
        currentStock: stockLevels.ld,
        minimumThreshold: MINIMUM_THRESHOLDS.ld,
        status: 'Stock Optimal',
        message: 'Les niveaux de stock sont sains et dans la plage acceptable.',
        percentage: ldPercentage,
      })
    }

    // Black Color Stock
    const colorPercentage = (stockLevels.blackColor / MINIMUM_THRESHOLDS.blackColor) * 100
    if (stockLevels.blackColor <= CRITICAL_THRESHOLDS.blackColor) {
      generatedAlerts.push({
        id: 'color-critical',
        type: 'critical',
        item: 'Couleur Noire',
        currentStock: stockLevels.blackColor,
        minimumThreshold: CRITICAL_THRESHOLDS.blackColor,
        status: 'Niveau Critique',
        message: 'Le stock est inférieur au seuil critique. Une réapprovision immédiate est recommandée.',
        percentage: colorPercentage,
      })
    } else if (stockLevels.blackColor <= MINIMUM_THRESHOLDS.blackColor) {
      generatedAlerts.push({
        id: 'color-warning',
        type: 'warning',
        item: 'Couleur Noire',
        currentStock: stockLevels.blackColor,
        minimumThreshold: MINIMUM_THRESHOLDS.blackColor,
        status: 'Stock Faible',
        message: 'Envisagez une réapprovision au cours du prochain cycle de production.',
        percentage: colorPercentage,
      })
    } else if (stockLevels.blackColor <= MINIMUM_THRESHOLDS.blackColor * 1.2) {
      generatedAlerts.push({
        id: 'color-info',
        type: 'info',
        item: 'Couleur Noire',
        currentStock: stockLevels.blackColor,
        minimumThreshold: MINIMUM_THRESHOLDS.blackColor,
        status: 'Approche du Minimum',
        message: 'Le stock approche du seuil minimum.',
        percentage: colorPercentage,
      })
    } else {
      generatedAlerts.push({
        id: 'color-success',
        type: 'success',
        item: 'Couleur Noire',
        currentStock: stockLevels.blackColor,
        minimumThreshold: MINIMUM_THRESHOLDS.blackColor,
        status: 'Stock Optimal',
        message: 'Les niveaux de stock sont sains et dans la plage acceptable.',
        percentage: colorPercentage,
      })
    }

    // Dryer Stock
    const dryerPercentage = (stockLevels.dryer / MINIMUM_THRESHOLDS.dryer) * 100
    if (stockLevels.dryer <= CRITICAL_THRESHOLDS.dryer) {
      generatedAlerts.push({
        id: 'dryer-critical',
        type: 'critical',
        item: 'Sécheur',
        currentStock: stockLevels.dryer,
        minimumThreshold: CRITICAL_THRESHOLDS.dryer,
        status: 'Niveau Critique',
        message: 'Le stock est inférieur au seuil critique. Une réapprovision immédiate est recommandée.',
        percentage: dryerPercentage,
      })
    } else if (stockLevels.dryer <= MINIMUM_THRESHOLDS.dryer) {
      generatedAlerts.push({
        id: 'dryer-warning',
        type: 'warning',
        item: 'Sécheur',
        currentStock: stockLevels.dryer,
        minimumThreshold: MINIMUM_THRESHOLDS.dryer,
        status: 'Stock Faible',
        message: 'Envisagez une réapprovision au cours du prochain cycle de production.',
        percentage: dryerPercentage,
      })
    } else if (stockLevels.dryer <= MINIMUM_THRESHOLDS.dryer * 1.2) {
      generatedAlerts.push({
        id: 'dryer-info',
        type: 'info',
        item: 'Sécheur',
        currentStock: stockLevels.dryer,
        minimumThreshold: MINIMUM_THRESHOLDS.dryer,
        status: 'Approche du Minimum',
        message: 'Le stock approche du seuil minimum.',
        percentage: dryerPercentage,
      })
    } else {
      generatedAlerts.push({
        id: 'dryer-success',
        type: 'success',
        item: 'Sécheur',
        currentStock: stockLevels.dryer,
        minimumThreshold: MINIMUM_THRESHOLDS.dryer,
        status: 'Stock Optimal',
        message: 'Les niveaux de stock sont sains et dans la plage acceptable.',
        percentage: dryerPercentage,
      })
    }

    return generatedAlerts
  }, [stockLevels])

  const criticalCount = alerts.filter(a => a.type === 'critical').length
  const warningCount = alerts.filter(a => a.type === 'warning').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes Critiques</p>
                <p className="text-3xl font-bold text-destructive">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avertissements</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matériaux Totaux</p>
                <p className="text-3xl font-bold">4</p>
              </div>
              <Bell className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertes de Niveau de Stock</CardTitle>
          <CardDescription>Notifications en temps réel pour l'inventaire des matériaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-4 ${
                  alert.type === 'critical'
                    ? 'border-destructive bg-destructive/5'
                    : alert.type === 'warning'
                    ? 'border-yellow-500 bg-yellow-500/5'
                    : alert.type === 'info'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-green-500 bg-green-500/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      {alert.type === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                      {alert.type === 'warning' && (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      {alert.type === 'info' && (
                        <TrendingDown className="h-5 w-5 text-blue-500" />
                      )}
                      {alert.type === 'success' && (
                        <Bell className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{alert.item}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Badge
                    variant={alert.type === 'critical' ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {alert.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Actuel: {alert.currentStock.toFixed(2)} kg | Minimum: {alert.minimumThreshold} kg</span>
                  <span>Utilisation: {(100 - alert.percentage).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
