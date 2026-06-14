import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!p?.is_admin
}

// POST /api/teams/[id]/members — add member + auto-enroll in team courses
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id: teamId } = await params
  const { user_id } = await req.json() as { user_id: string }
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  // Add to team (idempotent)
  const { error: memberErr } = await supabaseAdmin
    .from('team_members')
    .insert({ team_id: Number(teamId), user_id })
    .select()

  if (memberErr && memberErr.code !== '23505') {
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  // Auto-enroll in all team courses
  const { data: teamCourses } = await supabaseAdmin
    .from('team_courses')
    .select('course_id')
    .eq('team_id', teamId)

  if (teamCourses?.length) {
    const enrollments = teamCourses.map(tc => ({
      user_id,
      course_id: tc.course_id,
      status: 'not_started' as const,
    }))
    await supabaseAdmin
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/teams/[id]/members?user_id=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id: teamId } = await params
  const user_id = req.nextUrl.searchParams.get('user_id')
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  await supabaseAdmin.from('team_members').delete().eq('team_id', teamId).eq('user_id', user_id)
  return NextResponse.json({ ok: true })
}
