'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lead, LeadStatus } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'

const COLS: LeadStatus[] = [
  'novo', 'contato_realizado', 'qualificado',
  'orcamento_enviado', 'negociacao', 'venda_fechada',
]

export default function CRMPage() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200' })
    if (search) params.set('search', search)
    try {
      const r = await fetch(`/api/leads?${params}`)
      const d = await r.json()
      setLeads(d.leads ?? [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const byStatus = COLS.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s)
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  const update = async (id: string, data: Partial<Lead>) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    load()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F6F5F1]">
      {/* Header */}
      <div className="bg-white border-b border-[#ECEAE3] px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div>
          <h1 className="font-black text-sm text-[#0F0F0F]">Leads CRM · Fundição Tropical</h1>
          <p className="text-[10px] text-[#7A7670]">
            {leads.filter(l => l.status !== 'perdido').length} leads ativos
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="text-xs border border-[#ECEAE3] rounded-lg px-3 py-1.5 bg-white text-[#0F0F0F] outline-none focus:border-[#C9A84C] w-40"
          />
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full min-w-max pb-2">
            {COLS.map(status => {
              const cfg = LEAD_STATUS_CONFIG[status]
              const colLeads = byStatus[status] ?? []
              return (
                <div key={status} className="w-52 flex-shrink-0">
                  {/* Col header */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-2"
                       style={{ background: cfg.bgColor }}>
                    <div className="flex items-center gap-1.5">
                      <i className={`ti ${cfg.icon} text-xs`} style={{ color: cfg.color }} />
                      <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-white rounded-full px-1.5 py-px"
                          style={{ background: cfg.color }}>
                      {colLeads.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className="bg-white border border-[#ECEAE3] rounded-lg p-3 cursor-pointer
                                   hover:border-[#C9A84C] hover:shadow-sm transition-all"
                      >
                        <p className="font-bold text-xs text-[#0F0F0F] mb-0.5 truncate">{lead.name}</p>
                        {lead.city && <p className="text-[10px] text-[#7A7670]">📍 {lead.city}</p>}
                        {lead.phone && <p className="text-[10px] text-[#7A7670]">📱 {lead.phone}</p>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#ECEAE3]">
                          <span className="text-[9px] text-[#7A7670]">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px]" style={{ color: cfg.color }}>
                            <i className={`ti ${cfg.icon}`} />
                          </span>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="text-center text-[10px] text-[#DEDAD0] py-6">Vazio</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelected(null)} />
          <div className="relative w-80 bg-white border-l border-[#ECEAE3] h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm text-[#0F0F0F]">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-[#7A7670] hover:text-[#0F0F0F]">
                <i className="ti ti-x text-base" />
              </button>
            </div>

            {/* Status change */}
            <p className="text-[10px] font-bold text-[#7A7670] uppercase tracking-wide mb-2">Status</p>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {COLS.map(s => {
                const c = LEAD_STATUS_CONFIG[s]
                const isActive = s === selected.status
                return (
                  <button
                    key={s}
                    onClick={() => { update(selected.id, { status: s }); setSelected({ ...selected, status: s }) }}
                    className="text-[10px] px-2 py-1.5 rounded-lg transition-all text-left flex items-center gap-1.5"
                    style={isActive
                      ? { background: c.color, color: '#fff', fontWeight: 700 }
                      : { background: '#F6F5F1', color: '#7A7670' }}
                  >
                    <i className={`ti ${c.icon} text-xs`} />
                    {c.label}
                  </button>
                )
              })}
            </div>

            {/* Fields */}
            <div className="space-y-3 text-xs">
              {[
                { label: 'Telefone', value: selected.phone },
                { label: 'Cidade',   value: selected.city },
                { label: 'Estado',   value: selected.state },
                { label: 'Origem',   value: selected.source },
                { label: 'Agente',   value: selected.assigned_agent },
              ].map(f => f.value && (
                <div key={f.label}>
                  <p className="text-[9px] font-bold text-[#7A7670] uppercase tracking-wide">{f.label}</p>
                  <p className="font-medium text-[#0F0F0F]">{f.value}</p>
                </div>
              ))}

              {selected.interested_in?.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-[#7A7670] uppercase tracking-wide mb-1">Interesses</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.interested_in.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(201,168,76,.1)', color: '#8B6914' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="text-[9px] font-bold text-[#7A7670] uppercase tracking-wide">Notas</p>
                  <p className="text-[#0F0F0F]">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {selected.phone && (
                <a
                  href={`https://wa.me/55${selected.phone.replace(/\D/g,'')}?text=Ol%C3%A1+${encodeURIComponent(selected.name)}!+Aqui+%C3%A9+a+Fundi%C3%A7%C3%A3o+Tropical.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold text-white rounded-lg py-2 transition-opacity hover:opacity-90"
                  style={{ background: '#25d366' }}
                >
                  <i className="ti ti-brand-whatsapp" /> Abrir WhatsApp
                </a>
              )}
              <p className="text-[9px] text-[#7A7670] text-center">
                Criado em {new Date(selected.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
