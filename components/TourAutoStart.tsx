'use client'

import { useEffect } from 'react'
import { maybeAutoStartTour } from '@/lib/tour'

export default function TourAutoStart() {
  useEffect(() => {
    maybeAutoStartTour()
  }, [])
  return null
}
