'use client'

import { useState, useEffect } from 'react'
import type { LeadStatus, LeadSource } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'

interface DashStats {
  leads:         { total: number; today: number; this_week: number; by_status: Record<string,number>; by_source: Record<string,number> }
  conversations: { total: number; today: number; by_channel: Record<string,number> }
  messages:      { total: number; today: number }
  unanswered:    { total: number; open: number }
  chart:         Array<{ date: string; leads: number; convs: number; msgs: number }>
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#ECEAE3] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#C9A84C' }} />
      <p className="text-[10px] font-bold text-[#7A7670] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-[#0F0F0F]" style={color ? { color } : {}}>{value}</p>
      {sub && <p className="text-[10px] text-[#7A7670] mt-1 font-medium">{sub}</p>}
    </div>
  )
}

function BarChart({ data }: { data: Array<{ date: string; leads: number; convs: number }> }) {
  const last7 = data.slice(-7)
  const max = Math.max(...last7.map(d => d.leads + d.convs), 1)
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  return (
    <div>
      <div className="flex items-end gap-1 h-16">
        {last7.map((d, i) => {
          const h = Math.max(4, ((d.leads + d.convs) / max) * 60)
          const isToday = i === last7.length - 1
          return (
            <div key={d.date} className="flex-1 rounded-t-sm" title={`${d.date}: ${d.leads} leads`}
                 style={{ height: h, background: isToday ? '#E8C97A' : '#C9A84C', opacity: isToday ? 1 : 0.55 }} />
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        {last7.map((_, i) => (
          <span key={i} className="text-[9px] text-[#7A7670]">{days[i]}</span>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#7A7670]">Carregando dashboard...</p>
      </div>
    </div>
  )

  if (!stats) return (
    <div className="flex-1 flex items-center justify-center text-sm text-[#7A7670]">
      Erro ao carregar dados. Verifique as variáveis de ambiente.
    </div>
  )

  const SOURCE_LABEL: Record<LeadSource, string> = {
    whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook',
    indicacao: 'Indicação', site: 'Site', google: 'Google', outros: 'Outros',
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F6F5F1] p-5">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <h1 className="font-black text-[#0F0F0F] text-base">Dashboard</h1>
          <p className="text-xs text-[#7A7670]">
            Santinho AI · Fundição Tropical · Maringá/PR · Tradição há mais de 40 anos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Leads totais"    value={String(stats.leads.total)}
            sub={`+${stats.leads.today} hoje · ${stats.leads.this_week} esta semana`} />
          <KPICard label="Conversas"       value={String(stats.conversations.total)}
            sub={`+${stats.conversations.today} hoje`} color="#C9A84C" />
          <KPICard label="Mensagens"       value={String(stats.messages.total)}
            sub={`+${stats.messages.today} hoje`} color="#1A7A4A" />
          <KPICard label="Sem resposta"    value={String(stats.unanswered.open)}
            sub="Adicionar à base" color={stats.unanswered.open > 0 ? '#C0392B' : '#1A7A4A'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#ECEAE3] p-4">
            <p className="text-[10px] font-bold text-[#7A7670] uppercase tracking-wide mb-3">
              Leads + Conversas — últimos 7 dias
            </p>
            <BarChart data={stats.chart} />
          </div>

          <div className="bg-white rounded-xl border border-[#ECEAE3] p-4">
            <p className="text-[10px] font-bold text-[#7A7670] uppercase tracking-wide mb-3">
              Origem dos leads
            </p>
            <div className="space-y-2">
              {Object.entries(stats.leads.by_source).map(([src, count]) => {
                const max = Math.max(...Object.values(stats.leads.by_source), 1)
                return (
                  <div key={src} className="flex items-center gap-2">
                    <span className="text-xs text-[#0F0F0F] min-w-[70px]">
                      {SOURCE_LABEL[src as LeadSource] ?? src}
                    </span>
                    <div className="flex-1 h-1.5 bg-[#ECEAE3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: '#C9A84C' }} />
                    </div>
                    <span className="text-xs font-bold text-[#0F0F0F] min-w-[20px] text-right">{count}</span>
                  </div>
                )
              })}
              {Object.keys(stats.leads.by_source).length === 0 && (
                <p className="text-xs text-[#7A7670]">Nenhum lead ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-[#ECEAE3] p-4">
          <p className="text-[10px] font-bold text-[#7A7670] uppercase tracking-wide mb-3">
            Leads por status do CRM
          </p>
          <div className="space-y-2">
            {Object.entries(stats.leads.by_status)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const cfg = LEAD_STATUS_CONFIG[status as LeadStatus]
                const max = Math.max(...Object.values(stats.leads.by_status), 1)
                if (!cfg) return null
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className="text-xs text-[#0F0F0F] min-w-[130px]">{cfg.label}</span>
                    <div className="flex-1 h-1.5 bg-[#ECEAE3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                           style={{ width: `${(count / max) * 100}%`, background: cfg.color }} />
                    </div>
                    <span className="text-xs font-bold text-[#0F0F0F] min-w-[20px] text-right">{count}</span>
                  </div>
                )
              })}
            {Object.keys(stats.leads.by_status).length === 0 && (
              <p className="text-xs text-[#7A7670]">Nenhum lead capturado ainda. Teste o widget!</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
