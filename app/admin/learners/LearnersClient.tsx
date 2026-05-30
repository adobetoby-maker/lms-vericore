'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Mail, CheckCircle2, Clock, XCircle, BookOpen, Send, Upload, Users, Loader2, Copy, Check, AlertCircle, ChevronDown } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

type Enrollment = {
  id: string
  status: string
  score: number | null
  completed_at: string | null
  created_at: string
  profiles: { id: string; first_name: string; last_name: string } | null
  courses: { id: string; title: string } | null
}

type Invite = {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string | null
  courses: { id: string; title: string } | null
}

type Course = {
  id: number
  title: string
}

interface Props {
  enrollments: Enrollment[]
  invites: Invite[]
  courses: Course[]
}

type Tab = 'invite' | 'enrollments' | 'invites'

export default function LearnersClient({ enrollments, invites, courses }: Props) {
  const [tab, setTab] = useState<Tab>('invite')
  const [search, setSearch] = useState('')
  const [resending, setResending] = useState<string | null>(null)
  const [resent, setResent] = useState<Set<string>>(new Set())

  // Invite state
  const [selectedCourseId, setSelectedCourseId] = useState<number>(courses[0]?.id ?? 0)
  const [singleEmail, setSingleEmail] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleResult, setSingleResult] = useState<{ url: string } | null>(null)
  const [singleError, setSingleError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Bulk CSV state
  const [bulkEmails, setBulkEmails] = useState<string[]>([])
  const [csvDragOver, setCsvDragOver] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<{ email: string; url: string }[]>([])
  const [bulkError, setBulkError] = useState<string | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // ── Single invite ────────────────────────────────────────────────
  async function handleSingleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!singleEmail.trim() || !selectedCourseId) return
    setSingleLoading(true); setSingleError(null); setSingleResult(null)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: singleEmail.trim(), courseId: selectedCourseId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setSingleError(data.error ?? 'Failed'); setSingleLoading(false); return }
    setSingleResult({ url: data.inviteUrl })
    setSingleEmail('')
    setSingleLoading(false)
  }

  // ── CSV parsing ──────────────────────────────────────────────────
  function parseEmails(text: string): string[] {
    return text.split(/[\n,;]+/).map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@') && e.includes('.'))
  }

  const handleFileDrop = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const emails = parseEmails(ev.target?.result as string)
      setBulkEmails(emails)
      setBulkResults([]); setBulkError(null)
    }
    reader.readAsText(file)
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setCsvDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileDrop(file)
  }

  // ── Bulk send ────────────────────────────────────────────────────
  async function handleBulkSend() {
    if (!bulkEmails.length || !selectedCourseId) return
    setBulkLoading(true); setBulkError(null); setBulkResults([])
    const results: { email: string; url: string }[] = []
    for (const email of bulkEmails) {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, courseId: selectedCourseId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) results.push({ email, url: data.inviteUrl })
    }
    setBulkResults(results); setBulkLoading(false)
    if (results.length < bulkEmails.length) setBulkError(`${bulkEmails.length - results.length} failed.`)
  }

  async function resendInvite(inviteId: string) {
    setResending(inviteId)
    await fetch('/api/resend-invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    setResent(prev => new Set([...prev, inviteId])); setResending(null)
  }

  const filteredEnrollments = enrollments.filter(e => {
    const name = `${e.profiles?.first_name ?? ''} ${e.profiles?.last_name ?? ''}`.toLowerCase()
    const course = (e.courses?.title ?? '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || course.includes(q)
  })

  const filteredInvites = invites.filter(i => {
    const q = search.toLowerCase()
    return i.email.toLowerCase().includes(q) || (i.courses?.title ?? '').toLowerCase().includes(q)
  })

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'invite',      label: 'Send Invites' },
    { id: 'enrollments', label: 'Enrollments', count: enrollments.length },
    { id: 'invites',     label: 'Sent Invites', count: invites.length },
  ]

  return (
    <div>
      {/* Tab bar + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1 border border-[#2a2a4a]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-[#2a2a4a]'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab !== 'invite' && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search learner or course…"
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
          </div>
        )}
      </div>

      {/* ── INVITE TAB ── */}
      {tab === 'invite' && (
        <div className="space-y-5">
          {/* Course selector */}
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Course</label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(Number(e.target.value))}
                className="w-full bg-[#0a0a18] border border-[#2a2a4a] rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer">
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Single invite */}
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" /> Invite Single Learner
            </h3>
            <p className="text-xs text-slate-500 mb-4">Sends an email invite and generates a registration link.</p>

            {singleError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 mb-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{singleError}</p>
              </div>
            )}

            <form onSubmit={handleSingleInvite} className="flex gap-2">
              <input type="email" required value={singleEmail} onChange={e => setSingleEmail(e.target.value)}
                placeholder="learner@company.com"
                className="flex-1 bg-[#0a0a18] border border-[#2a2a4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500" />
              <button type="submit" disabled={singleLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                {singleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {singleLoading ? 'Sending…' : 'Send'}
              </button>
            </form>

            {singleResult && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 text-xs font-mono flex-1 truncate">{singleResult.url}</span>
                <button onClick={() => { navigator.clipboard.writeText(singleResult.url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="shrink-0 cursor-pointer">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Bulk CSV */}
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Bulk Invite via CSV
            </h3>
            <p className="text-xs text-slate-500 mb-4">Drop a CSV file or paste emails. One per line, or comma-separated.</p>

            <div
              onDragOver={e => { e.preventDefault(); setCsvDragOver(true) }}
              onDragLeave={() => setCsvDragOver(false)}
              onDrop={onDrop}
              onClick={() => csvInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                csvDragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#2a2a4a] hover:border-indigo-500/50'
              }`}>
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Drop CSV here or click to browse</p>
              <p className="text-xs text-slate-600 mt-1">Emails in any column · comma or newline separated</p>
              <input ref={csvInputRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f) }} />
            </div>

            {bulkEmails.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-white font-medium">{bulkEmails.length} email{bulkEmails.length !== 1 ? 's' : ''} loaded</span>
                  </div>
                  <button onClick={() => { setBulkEmails([]); setBulkResults([]); setBulkError(null) }}
                    className="text-xs text-slate-500 hover:text-white cursor-pointer">Clear</button>
                </div>

                <div className="bg-[#0a0a18] rounded-lg p-3 max-h-32 overflow-y-auto">
                  {bulkEmails.map((email, i) => (
                    <div key={i} className="text-xs text-slate-400 py-0.5">{email}</div>
                  ))}
                </div>

                <button onClick={handleBulkSend} disabled={bulkLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {bulkLoading ? `Sending…` : `Send ${bulkEmails.length} Invite${bulkEmails.length !== 1 ? 's' : ''}`}
                </button>

                {bulkError && <p className="text-sm text-amber-400">{bulkError}</p>}

                {bulkResults.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 text-sm font-semibold mb-2">
                      <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                      {bulkResults.length} invite{bulkResults.length !== 1 ? 's' : ''} sent
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {bulkResults.map(r => (
                        <div key={r.email} className="text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {r.email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENROLLMENTS TABLE ── */}
      {tab === 'enrollments' && (
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a4a]">
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide">Learner</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide hidden md:table-cell">Course</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide hidden sm:table-cell">Score</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]/50">
              {filteredEnrollments.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-sm">No enrollments found.</td></tr>
              ) : filteredEnrollments.map(e => (
                <tr key={e.id} className="hover:bg-[#252545] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name}`.trim() || '—' : '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {e.courses ? (
                      <Link href={`/admin/courses/${e.courses.id}`} className="text-indigo-400 hover:underline flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />{e.courses.title}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={e.status as 'invited' | 'in_progress' | 'passed' | 'failed'} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-slate-300">
                    {e.score !== null ? `${e.score}%` : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {e.courses && (
                      <Link href={`/admin/courses/${e.courses.id}`} className="text-xs text-slate-500 hover:text-white">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── INVITES TABLE ── */}
      {tab === 'invites' && (
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a4a]">
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide hidden md:table-cell">Course</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-medium uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]/50">
              {filteredInvites.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-sm">No invites found.</td></tr>
              ) : filteredInvites.map(i => (
                <tr key={i.id} className="hover:bg-[#252545] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-white">{i.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {i.courses ? (
                      <Link href={`/admin/courses/${i.courses.id}`} className="text-indigo-400 hover:underline flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />{i.courses.title}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      i.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                      i.status === 'pending'  ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {i.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> :
                       i.status === 'pending'  ? <Clock className="w-3 h-3" /> :
                       <XCircle className="w-3 h-3" />}
                      {i.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {i.status === 'pending' && (
                      <button onClick={() => resendInvite(i.id)} disabled={!!resending || resent.has(i.id)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors cursor-pointer disabled:opacity-50">
                        <Send className="w-3 h-3" />
                        {resent.has(i.id) ? 'Sent ✓' : resending === i.id ? 'Sending…' : 'Resend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
