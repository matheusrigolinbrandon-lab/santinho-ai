// @ts-nocheck
// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { CreateLeadInput } from '@/types'

// ── POST /api/leads ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: CreateLeadInput = await req.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Campo "name" é obrigatório' },
        { status: 400 },
      )
    }

    // Cria ou atualiza lead (upsert por phone)
    let leadId: string | null = null

    if (body.phone) {
      // Verifica se já existe lead ativo com esse telefone
      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id, status')
        .eq('phone', body.phone)
        .neq('status', 'perdido')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        leadId = existing.id
        // Atualiza dados se necessário
        await supabaseAdmin
          .from('leads')
          .update({
            name:          body.name,
            city:          body.city          || undefined,
            interested_in: body.interested_in || undefined,
            notes:         body.notes         || undefined,
            updated_at:    new Date().toISOString(),
          })
          .eq('id', leadId)
      }
    }

    // Se não encontrou lead existente, cria novo
    if (!leadId) {
      const { data: newLead, error } = await supabaseAdmin
        .from('leads')
        .insert({
          name:          body.name.trim(),
          phone:         body.phone?.trim()   || null,
          email:         body.email?.trim()   || null,
          city:          body.city?.trim()    || null,
          state:         body.state           || 'PR',
          source:        body.source          || 'site',
          status:        'novo',
          assigned_agent:'Santinho IA',
          interested_in: body.interested_in   || [],
          tags:          body.tags            || ['widget'],
          notes:         body.notes?.trim()   || null,
        })
        .select('id')
        .single()

      if (error) throw error
      leadId = newLead!.id
    }

    // Liga conversa ao lead (se veio session_id)
    if (body.session_id && leadId) {
      await supabaseAdmin
        .from('conversations')
        .update({ lead_id: leadId })
        .eq('session_id', body.session_id)
        .catch(() => {}) // non-critical
    }

    // Log de atividade
    await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id:     leadId,
        type:        'system',
        title:       'Lead capturado via widget',
        description: body.conversation_summary || 'Formulário de captura no widget',
        agent:       'Santinho IA',
      })
      .catch(() => {})

    return NextResponse.json({ lead_id: leadId, created: true }, { status: 201 })

  } catch (err: unknown) {
    console.error('[POST /api/leads]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── GET /api/leads ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status  = searchParams.get('status')
    const search  = searchParams.get('search')
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit   = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const offset  = (page - 1) * limit

    let query = supabaseAdmin
      .from('leads')
      .select('*, activities:lead_activities(id,type,title,created_at)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`,
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      leads:  data ?? [],
      total:  count ?? 0,
      page,
      limit,
      pages:  Math.ceil((count ?? 0) / limit),
    })
  } catch (err: unknown) {
    console.error('[GET /api/leads]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
