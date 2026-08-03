interface Props {
  type: 'error' | 'success' | 'info'
  message: string
  onClose?: () => void
}

const styles = {
  error: 'bg-red-50 border-red-400 text-red-800',
  success: 'bg-green-50 border-green-400 text-green-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

export default function Alert({ type, message, onClose }: Props) {
  return (
    <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${styles[type]}`}>
      <span className="flex-1 text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 font-bold leading-none">
          ×
        </button>
      )}
    </div>
  )
}
