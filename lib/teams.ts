export const DEFAULT_DEPARTMENTS = [
  'Administration',
  'Billing & Coding',
  'Clinical Staff',
  'Compliance',
  'Front Desk',
  'HR',
  'Housekeeping',
  'IT',
  'Management',
  'Medical Assistants',
  'Nursing',
  'Pharmacy',
  'Physical Therapy',
  'Security',
  'Social Work',
  'Surgery',
] as const

export interface Team {
  id: number
  name: string
  description: string | null
  created_at: string
  member_count?: number
  course_count?: number
}

export interface TeamMember {
  team_id: number
  user_id: string
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    email?: string
  }
}

export interface TeamCourse {
  team_id: number
  course_id: number
  created_at: string
  courses?: {
    id: number
    title: string
    is_active: boolean
  }
}
