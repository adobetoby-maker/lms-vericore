import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', Number(courseId))
      .maybeSingle()
    if (!enrollment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('slide_modules')
    .select('*')
    .eq('course_id', Number(courseId))
    .order('slide_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { course_id, title, slide_type } = body

  if (!course_id || !title) return NextResponse.json({ error: 'course_id and title required' }, { status: 400 })

  const { data: last } = await supabaseAdmin
    .from('slide_modules')
    .select('slide_order')
    .eq('course_id', Number(course_id))
    .order('slide_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? last.slide_order + 1 : 0

  const { data, error } = await supabaseAdmin
    .from('slide_modules')
    .insert({
      course_id: Number(course_id),
      title,
      slide_type: slide_type ?? 'tiptap',
      slide_order: nextOrder,
      content: slide_type === 'tiptap' ? { type: 'doc', content: [] } : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
