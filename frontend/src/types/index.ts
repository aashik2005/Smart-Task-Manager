export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'in_progress' | 'completed'

export interface User {
  id: number
  name: string
  email: string
  phone_number: string | null
  email_notifications: boolean
  whatsapp_notifications: boolean
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
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  priority: Priority
  status: Status
  due_date?: string
}

export interface TaskUpdate {
  title?: string
  description?: string
  priority?: Priority
  status?: Status
  due_date?: string | null
}

export interface DashboardStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
}

export interface TaskFilters {
  search?: string
  status?: Status | ''
  priority?: Priority | ''
}
