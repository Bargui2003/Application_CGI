'use client'

export function Footer() {
  return (
    <footer className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-50 mt-16 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">À Propos de CGI</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Comptoir Guetat Industrie offre des solutions avancées de gestion de production et de stocks pour les opérations de fabrication de tuyaux en polyéthylène haute performance.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Capacités</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Calculs de matériaux automatisés</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Suivi des stocks en temps réel</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Gestion par poste de travail</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Génération de fiches PDF</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Production</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Tuyaux PE PN6 à PN10F</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Diamètres 25 à 90mm</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Optimisation des rendements</li>
              <li className="flex items-center gap-2"><span className="text-primary">→</span> Conformité industrielle</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2026 Comptoir Guetat Industrie. Tous droits réservés.
          </p>
          <p className="text-sm text-slate-400">
            Excellence industrielle • Technologie • Innovation
          </p>
        </div>
      </div>
    </footer>
  )
}
