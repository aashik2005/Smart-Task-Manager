import { Task } from '../types'

interface Props {
  task: Task
  onEdit: (task: Task) => void
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function GoalProgressCard({ task, onEdit }: Props) {
  const total = task.milestones.length
  const done = task.milestones.filter((m) => m.completed).length
  const progress = task.progress

  const barColor =
    progress >= 80 ? 'bg-green-500' :
    progress >= 40 ? 'bg-indigo-500' :
    'bg-orange-400'

  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(task)}
      style={task.color_label ? { borderTopColor: task.color_label, borderTopWidth: 3 } : {}}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight flex-1 pr-2">
          {task.title}
        </h4>
        <span className="text-lg font-bold text-gray-700 dark:text-gray-300 shrink-0">{progress}%</span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="mb-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>🎯 Target: {formatDate(task.target_date)}</span>
        {total > 0 && (
          <span>
            {done}/{total} milestones
          </span>
        )}
      </div>
    </div>
  )
}
