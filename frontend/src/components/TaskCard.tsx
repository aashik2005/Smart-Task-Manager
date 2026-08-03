import { Task } from '../types'

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onComplete: (id: number) => void
}

const priorityBadge: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const statusBadge: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'completed') return false
  return new Date(task.due_date) < new Date()
}

export default function TaskCard({ task, onEdit, onDelete, onComplete }: Props) {
  const overdue = isOverdue(task)

  return (
    <div className={`card hover:shadow-md transition-shadow ${overdue ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {task.status !== 'completed' && (
            <button
              onClick={() => onComplete(task.id)}
              title="Mark complete"
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            title="Edit"
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete"
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
        {task.due_date && (
          <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {overdue ? '⚠ Overdue · ' : '📅 '}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
