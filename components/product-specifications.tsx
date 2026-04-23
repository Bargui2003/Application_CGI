'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PRODUCT_SPECS = [
  {
    diameter: 25,
    specs: [
      { pressure: 'PN6', minWeight: 11, maxWeight: 12 },
      { pressure: 'PN10', minWeight: 13, maxWeight: 14 },
      { pressure: 'PN10F', minWeight: 15, maxWeight: 16 },
    ]
  },
  {
    diameter: 32,
    specs: [
      { pressure: 'PN6', minWeight: 20, maxWeight: 21 },
      { pressure: 'PN8', minWeight: 21, maxWeight: 22 },
      { pressure: 'PN10', minWeight: 24, maxWeight: 25 },
    ]
  },
  {
    diameter: 40,
    specs: [
      { pressure: 'PN6', minWeight: 29, maxWeight: 30 },
      { pressure: 'PN8', minWeight: 34, maxWeight: 35 },
      { pressure: 'PN10', minWeight: 39, maxWeight: 40 },
    ]
  },
  {
    diameter: 50,
    specs: [
      { pressure: 'PN6', minWeight: 39, maxWeight: 40 },
      { pressure: 'PN8', minWeight: 49, maxWeight: 50 },
      { pressure: 'PN10', minWeight: 58, maxWeight: 60 },
    ]
  },
  {
    diameter: 63,
    specs: [
      { pressure: 'PN6', minWeight: 60, maxWeight: 62 },
      { pressure: 'PN8', minWeight: 70, maxWeight: 72 },
      { pressure: 'PN10', minWeight: 84, maxWeight: 85 },
    ]
  },
  {
    diameter: 75,
    specs: [
      { pressure: 'PN6', minWeight: 84, maxWeight: 85 },
      { pressure: 'PN8', minWeight: 95, maxWeight: 97 },
      { pressure: 'PN10', minWeight: 110, maxWeight: 112 },
    ]
  },
  {
    diameter: 90,
    specs: [
      { pressure: 'PN6', minWeight: 130, maxWeight: 135 },
      { pressure: 'PN8', minWeight: 150, maxWeight: 155 },
    ]
  },
]

export function ProductSpecifications() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spécifications des Produits</CardTitle>
          <CardDescription>Exigences de poids pour différentes tailles de tuyaux et classes de pression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {PRODUCT_SPECS.map((product) => (
              <div key={product.diameter} className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-3">Tuyaux {product.diameter}mm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.specs.map((spec) => (
                    <div key={`${product.diameter}-${spec.pressure}`} className="bg-card rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{spec.pressure}</span>
                        <Badge variant="outline">{product.diameter}mm</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Plage de Poids</p>
                        <p className="text-lg font-bold text-primary">
                          {spec.minWeight} - {spec.maxWeight} kg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
