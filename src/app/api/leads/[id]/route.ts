// src/app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { UpdateLeadInput } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*, activities:lead_activities(*)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ lead: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id }  = await params
    const body: UpdateLeadInput & {
      activity?: { type: string; title: string; description?: string }
    } = await req.json()

    const { activity, ...leadData } = body

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ ...leadData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (activity) {
      await supabaseAdmin.from('lead_activities').insert({
        lead_id:     id,
        type:        activity.type,
        title:       activity.title,
        description: activity.description,
        agent:       'Sistema',
      }).catch(() => {})
    }

    return NextResponse.json({ lead: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
