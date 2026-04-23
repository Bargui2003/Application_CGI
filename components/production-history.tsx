'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useProduction } from '@/context/production-context-supabase'
import { ProductionRecords } from './production-records'

export function ProductionHistory() {
  const { productionHistory } = useProduction()

  const statistics = useMemo(() => {
    if (productionHistory.length === 0) {
      return {
        totalProduction: 0,
        totalPieces: 0,
        averageWaste: 0,
        averageWeightPerPiece: 0,
        totalProductionTime: 0,
        averageSpeed: 0,
        productionCount: 0,
      }
    }

    const totalProduction = productionHistory.reduce((sum, r) => sum + r.usefulQuantity, 0)
    const totalPieces = productionHistory.reduce((sum, r) => sum + r.piecesCount, 0)
    const averageWaste = productionHistory.reduce((sum, r) => sum + r.wastePercentage, 0) / productionHistory.length
    const averageWeightPerPiece = totalProduction / totalPieces
    const totalProductionTime = productionHistory.reduce((sum, r) => sum + r.productionTime, 0)
    const averageSpeed = productionHistory.reduce((sum, r) => sum + r.speed, 0) / productionHistory.length

    return {
      totalProduction,
      totalPieces,
      averageWaste,
      averageWeightPerPiece,
      totalProductionTime,
      averageSpeed,
      productionCount: productionHistory.length,
    }
  }, [productionHistory])

  const trendData = useMemo(() => {
    if (productionHistory.length === 0) {
      return [
        { date: 'Jour 1', production: 0, pieces: 0 },
        { date: 'Jour 2', production: 0, pieces: 0 },
        { date: 'Jour 3', production: 0, pieces: 0 },
        { date: 'Jour 4', production: 0, pieces: 0 },
        { date: 'Jour 5', production: 0, pieces: 0 },
      ]
    }

    // Group by date (simplified - show last 5 productions)
    const lastFive = productionHistory.slice(0, 5).reverse()
    return lastFive.map((record, index) => ({
      date: `Prod ${index + 1}`,
      production: record.usefulQuantity,
      pieces: record.piecesCount,
    }))
  }, [productionHistory])

  const stockTrendData = useMemo(() => {
    if (productionHistory.length === 0) {
      return [
        { date: 'Début', hd: 1000, ld: 1000, color: 500, dryer: 500 },
      ]
    }

    // Calculate cumulative stock depletion
    let hdStock = 1000
    let ldStock = 1000
    let colorStock = 500
    let dryerStock = 500

    const data = [{ date: 'Début', hd: hdStock, ld: ldStock, color: colorStock, dryer: dryerStock }]

    productionHistory.slice().reverse().forEach((record, index) => {
      hdStock -= record.hdQuantity
      ldStock -= record.ldQuantity
      colorStock -= record.blackColorQuantity
      dryerStock -= record.dryerQuantity

      data.push({
        date: `Prod ${index + 1}`,
        hd: Math.max(0, hdStock),
        ld: Math.max(0, ldStock),
        color: Math.max(0, colorStock),
        dryer: Math.max(0, dryerStock),
      })
    })

    return data.slice(0, 6) // Limit to 6 points
  }, [productionHistory])

  const materialUsageData = useMemo(() => {
    if (productionHistory.length === 0) {
      return [
        { name: 'HD (Haute Densité)', value: 0, percentage: 0 },
        { name: 'LD (Basse Densité)', value: 0, percentage: 0 },
        { name: 'Couleur Noire', value: 0, percentage: 0 },
        { name: 'Sécheur', value: 0, percentage: 0 },
        { name: 'Déchet', value: 0, percentage: 0 },
      ]
    }

    const hdTotal = productionHistory.reduce((sum, r) => sum + r.hdQuantity, 0)
    const ldTotal = productionHistory.reduce((sum, r) => sum + r.ldQuantity, 0)
    const colorTotal = productionHistory.reduce((sum, r) => sum + r.blackColorQuantity, 0)
    const dryerTotal = productionHistory.reduce((sum, r) => sum + r.dryerQuantity, 0)
    const wasteTotal = productionHistory.reduce((sum, r) => sum + (r.totalQuantity - r.usefulQuantity), 0)

    const total = hdTotal + ldTotal + colorTotal + dryerTotal + wasteTotal

    return [
      { name: 'HD (Haute Densité)', value: hdTotal, percentage: (hdTotal / total) * 100 },
      { name: 'LD (Basse Densité)', value: ldTotal, percentage: (ldTotal / total) * 100 },
      { name: 'Couleur Noire', value: colorTotal, percentage: (colorTotal / total) * 100 },
      { name: 'Sécheur', value: dryerTotal, percentage: (dryerTotal / total) * 100 },
      { name: 'Déchet', value: wasteTotal, percentage: (wasteTotal / total) * 100 },
    ]
  }, [productionHistory])

  const timeSpeedData = useMemo(() => {
    if (productionHistory.length === 0) {
      return []
    }

    const lastFive = productionHistory.slice(0, 5).reverse()
    return lastFive.map((record, index) => ({
      name: `Prod ${index + 1}`,
      time: parseFloat(record.productionTime.toFixed(2)),
      speed: parseFloat(record.speed.toFixed(2)),
    }))
  }, [productionHistory])

  const COLORS = ['#D97706', '#9F5413', '#6B4226', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Production Totale</p>
              <p className="text-3xl font-bold text-primary">{statistics.totalProduction.toFixed(0)} kg</p>
              <p className="text-xs text-muted-foreground mt-2">{statistics.productionCount} productions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Pièces Totales</p>
              <p className="text-3xl font-bold text-accent">{statistics.totalPieces.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-2">Unités produites</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Déchet Moyen</p>
              <p className="text-3xl font-bold text-destructive">{statistics.averageWaste.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">De l'entrée totale</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Temps Total Production</p>
              <p className="text-3xl font-bold">{Math.floor(statistics.totalProductionTime / 60)}h {Math.round(statistics.totalProductionTime % 60)}min</p>
              <p className="text-xs text-muted-foreground mt-2">Vitesse moy: {statistics.averageSpeed.toFixed(1)} m/min</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendance de Production</CardTitle>
          <CardDescription>Volume de production quotidien et nombre de pièces</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="production" fill="var(--primary)" name="Production (kg)" />
              <Bar dataKey="pieces" fill="var(--accent)" name="Pièces" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendance des Niveaux de Stock</CardTitle>
          <CardDescription>Niveaux d'inventaire des matières premières au fil du temps</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hd" stroke="var(--chart-1)" name="HD (kg)" strokeWidth={2} />
              <Line type="monotone" dataKey="ld" stroke="var(--chart-2)" name="LD (kg)" strokeWidth={2} />
              <Line type="monotone" dataKey="color" stroke="var(--chart-3)" name="Couleur Noire (kg)" strokeWidth={2} />
              <Line type="monotone" dataKey="dryer" stroke="var(--chart-4)" name="Sécheur (kg)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribution de l'Utilisation des Matériaux</CardTitle>
          <CardDescription>Ventilation de la consommation de matériaux</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={materialUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {materialUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value} kg`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {timeSpeedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Temps de Production vs Vitesse</CardTitle>
            <CardDescription>Corrélation entre la vitesse et le temps de production</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSpeedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" label={{ value: 'Temps (min)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Vitesse (m/min)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="time" fill="var(--chart-2)" name="Temps (min)" />
                <Bar yAxisId="right" dataKey="speed" fill="var(--accent)" name="Vitesse (m/min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <ProductionRecords />

      {productionHistory.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Aucune donnée de production enregistrée. Commencez par sauvegarder une production dans le calculatrice.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
