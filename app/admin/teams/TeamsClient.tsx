'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ChevronRight, Users, BookOpen, Trash2, X } from 'lucide-react'
import { DEFAULT_DEPARTMENTS, type Team } from '@/lib/teams'

interface Props { teams: Team[] }

export default function TeamsClient({ teams: initial }: Props) {
  const router = useRouter()
  const [teams, setTeams] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    })
    if (!res.ok) { setError((await res.json()).error); setSaving(false); return }
    setName(''); setDescription(''); setShowCreate(false); setSaving(false)
    router.refresh()
    const refreshed = await fetch('/api/teams').then(r => r.json())
    setTeams(refreshed)
  }

  async function deleteTeam(id: number, teamName: string) {
    if (!confirm(`Delete "${teamName}"? This will not remove any enrollments.`)) return
    await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    setTeams(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      {/* Create button */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>New Team / Department</h2>
              <button onClick={() => setShowCreate(false)} className="cursor-pointer" style={{ color: 'var(--text3)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-pick from defaults */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>Quick pick</p>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setName(dept)}
                    className="px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors"
                    style={{
                      background: name === dept ? 'var(--accent)' : 'var(--bg3)',
                      color: name === dept ? 'var(--accent-fg)' : 'var(--text2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={createTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text2)' }}>Team name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Nursing, Administration…"
                  required
                  className="input-theme w-full px-3 py-2 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text2)' }}>Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="input-theme w-full px-3 py-2 rounded-lg text-sm"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
                  style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !name.trim()}
                  className="flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                  {saving ? 'Creating…' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>No teams yet</p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Create your first team to group learners and assign courses.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <div key={team.id} className="rounded-xl p-5 group relative"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{team.name}</h3>
                  {team.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{team.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteTeam(team.id, team.name)}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded cursor-pointer transition-opacity"
                  style={{ color: 'var(--text3)' }}
                  title="Delete team"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 mb-4">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text2)' }}>
                  <Users className="w-3.5 h-3.5" />
                  {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text2)' }}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {team.course_count} {team.course_count === 1 ? 'course' : 'courses'}
                </span>
              </div>

              <Link href={`/admin/teams/${team.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--accent)' }}>
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
