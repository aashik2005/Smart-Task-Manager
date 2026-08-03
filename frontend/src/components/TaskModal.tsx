import { useState, useEffect, FormEvent } from 'react'
import { Task, TaskCreate, Priority, Status } from '../types'
import Spinner from './Spinner'

interface Props {
  task?: Task | null
  onSave: (data: TaskCreate) => Promise<void>
  onClose: () => void
}

const defaultForm: TaskCreate = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  due_date: '',
}

function toLocalDatetime(isoStr: string | null | undefined): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TaskModal({ task, onSave, onClose }: Props) {
  const [form, setForm] = useState<TaskCreate>(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<keyof TaskCreate, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        due_date: toLocalDatetime(task.due_date),
      })
    } else {
      setForm(defaultForm)
    }
    setErrors({})
    setApiError('')
  }, [task])

  function validate(): boolean {
    const errs: Partial<Record<keyof TaskCreate, string>> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (form.title.trim().length > 255) errs.title = 'Title too long (max 255)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const payload: TaskCreate = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      }
      await onSave(payload)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg || 'Failed to save task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{apiError}</div>}

          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
              maxLength={255}
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="datetime-local"
              className="input"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2 flex-1 justify-center" disabled={loading}>
              {loading && <Spinner size="sm" />}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
