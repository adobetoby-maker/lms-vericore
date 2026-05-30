'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Video, HelpCircle, Users, Pencil, Trash2, Loader2 } from 'lucide-react'

interface Course {
  id: number
  title: string
  description: string
  is_active: boolean
  created_at: string
  videoCount: number
  questionCount: number
  enrollCount: number
}

interface Props {
  courses: Course[]
}

export default function CourseTable({ courses }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deletingMulti, setDeletingMulti] = useState(false)
  const [, startTransition] = useTransition()

  const allSelected = courses.length > 0 && selected.size === courses.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(courses.map(c => c.id)))
  }

  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function deleteCourse(id: number) {
    if (!confirm(`Delete "${courses.find(c => c.id === id)?.title}"? This cannot be undone.`)) return
    setDeleting(id)
    await fetch(`/api/courses/${id}`, { method: 'DELETE' })
    setDeleting(null)
    startTransition(() => router.refresh())
  }

  async function deleteSelected() {
    if (!selected.size) return
    const names = courses.filter(c => selected.has(c.id)).map(c => c.title).join(', ')
    if (!confirm(`Delete ${selected.size} course${selected.size > 1 ? 's' : ''}?\n\n${names}\n\nThis cannot be undone.`)) return
    setDeletingMulti(true)
    await Promise.all([...selected].map(id => fetch(`/api/courses/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    setDeletingMulti(false)
    startTransition(() => router.refresh())
  }

  return (
    <div>
      {/* Multi-delete toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-3">
          <span className="text-sm text-red-300 font-medium">
            {selected.size} course{selected.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={deleteSelected}
            disabled={deletingMulti}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {deletingMulti
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            {deletingMulti ? 'Deleting…' : `Delete ${selected.size}`}
          </button>
        </div>
      )}

      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a4a]">
              <th className="pl-5 pr-2 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-slate-600 bg-[#0a0a18] text-indigo-500 cursor-pointer"
                />
              </th>
              <th className="text-left px-3 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Course</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Videos</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Questions</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Enrolled</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a4a]">
            {courses.map(course => (
              <tr
                key={course.id}
                className={`transition-colors ${selected.has(course.id) ? 'bg-indigo-600/5' : 'hover:bg-[#252545]'}`}
              >
                <td className="pl-5 pr-2 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(course.id)}
                    onChange={() => toggleOne(course.id)}
                    className="rounded border-slate-600 bg-[#0a0a18] text-indigo-500 cursor-pointer"
                  />
                </td>

                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{course.title}</p>
                      <p className="text-slate-500 text-xs truncate max-w-xs">{course.description}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-center hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 text-sm">
                    <Video className="w-3.5 h-3.5 text-slate-500" />
                    {course.videoCount}
                  </div>
                </td>

                <td className="px-4 py-4 text-center hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 text-sm">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    {course.questionCount}
                  </div>
                </td>

                <td className="px-4 py-4 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 text-sm">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {course.enrollCount}
                  </div>
                </td>

                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    course.is_active
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      disabled={deleting === course.id}
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleting === course.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                      {deleting === course.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
