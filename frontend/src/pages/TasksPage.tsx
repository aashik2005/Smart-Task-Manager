import { useState, useEffect, useCallback } from 'react'
import { taskService } from '../services/taskService'
import { Task, TaskCreate, TaskFilters, Priority, Status } from '../types'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [filters, setFilters] = useState<TaskFilters>({ search: '', status: '', priority: '' })
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const loadTasks = useCallback(async (f: TaskFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await taskService.getTasks(f)
      setTasks(data)
    } catch {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks(filters) }, [filters, loadTasks])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  function openCreate() {
    setEditTask(null)
    setShowModal(true)
  }

  function openEdit(task: Task) {
    setEditTask(task)
    setShowModal(true)
  }

  async function handleSave(data: TaskCreate) {
    setActionLoading(true)
    try {
      if (editTask) {
        await taskService.updateTask(editTask.id, data)
        setSuccessMsg('Task updated successfully')
      } else {
        await taskService.createTask(data)
        setSuccessMsg('Task created successfully')
      }
      await loadTasks(filters)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleComplete(id: number) {
    setActionLoading(true)
    try {
      await taskService.markComplete(id)
      setSuccessMsg('Task marked as complete')
      await loadTasks(filters)
    } catch {
      setError('Failed to update task')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    setActionLoading(true)
    try {
      await taskService.deleteTask(deleteId)
      setDeleteId(null)
      setSuccessMsg('Task deleted')
      await loadTasks(filters)
    } catch {
      setError('Failed to delete task')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Task</button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && (
        <div className="mb-4">
          <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input sm:w-40"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Status | '' }))}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="input sm:w-40"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as Priority | '' }))}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {(filters.search || filters.status || filters.priority) && (
          <button
            className="btn-secondary whitespace-nowrap"
            onClick={() => { setSearch(''); setFilters({ search: '', status: '', priority: '' }) }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No tasks found</p>
          <p className="text-gray-400 text-sm mb-6">
            {filters.search || filters.status || filters.priority
              ? 'Try adjusting your filters'
              : 'Get started by creating your first task'}
          </p>
          {!filters.search && !filters.status && !filters.priority && (
            <button onClick={openCreate} className="btn-primary">Create Task</button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTask(null) }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {actionLoading && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Spinner size="sm" />
          Saving...
        </div>
      )}
    </div>
  )
}
