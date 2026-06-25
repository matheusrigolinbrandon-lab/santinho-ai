'use client'
import './globals.css'
import Sidebar from '@/components/shared/Sidebar'
import SantinhoWidget from '@/components/shared/SantinhoWidget'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChat = pathname === '/chat'

  if (isChat) {
    return (
      <html lang="pt-BR">
        <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
          {children}
        </body>
      </html>
    )
  }

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