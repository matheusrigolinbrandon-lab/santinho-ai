'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { href: '/crm',       icon: 'ti-users',             label: 'Leads CRM'  },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-14 flex flex-col items-center py-4 gap-1 flex-shrink-0"
           style={{ background: '#0F0F0F', borderRight: '1px solid #2C2C2C' }}>
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm font-black"
           style={{ background: '#C9A84C', color: '#0F0F0F' }}>
        S
      </div>

      {NAV.map(item => {
        const active = path.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors group relative"
            style={active
              ? { background: '#C9A84C', color: '#0F0F0F' }
              : { color: '#7A7670' }}
          >
            <i className={`ti ${item.icon} text-base`} />
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap
                             opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity"
                  style={{ background: '#222', color: '#fff' }}>
              {item.label}
            </span>
          </Link>
        )
      })}

      {/* Company tag at bottom */}
      <div className="mt-auto mb-1 text-center" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[8px] tracking-widest uppercase"
              style={{ color: '#3a3832' }}>
          Maringá/PR
        </span>
      </div>
    </aside>
  )
}
