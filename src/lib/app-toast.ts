export type ToastVariant = 'success' | 'error' | 'info' | 'loading'

export type AppToastItem = {
  id: string
  message: string
  variant: ToastVariant
  createdAt: number
}

type Listener = (items: AppToastItem[]) => void

let items: AppToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((fn) => fn([...items]))
}

function dismiss(id: string) {
  items = items.filter((t) => t.id !== id)
  emit()
}

function push(message: string, variant: ToastVariant, durationMs = 4200) {
  const id = crypto.randomUUID()
  items = [...items, { id, message, variant, createdAt: Date.now() }]
  emit()
  if (variant !== 'loading' && durationMs > 0) {
    window.setTimeout(() => dismiss(id), durationMs)
  }
  return id
}

export const appToast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error', 6000),
  info: (message: string) => push(message, 'info'),
  loading: (message: string) => push(message, 'loading', 0),
  dismiss,
  async run<T>(
    message: string,
    action: () => Promise<T>,
    options?: { success?: string; error?: string },
  ): Promise<T> {
    const loadingId = push(message, 'loading', 0)
    try {
      const result = await action()
      dismiss(loadingId)
      push(options?.success ?? 'Saved successfully', 'success')
      return result
    } catch (e) {
      dismiss(loadingId)
      push(options?.error ?? (e instanceof Error ? e.message : 'Something went wrong'), 'error', 6000)
      throw e
    }
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    listener([...items])
    return () => {
      listeners.delete(listener)
    }
  },
}
