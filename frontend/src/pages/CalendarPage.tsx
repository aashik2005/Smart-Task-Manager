import { useState, useEffect, useCallback } from 'react'
import { taskService } from '../services/taskService'
import { CalendarTask, Task, TaskCreate } from '../types'
import TaskModal from '../components/TaskModal'
import Spinner from '../components/Spinner'

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function priorityColor(task: CalendarTask): string {
  if (task.color_label) return task.color_label
  if (task.task_type === 'daily') return '#3b82f6'
  if (task.task_type === 'weekly') return '#8b5cf6'
  if (task.task_type === 'target') return '#f59e0b'
  if (task.priority === 'high') return '#ef4444'
  if (task.priority === 'medium') return '#f59e0b'
  return '#22c55e'
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [calData, setCalData] = useState<Record<string, CalendarTask[]>>({})
  const [loading, setLoading] = useState(true)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null)

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    try {
      setCalData(await taskService.getCalendarTasks(year, month))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { loadCalendar() }, [loadCalendar])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleSave(data: TaskCreate) {
    if (editTask) await taskService.updateTask(editTask.id, data)
    else await taskService.createTask(data)
    await loadCalendar()
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells: Array<{ date: string | null; day: number | null }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ date: null, day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, day: d })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-secondary px-3 py-1.5">‹</button>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[160px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary px-3 py-1.5">›</button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}
            className="btn-secondary text-sm px-3 py-1.5"
          >Today</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64"><Spinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Weekday header row */}
          <div className="grid grid-cols-7 border-b dark:border-gray-700">
            {WEEKDAY_HEADERS.map(h => (
              <div key={h} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                {h}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const tasks = cell.date ? (calData[cell.date] ?? []) : []
              const isToday = cell.date === todayStr
              const visible = tasks.slice(0, 3)
              const overflow = tasks.length - 3

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] p-1.5 border-b border-r dark:border-gray-700 ${
                    !cell.date ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-800'
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  {cell.day !== null && (
                    <>
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {cell.day}
                      </div>
                      <div className="space-y-0.5">
                        {visible.map(task => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            title={task.title}
                            className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80 ${task.is_completed_today ? 'opacity-50 line-through' : ''}`}
                            style={{ backgroundColor: priorityColor(task) + '33', color: priorityColor(task), borderLeft: `3px solid ${priorityColor(task)}` }}
                          >
                            {task.title}
                          </button>
                        ))}
                        {overflow > 0 && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 pl-1">+{overflow} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        {[
          { label: 'One-Time / High', color: '#ef4444' },
          { label: 'Daily', color: '#3b82f6' },
          { label: 'Weekly', color: '#8b5cf6' },
          { label: 'Target / Goal', color: '#f59e0b' },
          { label: 'Low priority', color: '#22c55e' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Task detail mini-popup */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{selectedTask.title}</h3>
            <div className="flex flex-wrap gap-2 text-xs mb-4">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">{selectedTask.priority}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">{selectedTask.task_type.replace('_', ' ')}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">{selectedTask.status.replace('_', ' ')}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editTask && (
        <TaskModal task={editTask} onSave={handleSave} onClose={() => setEditTask(null)} />
      )}
    </div>
  )
}
