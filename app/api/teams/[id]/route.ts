import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!profile?.is_admin
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const [{ data: team }, { data: members }, { data: courses }] = await Promise.all([
    supabaseAdmin.from('teams').select('*').eq('id', id).single(),
    supabaseAdmin.from('team_members')
      .select('team_id, user_id, created_at, profiles:user_id(first_name, last_name)')
      .eq('team_id', id)
      .order('created_at'),
    supabaseAdmin.from('team_courses')
      .select('team_id, course_id, created_at, courses:course_id(id, title, is_active)')
      .eq('team_id', id)
      .order('created_at'),
  ])

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Attach emails to members
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authUsers?.users ?? []) { if (u.email) emailMap[u.id] = u.email }

  const membersWithEmail = (members ?? []).map(m => ({
    ...m,
    profiles: { ...(m.profiles as unknown as Record<string, unknown> ?? {}), email: emailMap[m.user_id] ?? '' },
  }))

  return NextResponse.json({ team, members: membersWithEmail, courses: courses ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { name, description } = await req.json() as { name?: string; description?: string }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .update({ name: name?.trim(), description: description?.trim() || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await supabaseAdmin.from('teams').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
