import { DragEvent } from 'react'
import { Task, CATEGORY_COLORS, CATEGORY_LABELS } from '../types'

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onComplete: (id: number) => void
  draggable?: boolean
  onDragStart?: (id: number) => void
  onDragOver?: (e: DragEvent<HTMLDivElement>, id: number) => void
  onDrop?: (targetId: number) => void
}

const priorityBadge: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const statusBadge: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

const taskTypeBadge: Record<string, string> = {
  daily: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  weekly: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  target: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  one_time: '',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'completed') return false
  return new Date(task.due_date) < new Date()
}

export default function TaskCard({ task, onEdit, onDelete, onComplete, draggable, onDragStart, onDragOver, onDrop }: Props) {
  const overdue = isOverdue(task)
  const milestoneDone = task.milestones.filter((m) => m.completed).length
  const milestoneTotal = task.milestones.length
  const isRecurring = task.task_type === 'daily' || task.task_type === 'weekly'

  const leftBorderStyle = task.color_label
    ? { borderLeftColor: task.color_label, borderLeftWidth: 4 }
    : {}

  return (
    <div
      className={`card hover:shadow-md transition-shadow border-l-4 ${overdue ? 'border-l-red-400' : 'border-l-transparent'} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={task.color_label ? leftBorderStyle : {}}
      draggable={draggable}
      onDragStart={() => onDragStart?.(task.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e, task.id) }}
      onDrop={() => onDrop?.(task.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {/* Complete button */}
          {isRecurring ? (
            task.is_completed_today ? (
              <span title="Done today" className="p-1.5 text-green-500 text-lg">✓</span>
            ) : (
              <button
                onClick={() => onComplete(task.id)}
                title="Mark done today"
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >✓</button>
            )
          ) : task.status !== 'completed' ? (
            <button
              onClick={() => onComplete(task.id)}
              title="Mark complete"
              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            >✓</button>
          ) : null}
          <button onClick={() => onEdit(task)} title="Edit" className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">✎</button>
          <button onClick={() => onDelete(task.id)} title="Delete" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">✕</button>
        </div>
      </div>

      {/* Today's topic banner */}
      {task.today_topic && (
        <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
          <span className="text-indigo-500 text-sm">📌</span>
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Today: </span>
          <span className="text-xs text-indigo-800 dark:text-indigo-200 font-semibold">{task.today_topic}</span>
        </div>
      )}

      {/* Progress bar for target tasks */}
      {task.task_type === 'target' && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 items-center text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
        {task.task_type !== 'one_time' && (
          <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${taskTypeBadge[task.task_type]}`}>
            {task.task_type}
          </span>
        )}
        {task.category && (
          <span className={`px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category]}`}>
            {CATEGORY_LABELS[task.category]}
          </span>
        )}
        {task.due_date && task.task_type !== 'daily' && task.task_type !== 'weekly' && (
          <span className={`${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {overdue ? '⚠ ' : '📅 '}{formatDate(task.due_date)}
          </span>
        )}
        {task.task_type === 'weekly' && task.recurrence_days && (
          <span className="text-gray-500 dark:text-gray-400">
            📅 {task.recurrence_days.map(d => d.slice(0, 3)).join(', ')}
          </span>
        )}
        {task.task_type === 'daily' && task.reminder_time && (
          <span className="text-gray-500 dark:text-gray-400">🕐 {task.reminder_time}</span>
        )}
        {milestoneTotal > 0 && (
          <span className="text-gray-500 dark:text-gray-400">🎯 {milestoneDone}/{milestoneTotal}</span>
        )}
        {!task.is_active && (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Paused</span>
        )}
      </div>
    </div>
  )
}
