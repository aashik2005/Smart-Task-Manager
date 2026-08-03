import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import SettingsPage from './pages/SettingsPage'
import CalendarPage from './pages/CalendarPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { user, isAuthenticated, login, logout, updateUser } = useAuth()
  useTheme() // init dark mode class on <html> from root

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage onLogin={login} />} />
            <Route path="/" element={<PrivateRoute><DashboardPage user={user} onUserUpdate={updateUser} /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
            <Route path="/settings" element={
              <PrivateRoute>
                {user ? <SettingsPage user={user} onUserUpdate={updateUser} /> : <Navigate to="/" replace />}
              </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
