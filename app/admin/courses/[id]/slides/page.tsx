import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'
import SlideDeckEditor from './SlideDeckEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SlidesPage({ params }: PageProps) {
  const { id } = await params
  const courseId = Number(id)
  if (isNaN(courseId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const { data: slides } = await supabaseAdmin
    .from('slide_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('slide_order', { ascending: true })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/admin/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
            style={{ color: 'var(--text3)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {course.title}
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Slide Builder
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {course.title}
          </p>
        </div>
        <SlideDeckEditor
          courseId={courseId}
          courseTitle={course.title}
          initialSlides={slides ?? []}
        />
      </main>
    </div>
  )
}
