export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'in_progress' | 'completed'
export type TaskType = 'one_time' | 'daily' | 'weekly' | 'target'
export type Category = 'study' | 'work' | 'personal' | 'health' | 'others'
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const WEEKDAYS: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
export const CATEGORY_LABELS: Record<Category, string> = {
  study: 'Study', work: 'Work', personal: 'Personal', health: 'Health', others: 'Others',
}
export const CATEGORY_COLORS: Record<Category, string> = {
  study: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  work: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  personal: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  others: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

export const REMINDER_OFFSETS = [
  { label: 'At due time', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '3 hours before', value: 180 },
  { label: '1 day before', value: 1440 },
]

export const BADGE_DEFS: Record<string, { label: string; icon: string; desc: string }> = {
  first_task:           { label: 'First Step',           icon: '🎯', desc: 'Completed your first task' },
  streak_7:             { label: 'Week Warrior',          icon: '🔥', desc: 'Achieved a 7-day streak' },
  tasks_30:             { label: 'Productive',            icon: '⚡', desc: 'Completed 30 tasks' },
  tasks_100:            { label: 'Century Club',          icon: '💯', desc: 'Completed 100 tasks' },
  consistency_champion: { label: 'Consistency Champion',  icon: '🏆', desc: 'Achieved a 30-day streak' },
  goal_achiever:        { label: 'Goal Achiever',         icon: '🎖️', desc: 'Completed a goal task' },
}

export interface Milestone {
  id: number
  task_id: number
  title: string
  completed: boolean
  due_date: string | null
  sort_order: number
}

export interface User {
  id: number
  name: string
  email: string
  phone_number: string | null
  email_notifications: boolean
  whatsapp_notifications: boolean
  current_streak: number
  longest_streak: number
  total_completed: number
  badges: string[]
  last_activity_date: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone_number?: string
}

export interface Task {
  id: number
  user_id: number
  title: string
  description: string | null
  priority: Priority
  status: Status
  task_type: TaskType
  category: Category | null
  color_label: string | null
  due_date: string | null
  start_date: string | null
  target_date: string | null
  recurrence_days: WeekDay[] | null
  reminder_time: string | null
  reminder_offset_minutes: number | null
  progress: number
  notes: string | null
  is_active: boolean
  sort_order: number
  milestones: Milestone[]
  is_completed_today: boolean
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  priority: Priority
  status: Status
  task_type: TaskType
  category?: Category | null
  color_label?: string | null
  due_date?: string | null
  start_date?: string | null
  target_date?: string | null
  recurrence_days?: WeekDay[] | null
  reminder_time?: string | null
  reminder_offset_minutes?: number
  progress?: number
  notes?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface TaskUpdate extends Partial<TaskCreate> {}

export interface DashboardData {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
  current_streak: number
  longest_streak: number
  total_completed: number
  weekly_completion_rate: number
  today_tasks: Task[]
  overdue_tasks: Task[]
  goal_tasks: Task[]
  recent_completions: Task[]
  badges: string[]
}

export interface CalendarTask {
  id: number
  title: string
  task_type: TaskType
  color_label: string | null
  status: Status
  priority: Priority
  due_date: string | null
  recurrence_days: WeekDay[] | null
  is_completed_today: boolean
}

export interface TaskFilters {
  search?: string
  status?: Status | ''
  priority?: Priority | ''
  category?: Category | ''
  task_type?: TaskType | ''
}

export interface TaskReorderItem {
  id: number
  sort_order: number
}
