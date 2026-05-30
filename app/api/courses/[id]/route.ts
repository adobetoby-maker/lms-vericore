import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const courseId = Number(id)
  if (isNaN(courseId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // Cascade delete: videos, questions, enrollments, invites, quiz_attempts, then course
  await supabaseAdmin.from('quiz_attempts').delete().eq('course_id', courseId)
  await supabaseAdmin.from('invites').delete().eq('course_id', courseId)
  await supabaseAdmin.from('enrollments').delete().eq('course_id', courseId)
  await supabaseAdmin.from('questions').delete().eq('course_id', courseId)
  await supabaseAdmin.from('videos').delete().eq('course_id', courseId)
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
