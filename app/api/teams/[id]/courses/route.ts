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

// POST /api/teams/[id]/courses — add course + auto-enroll all team members
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id: teamId } = await params
  const { course_id } = await req.json() as { course_id: number }
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  // Add course to team (idempotent)
  const { error: courseErr } = await supabaseAdmin
    .from('team_courses')
    .insert({ team_id: Number(teamId), course_id })

  if (courseErr && courseErr.code !== '23505') {
    return NextResponse.json({ error: courseErr.message }, { status: 500 })
  }

  // Auto-enroll all current team members
  const { data: members } = await supabaseAdmin
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)

  if (members?.length) {
    const enrollments = members.map(m => ({
      user_id: m.user_id,
      course_id,
      status: 'not_started' as const,
    }))
    await supabaseAdmin
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/teams/[id]/courses?course_id=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id: teamId } = await params
  const course_id = req.nextUrl.searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  await supabaseAdmin.from('team_courses').delete().eq('team_id', teamId).eq('course_id', course_id)
  return NextResponse.json({ ok: true })
}
