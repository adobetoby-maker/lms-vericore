import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

// GET /api/documents/[id]/access — list teams this doc is assigned to
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: doc } = await supabaseAdmin
    .from('documents').select('id, title, visibility').eq('id', id).single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: access } = await supabaseAdmin
    .from('document_access')
    .select('id, team_id, is_required, teams:team_id(id, name)')
    .eq('document_id', id)
    .order('id')

  return NextResponse.json({ doc, access: access ?? [] })
}

// POST /api/documents/[id]/access — assign doc to a team
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { team_id, is_required } = await req.json() as { team_id: number; is_required?: boolean }
  if (!team_id) return NextResponse.json({ error: 'team_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('document_access')
    .upsert({ document_id: id, team_id, is_required: is_required ?? false }, { onConflict: 'document_id,team_id' })
    .select('id, team_id, is_required')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/documents/[id]/access — update visibility or required flag
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { visibility?: string; access_id?: number; is_required?: boolean }

  if (body.visibility) {
    const { error } = await supabaseAdmin
      .from('documents').update({ visibility: body.visibility }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.access_id !== undefined && body.is_required !== undefined) {
    const { error } = await supabaseAdmin
      .from('document_access').update({ is_required: body.is_required }).eq('id', body.access_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/documents/[id]/access — remove a team assignment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _docId } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { access_id } = await req.json() as { access_id: number }
  await supabaseAdmin.from('document_access').delete().eq('id', access_id)
  return NextResponse.json({ ok: true })
}
