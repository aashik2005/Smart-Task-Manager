import api from './api'
import {
  Task, TaskCreate, TaskUpdate, DashboardData, TaskFilters,
  CalendarTask, TaskReorderItem, Milestone,
} from '../types'

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.task_type) params.append('task_type', filters.task_type)
    const res = await api.get<Task[]>(`/tasks/?${params.toString()}`)
    return res.data
  },

  async getTask(id: number): Promise<Task> {
    const res = await api.get<Task>(`/tasks/${id}`)
    return res.data
  },

  async createTask(data: TaskCreate): Promise<Task> {
    const res = await api.post<Task>('/tasks/', data)
    return res.data
  },

  async updateTask(id: number, data: TaskUpdate): Promise<Task> {
    const res = await api.put<Task>(`/tasks/${id}`, data)
    return res.data
  },

  async markComplete(id: number): Promise<Task> {
    const res = await api.patch<Task>(`/tasks/${id}/complete`)
    return res.data
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await api.get<DashboardData>('/tasks/dashboard')
    return res.data
  },

  async getCalendarTasks(year: number, month: number): Promise<Record<string, CalendarTask[]>> {
    const res = await api.get<Record<string, CalendarTask[]>>(`/tasks/calendar?year=${year}&month=${month}`)
    return res.data
  },

  async reorderTasks(items: TaskReorderItem[]): Promise<void> {
    await api.post('/tasks/reorder', items)
  },

  async getMilestones(taskId: number): Promise<Milestone[]> {
    const res = await api.get<Milestone[]>(`/tasks/${taskId}/milestones`)
    return res.data
  },

  async createMilestone(taskId: number, data: { title: string; due_date?: string }): Promise<Milestone> {
    const res = await api.post<Milestone>(`/tasks/${taskId}/milestones`, data)
    return res.data
  },

  async updateMilestone(taskId: number, milestoneId: number, data: Partial<Milestone>): Promise<Milestone> {
    const res = await api.put<Milestone>(`/tasks/${taskId}/milestones/${milestoneId}`, data)
    return res.data
  },

  async deleteMilestone(taskId: number, milestoneId: number): Promise<void> {
    await api.delete(`/tasks/${taskId}/milestones/${milestoneId}`)
  },
}
