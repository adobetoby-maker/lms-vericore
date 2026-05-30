import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'
import CreateCourseForm from './CreateCourseForm'
import CourseTable from './CourseTable'
import { BookOpen } from 'lucide-react'

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select(`id, title, description, is_active, created_at, videos(id), questions(id), enrollments(id)`)
    .order('created_at', { ascending: false })

  const courseList = courses ?? []

  return (
    <div className="min-h-screen bg-[#0a0a18]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Courses</h1>
            <p className="text-slate-400 mt-1">Manage all courses, videos, and questions.</p>
          </div>
          <CreateCourseForm />
        </div>

        {courseList.length === 0 ? (
          <div className="bg-[#1a1a2e] border border-dashed border-[#2a2a4a] rounded-xl p-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No courses yet</h2>
            <p className="text-slate-400 text-sm">Create your first course using the form above.</p>
          </div>
        ) : (
          <CourseTable courses={courseList.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description ?? '',
            is_active: course.is_active,
            created_at: course.created_at,
            videoCount: Array.isArray(course.videos) ? course.videos.length : 0,
            questionCount: Array.isArray(course.questions) ? course.questions.length : 0,
            enrollCount: Array.isArray(course.enrollments) ? course.enrollments.length : 0,
          }))} />
        )}
      </main>
    </div>
  )
}
