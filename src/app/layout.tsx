import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/shared/Sidebar'
import SantinhoWidget from '@/components/shared/SantinhoWidget'

export const metadata: Metadata = {
  title: 'Santinho AI — Fundição Tropical',
  description: 'Painel de atendimento inteligente · Fundição Tropical · Maringá/PR',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css" />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
        <SantinhoWidget />
      </body>
    </html>
  )
}
