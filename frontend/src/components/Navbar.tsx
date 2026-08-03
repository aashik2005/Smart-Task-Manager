import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User } from '../types'

interface Props {
  user: User | null
  onLogout: () => void
}

export default function Navbar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    onLogout()
    navigate('/login')
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-white font-bold text-xl tracking-tight">
              Smart Task Manager
            </Link>
            {user && (
              <div className="hidden sm:flex gap-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/') ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tasks') ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  Tasks
                </Link>
                <Link
                  to="/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/settings') ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-indigo-100 text-sm hidden sm:block">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-indigo-100 hover:text-white text-sm font-medium hover:bg-indigo-700 px-3 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="text-indigo-100 hover:text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-white text-indigo-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
