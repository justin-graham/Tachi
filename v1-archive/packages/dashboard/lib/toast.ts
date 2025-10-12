import toast from 'react-hot-toast'

// Toast utility functions with consistent styling and messaging

type BaseToastOptions = {
  duration?: number
  icon?: string
  id?: string
}

export const showSuccess = (message: string, options?: BaseToastOptions) => {
  return toast.success(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || '✅',
    id: options?.id,
    style: {
      background: '#F0F9FF',
      color: '#1E40AF',
      border: '1px solid #3B82F6',
    },
  })
}

export const showError = (message: string, options?: BaseToastOptions) => {
  return toast.error(message, {
    duration: options?.duration || 6000,
    icon: options?.icon || '❌',
    id: options?.id,
    style: {
      background: '#FEF2F2',
      color: '#DC2626',
      border: '1px solid #EF4444',
    },
  })
}

export const showLoading = (message: string, options?: { icon?: string; id?: string }) => {
  return toast.loading(message, {
    icon: options?.icon || '⏳',
    id: options?.id,
    style: {
      background: '#F9FAFB',
      color: '#374151',
      border: '1px solid #9CA3AF',
    },
  })
}

export const showInfo = (message: string, options?: BaseToastOptions) => {
  return toast(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || 'ℹ️',
    id: options?.id,
    style: {
      background: '#FFFBEB',
      color: '#D97706',
      border: '1px solid #F59E0B',
    },
  })
}

// Specialized toast functions for common use cases

export const showWalletSuccess = (action: string) => {
  return showSuccess(`${action} successful!`, { icon: '🔗' })
}

export const showWalletError = (action: string, error?: string) => {
  const message = error ? `${action} failed: ${error}` : `${action} failed`
  return showError(message, { icon: '🔗' })
}

export const showTransactionPending = (hash: string) => {
  return showLoading('Transaction pending...', { icon: '⛓️', id: hash })
}

export const showTransactionSuccess = (hash: string, action?: string) => {
  const message = action ? `${action} confirmed!` : 'Transaction confirmed!'
  return showSuccess(message, { icon: '⛓️', id: hash })
}

export const showTransactionError = (error: string, hash?: string) => {
  return showError(`Transaction failed: ${error}`, { icon: '⛓️', id: hash })
}

export const showNetworkSwitch = (networkName: string) => {
  return showInfo(`Switching to ${networkName}...`, { icon: '🌐' })
}

export const showNetworkSwitched = (networkName: string) => {
  return showSuccess(`Switched to ${networkName}`, { icon: '🌐' })
}

// API-related toasts

export const showApiSuccess = (action: string) => {
  return showSuccess(`${action} completed successfully`)
}

export const showApiError = (action: string, error?: string) => {
  const message = error ? `${action} failed: ${error}` : `${action} failed`
  return showError(message)
}

export const showApiLoading = (action: string) => {
  return showLoading(`${action}...`)
}

// Utility function to dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss()
}

// Utility function to dismiss a specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId)
}

// Promise-based toast for async operations
export const toastPromise = <T>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string
    success: string | ((value: T) => string)
    error: string | ((error: any) => string)
  }
) => {
  return toast.promise(promise, {
    loading,
    success,
    error,
    style: {
      minWidth: '250px',
    },
  })
}
