import api from './api'
import { Task, TaskCreate, TaskUpdate, DashboardStats, TaskFilters } from '../types'

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
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

  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/tasks/dashboard')
    return res.data
  },
}
