'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Plus, Trash2, Search } from 'lucide-react'
import type { Team, TeamMember, TeamCourse } from '@/lib/teams'

interface Learner { id: string; first_name: string; last_name: string; email: string }
interface Course  { id: number; title: string; is_active: boolean }

interface Props {
  team: Team
  members: (TeamMember & { profiles: { first_name: string; last_name: string; email: string } })[]
  teamCourses: (TeamCourse & { courses: Course })[]
  allCourses: Course[]
  allLearners: Learner[]
}

type Tab = 'members' | 'courses'

export default function TeamDetailClient({ team, members: initMembers, teamCourses: initCourses, allCourses, allLearners }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState(initMembers)
  const [courses, setCourses] = useState(initCourses)
  const [memberSearch, setMemberSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const memberIds = new Set(members.map(m => m.user_id))
  const courseIds = new Set(courses.map(c => c.course_id))

  const availableLearners = allLearners.filter(l =>
    !memberIds.has(l.id) &&
    (l.first_name + ' ' + l.last_name + ' ' + l.email).toLowerCase().includes(memberSearch.toLowerCase())
  )
  const availableCourses = allCourses.filter(c =>
    !courseIds.has(c.id) &&
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  async function addMember(learner: Learner) {
    setBusy(true)
    await fetch(`/api/teams/${team.id}/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: learner.id }),
    })
    setMembers(prev => [...prev, {
      team_id: team.id, user_id: learner.id, created_at: new Date().toISOString(),
      profiles: { first_name: learner.first_name, last_name: learner.last_name, email: learner.email },
    }])
    setMemberSearch('')
    setBusy(false)
    router.refresh()
  }

  async function removeMember(userId: string) {
    setBusy(true)
    await fetch(`/api/teams/${team.id}/members?user_id=${userId}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    setBusy(false)
  }

  async function addCourse(course: Course) {
    setBusy(true)
    await fetch(`/api/teams/${team.id}/courses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ course_id: course.id }),
    })
    setCourses(prev => [...prev, {
      team_id: team.id, course_id: course.id, created_at: new Date().toISOString(),
      courses: course,
    }])
    setCourseSearch('')
    setBusy(false)
    router.refresh()
  }

  async function removeCourse(courseId: number) {
    setBusy(true)
    await fetch(`/api/teams/${team.id}/courses?course_id=${courseId}`, { method: 'DELETE' })
    setCourses(prev => prev.filter(c => c.course_id !== courseId))
    setBusy(false)
  }

  const tabStyle = (t: Tab) => ({
    borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
    color: tab === t ? 'var(--accent)' : 'var(--text2)',
    paddingBottom: '10px',
    marginBottom: '-1px',
    fontWeight: tab === t ? 600 : 400,
    cursor: 'pointer',
    fontSize: '14px',
    background: 'transparent',
    border: 'none',
  } as React.CSSProperties)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <button style={tabStyle('members')} onClick={() => setTab('members')}>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Members ({members.length})
          </span>
        </button>
        <button style={tabStyle('courses')} onClick={() => setTab('courses')}>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Courses ({courses.length})
          </span>
        </button>
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          {/* Add member picker */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
              <Plus className="w-3 h-3 inline mr-1" />Add learner
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="input-theme w-full pl-8 pr-3 py-2 rounded-lg text-sm"
              />
            </div>
            {memberSearch && (
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {availableLearners.length === 0
                  ? <p className="px-3 py-2 text-sm" style={{ color: 'var(--text3)' }}>No learners found</p>
                  : availableLearners.slice(0, 6).map(l => (
                    <button key={l.id} onClick={() => addMember(l)} disabled={busy}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-left cursor-pointer transition-colors disabled:opacity-50"
                      style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>{l.first_name} {l.last_name}</span>
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>{l.email}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Current members */}
          {members.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text3)' }}>No members yet — add learners above.</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {members.map((m, i) => (
                <div key={m.user_id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)',
                    borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {m.profiles.first_name} {m.profiles.last_name}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text3)' }}>{m.profiles.email}</span>
                  </div>
                  <button onClick={() => removeMember(m.user_id)} disabled={busy}
                    className="p-1.5 rounded cursor-pointer transition-colors disabled:opacity-50"
                    style={{ color: 'var(--text3)' }}
                    title="Remove from team">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses tab */}
      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
              <Plus className="w-3 h-3 inline mr-1" />Add course — all current members will be enrolled automatically
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
              <input
                type="text"
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                placeholder="Search courses…"
                className="input-theme w-full pl-8 pr-3 py-2 rounded-lg text-sm"
              />
            </div>
            {courseSearch && (
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {availableCourses.length === 0
                  ? <p className="px-3 py-2 text-sm" style={{ color: 'var(--text3)' }}>No courses found</p>
                  : availableCourses.slice(0, 6).map(c => (
                    <button key={c.id} onClick={() => addCourse(c)} disabled={busy}
                      className="w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors disabled:opacity-50"
                      style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {c.title}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {courses.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text3)' }}>No courses assigned — search above to add one.</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {courses.map((tc, i) => (
                <div key={tc.course_id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)',
                    borderBottom: i < courses.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tc.courses.title}</span>
                  <button onClick={() => removeCourse(tc.course_id)} disabled={busy}
                    className="p-1.5 rounded cursor-pointer transition-colors disabled:opacity-50"
                    style={{ color: 'var(--text3)' }}
                    title="Remove from team">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
