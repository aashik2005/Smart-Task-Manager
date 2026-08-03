import { useState, FormEvent } from 'react'
import { authService } from '../services/authService'
import { User } from '../types'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

interface Props {
  user: User
  onUserUpdate: (user: User) => void
}

export default function SettingsPage({ user, onUserUpdate }: Props) {
  const [name, setName] = useState(user.name)
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? '')
  const [emailNotifications, setEmailNotifications] = useState(user.email_notifications)
  const [whatsappNotifications, setWhatsappNotifications] = useState(user.whatsapp_notifications)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name cannot be empty'); return }
    if (phoneNumber && !/^\+?[0-9\s\-().]{7,20}$/.test(phoneNumber)) {
      setError('Invalid phone number format (include country code for WhatsApp, e.g. +1234567890)')
      return
    }
    if (whatsappNotifications && !phoneNumber.trim()) {
      setError('A phone number is required for WhatsApp notifications')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const updated = await authService.updateMe({
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
        email_notifications: emailNotifications,
        whatsapp_notifications: whatsappNotifications,
      } as Partial<User>)
      onUserUpdate(updated)
      setSuccess('Settings saved successfully!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-50" value={user.email} disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Phone Number <span className="text-gray-400 font-normal">(for WhatsApp)</span></label>
              <input
                type="tel"
                className="input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
              />
              <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +1 for USA</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            Receive reminders 24 hours before and on the due date of your tasks.
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-1" />
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Email Reminders</span>
                <p className="text-xs text-gray-500">Receive reminders at {user.email}</p>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={whatsappNotifications}
                  onChange={(e) => setWhatsappNotifications(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-1" />
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">WhatsApp Reminders</span>
                <p className="text-xs text-gray-500">
                  {phoneNumber ? `Reminders to ${phoneNumber}` : 'Add a phone number above to enable'}
                </p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading && <Spinner size="sm" />}
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
