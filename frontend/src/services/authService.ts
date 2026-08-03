import api from './api'
import { User, AuthResponse, LoginData, RegisterData } from '../types'

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data)
    return res.data
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', data)
    return res.data
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me')
    return res.data
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const res = await api.patch<User>('/auth/me', data)
    return res.data
  },
}
