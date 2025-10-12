import { useState, useCallback } from 'react'

export interface OptimisticState<T> {
  data: T
  isOptimistic: boolean
  isPending: boolean
  error: Error | null
}

export interface OptimisticOptions<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
  rollbackDelay?: number
}

/**
 * Hook for optimistic UI updates
 * Immediately shows the update, then confirms with server
 * Rolls back on error
 */
export function useOptimistic<T>(
  initialData: T,
  options: OptimisticOptions<T> = {}
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    isPending: false,
    error: null,
  })

  const update = useCallback(
    async (
      optimisticData: T,
      serverUpdate: () => Promise<T>
    ): Promise<boolean> => {
      // Store original data for rollback
      const originalData = state.data

      // Immediately apply optimistic update
      setState({
        data: optimisticData,
        isOptimistic: true,
        isPending: true,
        error: null,
      })

      try {
        // Perform server update
        const result = await serverUpdate()

        // Success - confirm optimistic update with server data
        setState({
          data: result,
          isOptimistic: false,
          isPending: false,
          error: null,
        })

        options.onSuccess?.(result)
        return true
      } catch (error) {
        // Error - rollback to original data
        const err = error as Error

        setState({
          data: originalData,
          isOptimistic: false,
          isPending: false,
          error: err,
        })

        options.onError?.(err)
        return false
      }
    },
    [state.data, options]
  )

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      isPending: false,
      error: null,
    })
  }, [initialData])

  return {
    ...state,
    update,
    reset,
  }
}

/**
 * Hook for optimistic list updates (add/remove/update items)
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  options: OptimisticOptions<T[]> = {}
) {
  const optimistic = useOptimistic<T[]>(initialItems, options)

  const addItem = useCallback(
    async (item: T, serverAdd: () => Promise<T>): Promise<boolean> => {
      return optimistic.update(
        [...optimistic.data, item],
        async () => {
          const newItem = await serverAdd()
          return [...optimistic.data.filter(i => i.id !== item.id), newItem]
        }
      )
    },
    [optimistic]
  )

  const removeItem = useCallback(
    async (id: string, serverRemove: () => Promise<void>): Promise<boolean> => {
      const itemToRemove = optimistic.data.find(i => i.id === id)
      if (!itemToRemove) return false

      return optimistic.update(
        optimistic.data.filter(i => i.id !== id),
        async () => {
          await serverRemove()
          return optimistic.data.filter(i => i.id !== id)
        }
      )
    },
    [optimistic]
  )

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      serverUpdate: () => Promise<T>
    ): Promise<boolean> => {
      return optimistic.update(
        optimistic.data.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
        async () => {
          const updatedItem = await serverUpdate()
          return optimistic.data.map(item =>
            item.id === id ? updatedItem : item
          )
        }
      )
    },
    [optimistic]
  )

  return {
    ...optimistic,
    addItem,
    removeItem,
    updateItem,
  }
}

/**
 * Hook for form submission with optimistic updates
 */
export function useOptimisticForm<TData, TResult = TData>(
  initialData: TData,
  submitFn: (data: TData) => Promise<TResult>
) {
  const [formData, setFormData] = useState<TData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = useCallback(
    async (optimisticData?: TData) => {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      // Apply optimistic update if provided
      if (optimisticData) {
        setFormData(optimisticData)
      }

      try {
        const result = await submitFn(optimisticData || formData)
        setSuccess(true)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        // Rollback to original data
        setFormData(initialData)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, initialData, submitFn]
  )

  const reset = useCallback(() => {
    setFormData(initialData)
    setIsSubmitting(false)
    setError(null)
    setSuccess(false)
  }, [initialData])

  return {
    formData,
    setFormData,
    isSubmitting,
    error,
    success,
    handleSubmit,
    reset,
  }
}
