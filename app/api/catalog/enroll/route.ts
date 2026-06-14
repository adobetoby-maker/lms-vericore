import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { course_id?: unknown }
    const course_id = typeof body.course_id === 'number' ? body.course_id : null
    if (!course_id) return NextResponse.json({ error: 'course_id is required' }, { status: 400 })

    // Verify course exists and is catalog-visible
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('catalog_visible', true)
      .eq('is_active', true)
      .single()

    if (courseErr || !course) {
      return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 })
    }

    const { error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .upsert(
        { user_id: user.id, course_id, status: 'in_progress' },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      )

    if (enrollErr) throw new Error(enrollErr.message)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
