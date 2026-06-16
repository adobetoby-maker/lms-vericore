import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const courseId = Number(body.course_id)
  if (isNaN(courseId)) return NextResponse.json({ error: 'Invalid course_id' }, { status: 400 })

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  // Only update if still in progress — don't overwrite a passed/failed status
  if (enrollment.status === 'in_progress') {
    await supabaseAdmin
      .from('enrollments')
      .update({ video_watched: true })
      .eq('id', enrollment.id)
  }

  return NextResponse.json({ ok: true })
}
