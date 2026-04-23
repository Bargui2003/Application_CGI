import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Footer } from '@/components/footer'
import { AuthProvider } from '@/context/auth-context'
import { ProductionProvider } from '@/context/production-context-supabase'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Comptoir Guetat Industrie - Système de Gestion de Production',
  description: 'CGI - Gestion avancée de production et suivi des stocks pour la fabrication de tuyaux en polyéthylène haute performance',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body 
        className="font-sans antialiased flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProductionProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </ProductionProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
