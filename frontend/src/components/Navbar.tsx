import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User } from '../types'
import { useTheme } from '../hooks/useTheme'

interface Props {
  user: User | null
  onLogout: () => void
}

export default function Navbar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()

  function handleLogout() {
    onLogout()
    navigate('/login')
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  const linkCls = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-indigo-800 text-white dark:bg-indigo-900'
        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`

  return (
    <nav className="bg-indigo-600 dark:bg-gray-900 shadow-lg border-b border-indigo-700 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
              Smart Task Manager
            </Link>
            {user && (
              <div className="hidden sm:flex gap-1">
                <Link to="/" className={linkCls('/')}>Dashboard</Link>
                <Link to="/tasks" className={linkCls('/tasks')}>Tasks</Link>
                <Link to="/calendar" className={linkCls('/calendar')}>Calendar</Link>
                <Link to="/settings" className={linkCls('/settings')}>Settings</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-indigo-100 hover:bg-indigo-700 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <span className="text-indigo-200 text-sm hidden sm:block">Hi, {user.name}</span>
                {user.current_streak > 0 && (
                  <span className="text-sm hidden sm:block" title={`${user.current_streak}-day streak`}>
                    🔥 {user.current_streak}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="text-indigo-100 hover:text-white text-sm font-medium hover:bg-indigo-700 dark:hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-indigo-100 hover:text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors">Login</Link>
                <Link to="/register" className="bg-white text-indigo-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
