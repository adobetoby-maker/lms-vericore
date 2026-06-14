import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowLeft, Users2 } from 'lucide-react'
import TeamDetailClient from './TeamDetailClient'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [{ data: team }, { data: members }, { data: teamCourses }, { data: allCourses }] = await Promise.all([
    supabaseAdmin.from('teams').select('*').eq('id', id).single(),
    supabaseAdmin.from('team_members')
      .select('team_id, user_id, created_at, profiles:user_id(first_name, last_name)')
      .eq('team_id', id).order('created_at'),
    supabaseAdmin.from('team_courses')
      .select('team_id, course_id, created_at, courses:course_id(id, title, is_active)')
      .eq('team_id', id).order('created_at'),
    supabaseAdmin.from('courses').select('id, title, is_active').eq('is_active', true).order('title'),
  ])

  if (!team) notFound()

  // Attach emails
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authUsers?.users ?? []) { if (u.email) emailMap[u.id] = u.email }

  // All learners (for add-member picker) — get profiles that exist
  const { data: allProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('is_admin', false)
    .order('first_name')

  const allLearners = (allProfiles ?? []).map(p => ({
    id: p.id as string,
    first_name: p.first_name as string,
    last_name: p.last_name as string,
    email: emailMap[p.id as string] ?? '',
  }))

  const membersWithEmail = (members ?? []).map(m => ({
    ...m,
    profiles: { ...(m.profiles as unknown as Record<string, unknown> ?? {}), email: emailMap[m.user_id] ?? '' },
  }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <Link href="/admin/teams" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text2)' }}>
          <ArrowLeft className="w-4 h-4" /> All Teams
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <Users2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>{team.description}</p>
            )}
          </div>
        </div>

        <TeamDetailClient
          team={team}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members={membersWithEmail as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          teamCourses={teamCourses as any}
          allCourses={allCourses ?? []}
          allLearners={allLearners}
        />
      </main>
    </div>
  )
}
