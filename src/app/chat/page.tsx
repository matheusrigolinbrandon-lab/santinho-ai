'use client'

import SantinhoWidget from '@/components/shared/SantinhoWidget'

export default function ChatPage() {
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      background: '#0a0a0a',
      overflow: 'hidden'
    }}>
      <SantinhoWidget standalone />
    </main>
  )
}