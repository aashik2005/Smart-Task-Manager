import { useState, useEffect, useCallback, useRef, DragEvent } from 'react'
import { taskService } from '../services/taskService'
import { Task, TaskCreate, TaskFilters, Priority, Status, Category, TaskType } from '../types'
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

  const [filters, setFilters] = useState<TaskFilters>({ search: '', status: '', priority: '', category: '', task_type: '' })
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const draggedId = useRef<number | null>(null)
  const hasFilters = !!(filters.search || filters.status || filters.priority || filters.category || filters.task_type)

  const loadTasks = useCallback(async (f: TaskFilters) => {
    setLoading(true)
    setError('')
    try {
      setTasks(await taskService.getTasks(f))
    } catch {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks(filters) }, [filters, loadTasks])

  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, search })), 400)
    return () => clearTimeout(t)
  }, [search])

  function openCreate() { setEditTask(null); setShowModal(true) }
  function openEdit(task: Task) { setEditTask(task); setShowModal(true) }

  async function handleSave(data: TaskCreate) {
    setActionLoading(true)
    try {
      if (editTask) {
        await taskService.updateTask(editTask.id, data)
        setSuccessMsg('Task updated')
      } else {
        await taskService.createTask(data)
        setSuccessMsg('Task created')
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
      await loadTasks(filters)
    } catch { setError('Failed to update task') }
    finally { setActionLoading(false) }
  }

  async function handleDelete() {
    if (deleteId === null) return
    setActionLoading(true)
    try {
      await taskService.deleteTask(deleteId)
      setDeleteId(null)
      setSuccessMsg('Task deleted')
      await loadTasks(filters)
    } catch { setError('Failed to delete task') }
    finally { setActionLoading(false) }
  }

  // Drag-and-drop reorder
  function handleDragStart(id: number) {
    if (hasFilters) return
    draggedId.current = id
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, _id: number) {
    e.preventDefault()
  }

  async function handleDrop(targetId: number) {
    if (draggedId.current === null || draggedId.current === targetId || hasFilters) return
    const fromIdx = tasks.findIndex(t => t.id === draggedId.current)
    const toIdx = tasks.findIndex(t => t.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...tasks]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const withOrder = reordered.map((t, i) => ({ ...t, sort_order: i + 1 }))
    setTasks(withOrder) // optimistic

    try {
      await taskService.reorderTasks(withOrder.map(t => ({ id: t.id, sort_order: t.sort_order })))
    } catch {
      setError('Failed to save order')
      await loadTasks(filters)
    }
    draggedId.current = null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Task</button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
      {successMsg && <div className="mb-4"><Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} /></div>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <input
          type="text" className="input flex-1 min-w-0" placeholder="Search tasks..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="input sm:w-36" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as Status | '' }))}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="input sm:w-36" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value as Priority | '' }))}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className="input sm:w-36" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value as Category | '' }))}>
          <option value="">All Categories</option>
          <option value="study">Study</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
          <option value="others">Others</option>
        </select>
        <select className="input sm:w-36" value={filters.task_type} onChange={e => setFilters(f => ({ ...f, task_type: e.target.value as TaskType | '' }))}>
          <option value="">All Types</option>
          <option value="one_time">One-Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="target">Target</option>
        </select>
        {hasFilters && (
          <button className="btn-secondary whitespace-nowrap" onClick={() => { setSearch(''); setFilters({ search: '', status: '', priority: '', category: '', task_type: '' }) }}>
            Clear filters
          </button>
        )}
      </div>

      {!hasFilters && tasks.length > 1 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Drag tasks to reorder them.</p>
      )}
      {hasFilters && tasks.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Clear filters to enable drag-and-drop reordering.</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-48"><Spinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-lg mb-2">No tasks found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
            {hasFilters ? 'Try adjusting your filters' : 'Get started by creating your first task'}
          </p>
          {!hasFilters && <button onClick={openCreate} className="btn-primary">Create Task</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onComplete={handleComplete}
              draggable={!hasFilters}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTask(null) }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Delete this task? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {actionLoading && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Spinner size="sm" /> Saving...
        </div>
      )}
    </div>
  )
}
