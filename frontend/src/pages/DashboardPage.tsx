import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { taskService } from '../services/taskService'
import { DashboardStats, Task, TaskCreate } from '../types'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      const [s, tasks] = await Promise.all([
        taskService.getDashboard(),
        taskService.getTasks(),
      ])
      setStats(s)
      setRecentTasks(tasks.slice(0, 5))
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSave(data: TaskCreate) {
    if (editTask) {
      await taskService.updateTask(editTask.id, data)
    } else {
      await taskService.createTask(data)
    }
    await loadData()
  }

  async function handleComplete(id: number) {
    await taskService.markComplete(id)
    await loadData()
  }

  async function handleDelete() {
    if (deleteId !== null) {
      await taskService.deleteTask(deleteId)
      setDeleteId(null)
      await loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your task overview at a glance</p>
        </div>
        <Link to="/tasks" className="btn-primary">View All Tasks</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-6 text-sm">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Tasks" value={stats.total} icon="📋" color="border-indigo-500" />
          <StatCard title="Pending" value={stats.pending} icon="⏳" color="border-yellow-500" />
          <StatCard title="In Progress" value={stats.in_progress} icon="🔄" color="border-blue-500" />
          <StatCard title="Completed" value={stats.completed} icon="✅" color="border-green-500" />
          <StatCard title="Overdue" value={stats.overdue} icon="⚠️" color="border-red-500" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
        <Link to="/tasks" className="text-indigo-600 text-sm font-medium hover:underline">View all →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No tasks yet!</p>
          <Link to="/tasks" className="btn-primary inline-block">Create your first task</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditTask}
              onDelete={setDeleteId}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {editTask && (
        <TaskModal task={editTask} onSave={handleSave} onClose={() => setEditTask(null)} />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
