import toast from 'react-hot-toast'

// Toast utility functions with consistent styling and messaging

export const showSuccess = (message: string, options?: { 
  duration?: number
  icon?: string 
}) => {
  return toast.success(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || '✅',
    style: {
      background: '#F0F9FF',
      color: '#1E40AF',
      border: '1px solid #3B82F6',
    },
  })
}

export const showError = (message: string, options?: { 
  duration?: number
  icon?: string 
}) => {
  return toast.error(message, {
    duration: options?.duration || 6000,
    icon: options?.icon || '❌',
    style: {
      background: '#FEF2F2',
      color: '#DC2626',
      border: '1px solid #EF4444',
    },
  })
}

export const showLoading = (message: string, options?: { 
  icon?: string 
}) => {
  return toast.loading(message, {
    icon: options?.icon || '⏳',
    style: {
      background: '#F9FAFB',
      color: '#374151',
      border: '1px solid #9CA3AF',
    },
  })
}

export const showInfo = (message: string, options?: { 
  duration?: number
  icon?: string 
}) => {
  return toast(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || 'ℹ️',
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
  return showLoading(`Transaction pending...`, { icon: '⛓️' })
}

export const showTransactionSuccess = (hash: string, action?: string) => {
  const message = action ? `${action} confirmed!` : 'Transaction confirmed!'
  return showSuccess(message, { icon: '⛓️' })
}

export const showTransactionError = (error: string) => {
  return showError(`Transaction failed: ${error}`, { icon: '⛓️' })
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