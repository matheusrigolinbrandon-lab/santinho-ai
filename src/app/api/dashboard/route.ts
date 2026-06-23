// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const now         = new Date()
    const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const startOfMonth= new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [leadsRes, convRes, msgsRes, uaRes] = await Promise.all([
      supabaseAdmin.from('leads').select('id,status,source,created_at'),
      supabaseAdmin.from('conversations').select('id,channel,created_at'),
      supabaseAdmin.from('chat_messages').select('id,role,created_at'),
      supabaseAdmin.from('unanswered_questions').select('id,resolved'),
    ])

    const leads = leadsRes.data ?? []
    const convs = convRes.data  ?? []
    const msgs  = msgsRes.data  ?? []
    const ua    = uaRes.data    ?? []

    // Leads por status e por fonte
    const byStatus: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    leads.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1
      bySource[l.source] = (bySource[l.source] || 0) + 1
    })

    // Chart: últimos 7 dias
    const chart = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      chart.push({
        date:   ds,
        leads:  leads.filter(l => l.created_at.startsWith(ds)).length,
        convs:  convs.filter(c => c.created_at.startsWith(ds)).length,
        msgs:   msgs.filter(m => m.created_at.startsWith(ds)).length,
      })
    }

    return NextResponse.json({
      leads: {
        total:      leads.length,
        today:      leads.filter(l => l.created_at >= startOfDay).length,
        this_week:  leads.filter(l => l.created_at >= startOfWeek).length,
        this_month: leads.filter(l => l.created_at >= startOfMonth).length,
        by_status:  byStatus,
        by_source:  bySource,
      },
      conversations: {
        total:      convs.length,
        today:      convs.filter(c => c.created_at >= startOfDay).length,
        by_channel: convs.reduce((acc: Record<string, number>, c) => {
          acc[c.channel] = (acc[c.channel] || 0) + 1; return acc
        }, {}),
      },
      messages: {
        total:      msgs.length,
        today:      msgs.filter(m => m.created_at >= startOfDay).length,
        user_msgs:  msgs.filter(m => m.role === 'user').length,
      },
      unanswered: {
        total:    ua.length,
        open:     ua.filter(u => !u.resolved).length,
        resolved: ua.filter(u => u.resolved).length,
      },
      chart,
    })
  } catch (err: unknown) {
    console.error('[GET /api/dashboard]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
