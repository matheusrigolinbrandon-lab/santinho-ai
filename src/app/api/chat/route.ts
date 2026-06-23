// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  localClassify,
  claudeChat,
  detectBuyIntent,
  FALLBACK_RESPONSE,
} from '@/lib/ai/santinho'
import type { ChatRequest, ChatResponse } from '@/types'

const USE_CLAUDE = Boolean(process.env.ANTHROPIC_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { message, session_id, phone, channel = 'widget', wa_id, profile_name } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }
    if (!session_id?.trim()) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
    }

    // ── 1. GET OR CREATE CONVERSATION ──────────────────────────
    let conversationId: string
    let leadId: string | null = null

    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id, lead_id')
      .eq('session_id', session_id)
      .maybeSingle()

    if (existingConv) {
      conversationId = existingConv.id
      leadId         = existingConv.lead_id
    } else {
      const { data: newConv, error: convErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          session_id,
          phone:   phone    || null,
          channel,
          metadata: wa_id ? { wa_id, profile_name } : {},
        })
        .select('id')
        .single()

      if (convErr || !newConv) {
        throw convErr ?? new Error('Falha ao criar conversa')
      }
      conversationId = newConv.id
    }

    // ── 2. LOAD HISTORY (last 20 messages) ─────────────────────
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const historyForClaude = (history ?? []).map(m => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // ── 3. SAVE USER MESSAGE ────────────────────────────────────
    await supabaseAdmin.from('chat_messages').insert({
      conversation_id: conversationId,
      role:    'user',
      content: message.trim(),
    })

    // ── 4. GENERATE RESPONSE ────────────────────────────────────
    let responseText  = ''
    let tokensUsed    = 0
    let isLowConfidence = false

    if (USE_CLAUDE) {
      // ── Modo produção: Claude com RAG ───────────────────────
      try {
        const result = await claudeChat(message, historyForClaude)
        responseText = result.text
        tokensUsed   = result.tokensUsed

        const lowSignals = [
          'não tenho essa informação', 'não sei ao certo',
          'não tenho certeza', 'vou verificar', 'não encontrei',
        ]
        isLowConfidence = lowSignals.some(s =>
          responseText.toLowerCase().includes(s)
        )
      } catch (claudeErr) {
        console.error('[Claude error, falling back to local]', claudeErr)
        responseText = localClassify(message) || FALLBACK_RESPONSE
        isLowConfidence = !localClassify(message)
      }
    } else {
      // ── Modo MVP: respostas locais ──────────────────────────
      responseText    = localClassify(message)
      isLowConfidence = !responseText

      if (isLowConfidence) {
        responseText = FALLBACK_RESPONSE
        // Log pergunta sem resposta
        await supabaseAdmin.from('unanswered_questions').insert({
          conversation_id: conversationId,
          question: message.trim(),
          channel,
        }).catch(() => {})
      }
    }

    // ── 5. SAVE ASSISTANT RESPONSE ──────────────────────────────
    await supabaseAdmin.from('chat_messages').insert({
      conversation_id: conversationId,
      role:        'assistant',
      content:     responseText,
      tokens_used: tokensUsed || null,
      metadata:    { mode: USE_CLAUDE ? 'claude' : 'local', is_low_confidence: isLowConfidence },
    })

    // ── 6. AUTO-CREATE LEAD (se detectar intenção de compra) ────
    let leadCreated = false
    if (!leadId && detectBuyIntent(message)) {
      const { data: newLead } = await supabaseAdmin
        .from('leads')
        .insert({
          name:           profile_name || 'Lead via Chat',
          phone:          phone        || null,
          source:         channel === 'whatsapp' ? 'whatsapp' : 'site',
          status:         'novo',
          assigned_agent: 'Santinho IA',
          interested_in:  [],
          tags:           [channel, 'automatico'],
          notes:          `Primeira mensagem: "${message.substring(0, 200)}"`,
        })
        .select('id')
        .single()

      if (newLead) {
        leadId      = newLead.id
        leadCreated = true

        await supabaseAdmin
          .from('conversations')
          .update({ lead_id: leadId })
          .eq('id', conversationId)

        await supabaseAdmin.from('lead_activities').insert({
          lead_id:     leadId,
          type:        'system',
          title:       'Lead criado automaticamente pelo Santinho',
          description: `Canal: ${channel}`,
          agent:       'Santinho IA',
        }).catch(() => {})
      }
    }

    const response: ChatResponse = {
      message:         responseText,
      conversation_id: conversationId,
      lead_id:         leadId,
      lead_created:    leadCreated,
      is_low_confidence: isLowConfidence,
    }

    return NextResponse.json(response)

  } catch (err: unknown) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({
      message:           'Desculpe, tive um problema técnico. Tente novamente em instantes! 😊',
      conversation_id:   '',
      lead_id:           null,
      lead_created:      false,
      is_low_confidence: true,
    }, { status: 500 })
  }
}

// ── Webhook WhatsApp (GET = verificação Meta) ──────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
