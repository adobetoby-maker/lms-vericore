'use client'

import { MapPin } from 'lucide-react'
import { clearTourSeen, startTour } from '@/lib/tour'

export default function TourReplayButton() {
  function handleClick() {
    clearTourSeen()
    startTour()
  }

  return (
    <button
      onClick={handleClick}
      data-tour="replay-tour"
      title="Replay tour"
      className="p-2 rounded-lg cursor-pointer transition-colors"
      style={{ color: 'var(--text3)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
    >
      <MapPin className="w-4 h-4" />
    </button>
  )
}
