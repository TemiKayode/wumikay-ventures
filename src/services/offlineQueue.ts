// Offline Queue Service - Handles orders when database is unavailable

export interface QueuedOrder {
  id: string
  type: 'order' | 'product' | 'customer'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
  retryCount: number
  status: 'pending' | 'syncing' | 'failed' | 'synced'
  error?: string
}

const QUEUE_KEY = 'wumikay-offline-queue'
const MAX_RETRIES = 3

// Get all queued items
export const getQueue = (): QueuedOrder[] => {
  try {
    const queue = localStorage.getItem(QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('Failed to read offline queue:', error)
    return []
  }
}

// Save queue to localStorage
const saveQueue = (queue: QueuedOrder[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Failed to save offline queue:', error)
  }
}

// Add item to queue
export const addToQueue = (
  type: QueuedOrder['type'],
  action: QueuedOrder['action'],
  data: any
): QueuedOrder => {
  const queue = getQueue()
  
  const queuedItem: QueuedOrder = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    action,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending'
  }
  
  queue.push(queuedItem)
  saveQueue(queue)
  
  console.log('Added to offline queue:', queuedItem)
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    setTimeout(() => syncQueue(), 1000)
  }
  
  return queuedItem
}

// Remove item from queue
export const removeFromQueue = (id: string): void => {
  const queue = getQueue().filter(item => item.id !== id)
  saveQueue(queue)
}

// Update item status
export const updateQueueItemStatus = (
  id: string, 
  status: QueuedOrder['status'], 
  error?: string
): void => {
  const queue = getQueue()
  const item = queue.find(i => i.id === id)
  if (item) {
    item.status = status
    if (error) item.error = error
    if (status === 'failed') item.retryCount++
    saveQueue(queue)
  }
}

// Get pending count
export const getPendingCount = (): number => {
  return getQueue().filter(item => item.status === 'pending' || item.status === 'failed').length
}

// Check if online
export const isOnline = (): boolean => {
  return navigator.onLine
}

// Sync a single order
const syncOrder = async (item: QueuedOrder): Promise<boolean> => {
  try {
    updateQueueItemStatus(item.id, 'syncing')
    
    let endpoint = ''
    let method = 'POST'
    let body = item.data
    
    switch (item.type) {
      case 'order':
        if (item.action === 'create') {
          endpoint = 'http://localhost:5000/api/orders'
        } else if (item.action === 'update') {
          endpoint = `http://localhost:5000/api/orders/${item.data.id}`
          method = 'PUT'
        }
        break
      case 'product':
        if (item.action === 'create') {
          endpoint = 'http://localhost:5000/api/products'
        } else if (item.action === 'update') {
          endpoint = `http://localhost:5000/api/products/${item.data.id}`
          method = 'PUT'
        }
        break
      case 'customer':
        endpoint = 'http://localhost:5000/api/customers'
        break
    }
    
    if (!endpoint) {
      throw new Error('Unknown sync type')
    }
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Sync failed')
    }
    
    updateQueueItemStatus(item.id, 'synced')
    
    // Remove synced items after a delay
    setTimeout(() => removeFromQueue(item.id), 5000)
    
    return true
  } catch (error: any) {
    console.error('Sync error for item', item.id, error)
    
    if (item.retryCount >= MAX_RETRIES) {
      updateQueueItemStatus(item.id, 'failed', `Max retries exceeded: ${error.message}`)
    } else {
      updateQueueItemStatus(item.id, 'pending', error.message)
    }
    
    return false
  }
}

// Sync all pending items
export const syncQueue = async (): Promise<{ synced: number; failed: number }> => {
  if (!navigator.onLine) {
    console.log('Offline - cannot sync queue')
    return { synced: 0, failed: 0 }
  }
  
  // Check if server is available
  try {
    const health = await fetch('http://localhost:5000/api/health', { method: 'GET' })
    if (!health.ok) throw new Error('Server not available')
  } catch (error) {
    console.log('Server not available - cannot sync queue')
    return { synced: 0, failed: 0 }
  }
  
  const queue = getQueue().filter(item => 
    item.status === 'pending' || 
    (item.status === 'failed' && item.retryCount < MAX_RETRIES)
  )
  
  if (queue.length === 0) {
    console.log('No items to sync')
    return { synced: 0, failed: 0 }
  }
  
  console.log(`Syncing ${queue.length} queued items...`)
  
  let synced = 0
  let failed = 0
  
  for (const item of queue) {
    const success = await syncOrder(item)
    if (success) synced++
    else failed++
  }
  
  console.log(`Sync complete: ${synced} synced, ${failed} failed`)
  
  return { synced, failed }
}

// Clear all synced items
export const clearSynced = (): void => {
  const queue = getQueue().filter(item => item.status !== 'synced')
  saveQueue(queue)
}

// Clear entire queue
export const clearQueue = (): void => {
  saveQueue([])
}

// Listen for online/offline events
export const initOfflineListener = (onStatusChange?: (online: boolean) => void): () => void => {
  const handleOnline = () => {
    console.log('Back online - syncing queue...')
    onStatusChange?.(true)
    syncQueue()
  }
  
  const handleOffline = () => {
    console.log('Gone offline - orders will be queued')
    onStatusChange?.(false)
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Offline-aware order creation
export const createOrderOffline = async (orderData: any): Promise<{ success: boolean; order?: any; queued?: boolean }> => {
  // Try online first
  if (navigator.onLine) {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        const order = await response.json()
        return { success: true, order }
      }
    } catch (error) {
      console.log('Online order failed, queuing...', error)
    }
  }
  
  // Queue for later
  const tempOrder = {
    ...orderData,
    id: `temp-${Date.now()}`,
    order_number: `OFF-${Date.now().toString(36).toUpperCase()}`,
    created_at: new Date().toISOString(),
    status: 'pending_sync'
  }
  
  addToQueue('order', 'create', orderData)
  
  return { success: true, order: tempOrder, queued: true }
}

export default {
  getQueue,
  addToQueue,
  removeFromQueue,
  syncQueue,
  getPendingCount,
  isOnline,
  initOfflineListener,
  createOrderOffline,
  clearQueue,
  clearSynced
}
