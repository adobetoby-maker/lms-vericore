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

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const courseId = formData.get('course_id') as string | null
  const title = formData.get('title') as string | null

  if (!file || !courseId) return NextResponse.json({ error: 'file and course_id required' }, { status: 400 })

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${admin.id}/${courseId}/${timestamp}-${safeName}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabaseAdmin.storage
    .from('slides')
    .upload(storagePath, bytes, { contentType: 'application/pdf', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: last } = await supabaseAdmin
    .from('slide_modules')
    .select('slide_order')
    .eq('course_id', Number(courseId))
    .order('slide_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = last ? last.slide_order + 1 : 0

  const { data, error } = await supabaseAdmin
    .from('slide_modules')
    .insert({
      course_id: Number(courseId),
      title: title ?? file.name,
      slide_type: 'pdf',
      pdf_path: storagePath,
      pdf_file_name: file.name,
      slide_order: nextOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, slide: data })
}
