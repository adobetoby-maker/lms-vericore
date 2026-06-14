import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowLeft, Users2 } from 'lucide-react'
import TeamsClient from './TeamsClient'

export const metadata = { title: 'Teams & Departments — LMS Admin' }

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: teamsRaw } = await supabaseAdmin
    .from('teams')
    .select('id, name, description, created_at, team_members(count), team_courses(count)')
    .order('name')

  const teams = (teamsRaw ?? []).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    created_at: t.created_at,
    member_count: (t.team_members as unknown as { count: number }[])[0]?.count ?? 0,
    course_count: (t.team_courses as unknown as { count: number }[])[0]?.count ?? 0,
  }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm mb-5 transition-colors"
            style={{ color: 'var(--text2)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              <Users2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Teams & Departments</h1>
              <p className="mt-1" style={{ color: 'var(--text2)' }}>
                Group learners by team. Members are auto-enrolled in all team courses.
              </p>
            </div>
          </div>
        </div>

        <TeamsClient teams={teams} />
      </main>
    </div>
  )
}
