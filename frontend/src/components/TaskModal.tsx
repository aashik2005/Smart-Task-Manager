import { useState, useEffect, FormEvent } from 'react'
import {
  Task, TaskCreate, Priority, Status, TaskType, Category, WeekDay,
  WEEKDAYS, WEEKDAY_LABELS, CATEGORY_LABELS, REMINDER_OFFSETS,
} from '../types'
import Spinner from './Spinner'
import { taskService } from '../services/taskService'

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
  task_type: 'one_time',
  category: null,
  color_label: null,
  due_date: null,
  start_date: null,
  target_date: null,
  recurrence_days: [],
  reminder_time: '',
  reminder_offset_minutes: 0,
  progress: 0,
  notes: '',
  is_active: true,
}

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toLocalDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function TaskModal({ task, onSave, onClose }: Props) {
  const [form, setForm] = useState<TaskCreate>(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Milestone state (for target tasks)
  const [milestones, setMilestones] = useState<Array<{ id?: number; title: string; completed: boolean }>>([])
  const [newMilestone, setNewMilestone] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        task_type: task.task_type,
        category: task.category,
        color_label: task.color_label,
        due_date: toLocalDatetime(task.due_date),
        start_date: toLocalDate(task.start_date),
        target_date: toLocalDate(task.target_date),
        recurrence_days: task.recurrence_days ?? [],
        reminder_time: task.reminder_time ?? '',
        reminder_offset_minutes: task.reminder_offset_minutes ?? 0,
        progress: task.progress,
        notes: task.notes ?? '',
        is_active: task.is_active,
      })
      setMilestones(task.milestones.map(m => ({ id: m.id, title: m.title, completed: m.completed })))
    } else {
      setForm(defaultForm)
      setMilestones([])
    }
    setErrors({})
    setApiError('')
  }, [task])

  // Reset type-specific fields when task_type changes
  useEffect(() => {
    setForm(prev => {
      if (prev.task_type === 'daily' || prev.task_type === 'weekly') {
        return { ...prev, due_date: null }
      }
      if (prev.task_type === 'one_time') {
        return { ...prev, recurrence_days: [], reminder_time: '', start_date: null, target_date: null }
      }
      if (prev.task_type === 'target') {
        return { ...prev, recurrence_days: [], reminder_time: '', due_date: null }
      }
      return prev
    })
  }, [form.task_type])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (form.task_type === 'weekly' && (!form.recurrence_days || form.recurrence_days.length === 0)) {
      errs.recurrence_days = 'Select at least one day'
    }
    if (form.task_type === 'target' && !form.target_date) {
      errs.target_date = 'Target date is required'
    }
    if ((form.task_type === 'daily' || form.task_type === 'weekly') && form.reminder_time) {
      if (!/^\d{2}:\d{2}$/.test(form.reminder_time)) errs.reminder_time = 'Use HH:MM format'
    }
    if (form.color_label && !/^#[0-9A-Fa-f]{6}$/.test(form.color_label)) {
      errs.color_label = 'Use hex format e.g. #FF5733'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function toggleDay(day: WeekDay) {
    const days = form.recurrence_days ?? []
    setForm({
      ...form,
      recurrence_days: days.includes(day) ? days.filter(d => d !== day) : [...days, day],
    })
  }

  async function addMilestone() {
    if (!newMilestone.trim()) return
    if (task?.id) {
      const m = await taskService.createMilestone(task.id, { title: newMilestone.trim() })
      setMilestones(prev => [...prev, { id: m.id, title: m.title, completed: m.completed }])
    } else {
      setMilestones(prev => [...prev, { title: newMilestone.trim(), completed: false }])
    }
    setNewMilestone('')
  }

  async function toggleMilestone(idx: number) {
    const m = milestones[idx]
    if (task?.id && m.id) {
      await taskService.updateMilestone(task.id, m.id, { completed: !m.completed })
    }
    setMilestones(prev => prev.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item))
  }

  async function removeMilestone(idx: number) {
    const m = milestones[idx]
    if (task?.id && m.id) {
      await taskService.deleteMilestone(task.id, m.id)
    }
    setMilestones(prev => prev.filter((_, i) => i !== idx))
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
        notes: form.notes?.trim() || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        start_date: form.start_date ? new Date(form.start_date + 'T00:00:00').toISOString() : null,
        target_date: form.target_date ? new Date(form.target_date + 'T23:59:00').toISOString() : null,
        recurrence_days: (form.recurrence_days && form.recurrence_days.length > 0) ? form.recurrence_days : null,
        reminder_time: form.reminder_time || null,
        color_label: form.color_label || null,
        category: form.category || null,
      }
      await onSave(payload)
      onClose()
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } })?.response?.data?.detail
      setApiError(typeof d === 'string' ? d : Array.isArray(d) ? d[0]?.msg : 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const tt = form.task_type

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {apiError && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">{apiError}</div>
          )}

          {/* Task Type */}
          <div>
            <label className="label">Task Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['one_time', 'daily', 'weekly', 'target'] as TaskType[]).map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm({ ...form, task_type: t })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.task_type === t
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {t === 'one_time' ? 'One-Time' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" maxLength={255} />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional..." />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Category + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category ?? ''} onChange={e => setForm({ ...form, category: (e.target.value as Category) || null })}>
                <option value="">None</option>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Color Label</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="h-9 w-14 rounded cursor-pointer border border-gray-300 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-800"
                  value={form.color_label ?? '#6366f1'}
                  onChange={e => setForm({ ...form, color_label: e.target.value })}
                />
                {form.color_label && (
                  <button type="button" onClick={() => setForm({ ...form, color_label: null })}
                    className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400">
                    Clear
                  </button>
                )}
              </div>
              {errors.color_label && <p className="error-text">{errors.color_label}</p>}
            </div>
          </div>

          {/* ── One-Time fields ── */}
          {tt === 'one_time' && (
            <>
              <div>
                <label className="label">Due Date</label>
                <input type="datetime-local" className="input" value={form.due_date ?? ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Remind Me</label>
                <select className="input" value={form.reminder_offset_minutes ?? 0} onChange={e => setForm({ ...form, reminder_offset_minutes: Number(e.target.value) })}>
                  {REMINDER_OFFSETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </>
          )}

          {/* ── Daily fields ── */}
          {tt === 'daily' && (
            <div>
              <label className="label">Reminder Time (daily)</label>
              <input type="time" className="input" value={form.reminder_time ?? ''} onChange={e => setForm({ ...form, reminder_time: e.target.value })} />
              {errors.reminder_time && <p className="error-text">{errors.reminder_time}</p>}
            </div>
          )}

          {/* ── Weekly fields ── */}
          {tt === 'weekly' && (
            <>
              <div>
                <label className="label">Repeat on <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day} type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        (form.recurrence_days ?? []).includes(day)
                          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                  ))}
                </div>
                {errors.recurrence_days && <p className="error-text">{errors.recurrence_days}</p>}
              </div>
              <div>
                <label className="label">Reminder Time</label>
                <input type="time" className="input" value={form.reminder_time ?? ''} onChange={e => setForm({ ...form, reminder_time: e.target.value })} />
              </div>
            </>
          )}

          {/* ── Target fields ── */}
          {tt === 'target' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.start_date ?? ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Target Date <span className="text-red-500">*</span></label>
                  <input type="date" className="input" value={form.target_date ?? ''} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                  {errors.target_date && <p className="error-text">{errors.target_date}</p>}
                </div>
              </div>
              <div>
                <label className="label">Progress ({form.progress}%)</label>
                <input type="range" min={0} max={100} step={5} className="w-full accent-indigo-600" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${form.progress}%` }} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes, links, etc." />
              </div>
              {/* Milestones (only when editing an existing task) */}
              {task && (
                <div>
                  <label className="label">Milestones</label>
                  <div className="space-y-1.5 mb-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="checkbox" checked={m.completed} onChange={() => toggleMilestone(i)} className="accent-indigo-600" />
                        <span className={`flex-1 text-sm ${m.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{m.title}</span>
                        <button type="button" onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" className="input flex-1 text-sm" placeholder="Add milestone..."
                      value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                    />
                    <button type="button" onClick={addMilestone} className="btn-secondary text-sm px-3">Add</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* is_active toggle for recurring */}
          {(tt === 'daily' || tt === 'weekly') && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Active</span>
            </label>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t dark:border-gray-700 flex gap-3 shrink-0">
          <button type="submit" form="" onClick={handleSubmit as unknown as React.MouseEventHandler} className="btn-primary flex items-center gap-2 flex-1 justify-center" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
