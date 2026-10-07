export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

let nextId = 1

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(message: string, tone: Toast['tone'] = 'info', ms = 4500) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, tone }]
    if (import.meta.client) setTimeout(() => dismiss(id), ms)
  }

  return { toasts, push, dismiss }
}
