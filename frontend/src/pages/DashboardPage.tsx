import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { taskService } from '../services/taskService'
import { authService } from '../services/authService'
import { DashboardData, Task, TaskCreate, User } from '../types'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ConfirmDialog from '../components/ConfirmDialog'
import StreakCard from '../components/StreakCard'
import BadgesPanel from '../components/BadgesPanel'
import GoalProgressCard from '../components/GoalProgressCard'
import Spinner from '../components/Spinner'

interface Props {
  user: User | null
  onUserUpdate: (u: User) => void
}

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
  return `Good ${time}, ${name}! 👋`
}

export default function DashboardPage({ user, onUserUpdate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      const d = await taskService.getDashboard()
      setData(d)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSave(payload: TaskCreate) {
    if (editTask) {
      await taskService.updateTask(editTask.id, payload)
    } else {
      await taskService.createTask(payload)
    }
    await loadData()
    refreshUser()
  }

  async function handleComplete(id: number) {
    await taskService.markComplete(id)
    await loadData()
    refreshUser()
  }

  async function handleDelete() {
    if (deleteId !== null) {
      await taskService.deleteTask(deleteId)
      setDeleteId(null)
      await loadData()
    }
  }

  async function refreshUser() {
    try {
      const fresh = await authService.getMe()
      onUserUpdate(fresh)
    } catch { /* ignore */ }
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><Spinner size="lg" /></div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user ? greeting(user.name) : 'Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's your task overview for today.
          </p>
        </div>
        <Link to="/tasks" className="btn-primary hidden sm:block">+ New Task</Link>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">{error}</div>}

      {data && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Tasks" value={data.total} icon="📋" color="border-indigo-500" />
            <StatCard title="Pending" value={data.pending} icon="⏳" color="border-yellow-500" />
            <StatCard title="In Progress" value={data.in_progress} icon="🔄" color="border-blue-500" />
            <StatCard title="Completed" value={data.completed} icon="✅" color="border-green-500" />
            <StatCard title="Overdue" value={data.overdue} icon="⚠️" color="border-red-500" />
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Today's tasks + Overdue */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's tasks */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📅 Today's Tasks</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{data.today_tasks.length} tasks</span>
                </div>
                {data.today_tasks.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks scheduled for today.</p>
                ) : (
                  <div className="space-y-3">
                    {data.today_tasks.map(task => (
                      <TaskCard key={task.id} task={task} onEdit={setEditTask} onDelete={setDeleteId} onComplete={handleComplete} />
                    ))}
                  </div>
                )}
              </div>

              {/* Overdue tasks */}
              {data.overdue_tasks.length > 0 && (
                <div className="card border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">⚠ Overdue Tasks</h2>
                    <Link to="/tasks?status=pending" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
                  </div>
                  <div className="space-y-3">
                    {data.overdue_tasks.map(task => (
                      <TaskCard key={task.id} task={task} onEdit={setEditTask} onDelete={setDeleteId} onComplete={handleComplete} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent completions */}
              {data.recent_completions.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">✅ Recently Completed</h2>
                  <div className="space-y-2">
                    {data.recent_completions.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-1 border-b last:border-0 dark:border-gray-700">
                        <span className="text-green-500">✓</span>
                        <span className="line-through flex-1 truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Streak + Badges */}
            <div className="space-y-4">
              {user && (
                <StreakCard
                  currentStreak={data.current_streak}
                  longestStreak={data.longest_streak}
                  weeklyRate={data.weekly_completion_rate}
                />
              )}
              <BadgesPanel earnedBadges={data.badges} />
            </div>
          </div>

          {/* Goal tasks */}
          {data.goal_tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🎯 Your Goals</h2>
                <Link to="/tasks?task_type=target" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.goal_tasks.map(task => (
                  <GoalProgressCard key={task.id} task={task} onEdit={setEditTask} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editTask && (
        <TaskModal task={editTask} onSave={handleSave} onClose={() => setEditTask(null)} />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Delete this task? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
