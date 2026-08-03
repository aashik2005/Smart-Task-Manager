import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { User } from '../types'
import Spinner from '../components/Spinner'

interface Props {
  onLogin: (token: string, user: User) => void
}

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone_number: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

export default function RegisterPage({ onLogin }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (form.phone_number && !/^\+?[0-9\s\-().]{7,20}$/.test(form.phone_number)) {
      errs.phone_number = 'Invalid phone number format'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const res = await authService.register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        phone_number: form.phone_number.trim() || undefined,
      })
      onLogin(res.access_token, res.user)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-2">Join Smart Task Manager today</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4 text-sm">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input type="text" className="input" {...field('name')} placeholder="John Doe" autoComplete="name" />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" className="input" {...field('email')} placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Password <span className="text-red-500">*</span></label>
            <input type="password" className="input" {...field('password')} placeholder="Min 6 characters" autoComplete="new-password" />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" className="input" {...field('confirmPassword')} placeholder="Repeat password" autoComplete="new-password" />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="label">Phone Number <span className="text-gray-400 font-normal">(optional — for WhatsApp reminders)</span></label>
            <input type="tel" className="input" {...field('phone_number')} placeholder="+1234567890" autoComplete="tel" />
            {errors.phone_number && <p className="error-text">{errors.phone_number}</p>}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
