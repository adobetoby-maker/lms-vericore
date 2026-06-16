import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: teams, error } = await supabaseAdmin
    .from('teams')
    .select(`
      id, name, description, created_at,
      team_members(count),
      team_courses(count)
    `)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shaped = (teams ?? []).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    created_at: t.created_at,
    member_count: (t.team_members as unknown as { count: number }[])[0]?.count ?? 0,
    course_count: (t.team_courses as unknown as { count: number }[])[0]?.count ?? 0,
  }))

  return NextResponse.json(shaped)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description } = await req.json() as { name: string; description?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('teams')
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
