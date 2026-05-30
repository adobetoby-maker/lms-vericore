import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { BookOpen, CheckCircle, Clock, PlayCircle, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, is_admin')
    .eq('id', user.id)
    .single()

  if (profile?.is_admin) redirect('/admin')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      video_watched,
      invited_at,
      completed_at,
      courses (
        id,
        title,
        description,
        is_active
      )
    `)
    .eq('user_id', user.id)
    .order('invited_at', { ascending: false })

  type Enrollment = NonNullable<typeof enrollments>[number]

  const allEnrollments = enrollments ?? []
  const enrolled = allEnrollments.length
  const inProgress = allEnrollments.filter(e => e.status === 'in_progress').length
  const completed = allEnrollments.filter(e => e.status === 'passed').length
  const progressPct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
  const firstName = profile?.first_name?.trim() || 'there'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--text2)' }}>
            {completed === enrolled && enrolled > 0
              ? 'You have completed all your courses. Great work!'
              : `You have ${enrolled - completed} course${enrolled - completed !== 1 ? 's' : ''} remaining.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 card-theme rounded-xl p-6">
            <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text2)' }}>Overall Progress</h2>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>{progressPct}%</span>
              <span className="text-sm pb-1" style={{ color: 'var(--text2)' }}>
                {completed} of {enrolled} courses completed
              </span>
            </div>
            <div className="w-full rounded-full h-3" style={{ background: 'var(--bg)' }}>
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: 'var(--accent)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { Icon: BookOpen,    count: enrolled,   label: 'Enrolled',    color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 15%, transparent)' },
              { Icon: Clock,       count: inProgress, label: 'In Progress', color: '#60a5fa',       bg: 'rgba(96,165,250,0.15)' },
              { Icon: CheckCircle, count: completed,  label: 'Completed',   color: '#34d399',       bg: 'rgba(52,211,153,0.15)' },
            ].map(s => (
              <div key={s.label} className="card-theme rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.count}</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--text)' }}>Your Courses</h2>

          {allEnrollments.length === 0 ? (
            <div className="card-theme border-dashed rounded-xl p-16 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg3)' }}>
                <BookOpen className="w-7 h-7" style={{ color: 'var(--text3)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No courses yet</h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text2)' }}>
                You haven&apos;t been enrolled in any courses yet. Contact your administrator to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {allEnrollments.map((enrollment) => {
                const course = Array.isArray(enrollment.courses)
                  ? enrollment.courses[0]
                  : enrollment.courses
                if (!course) return null

                const status = enrollment.status as 'invited' | 'in_progress' | 'passed' | 'failed'
                const isPassed = status === 'passed'
                const buttonLabel = status === 'invited' ? 'Start' : status === 'in_progress' ? 'Continue' : isPassed ? 'Review' : 'Retry'

                return (
                  <div key={enrollment.id} className="card-theme rounded-xl p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                        <PlayCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-base leading-tight mb-1.5" style={{ color: 'var(--text)' }}>
                        {course.title}
                      </h3>
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text2)' }}>
                        {course.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text3)' }}>
                        {enrollment.video_watched ? '✓ Video watched' : 'Video pending'}
                      </div>
                      <Link
                        href={`/course/${course.id}`}
                        className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ background: isPassed ? '#059669' : 'var(--accent)', color: 'var(--accent-fg)' }}
                      >
                        {buttonLabel}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
