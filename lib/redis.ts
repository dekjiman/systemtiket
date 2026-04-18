import Redis from 'ioredis'

const getRedisUrl = () => {
  return process.env.REDIS_URL || 'redis://localhost:6379'
}

let redis: Redis | null = null
let isRedisConnected = false

const createRedisClient = () => {
  const client = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
    connectTimeout: 5000,
  })

  client.on('error', (err) => {
    console.error('Redis connection error:', err.message)
    isRedisConnected = false
  })

  client.on('connect', () => {
    console.log('Redis connected successfully')
    isRedisConnected = true
  })

  client.on('ready', () => {
    isRedisConnected = true
  })

  client.on('close', () => {
    isRedisConnected = false
  })

  return client
}

export const connectRedis = async () => {
  try {
    if (!redis) {
      redis = createRedisClient()
    }
    await redis.connect()
    console.log('Redis connection established')
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    isRedisConnected = false
  }
}

export const isConnected = () => isRedisConnected

const getRedis = (): Redis | null => {
  if (!redis) {
    try {
      redis = createRedisClient()
    } catch (error) {
      console.error('Failed to create Redis client:', error)
      return null
    }
  }
  return redis
}

// In-memory fallback for when Redis is not available
const memoryStore = new Map<string, { value: string; expiry: number | null }>()

const memoryGet = async (key: string): Promise<string | null> => {
  const item = memoryStore.get(key)
  if (!item) return null
  if (item.expiry && Date.now() > item.expiry) {
    memoryStore.delete(key)
    return null
  }
  return item.value
}

const memorySet = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  const expiry = ttl ? Date.now() + ttl * 1000 : null
  memoryStore.set(key, { value, expiry })
  return true
}

const memoryDel = async (key: string): Promise<boolean> => {
  memoryStore.delete(key)
  return true
}

const memoryIncr = async (key: string): Promise<number> => {
  const current = await memoryGet(key)
  const newValue = current ? parseInt(current) + 1 : 1
  await memorySet(key, newValue.toString())
  return newValue
}

const redisApi = {
  get: async (key: string): Promise<string | null> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        return memoryGet(key)
      }
      return await client.get(key)
    } catch (error) {
      console.warn('Redis get failed, using memory fallback:', error)
      return memoryGet(key)
    }
  },
  set: async (key: string, value: string, mode?: string, ttl?: number): Promise<boolean> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        return memorySet(key, value, ttl || (mode === 'EX' ? 60 : undefined))
      }
      if (mode === 'EX' && ttl) {
        return await client.set(key, value, 'EX', ttl) === 'OK'
      }
      return await client.set(key, value) === 'OK'
    } catch (error) {
      console.warn('Redis set failed, using memory fallback:', error)
      return memorySet(key, value, ttl)
    }
  },
  setex: async (key: string, ttl: number, value: string): Promise<boolean> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        return memorySet(key, value, ttl)
      }
      return await client.setex(key, ttl, value) === 'OK'
    } catch (error) {
      console.warn('Redis setex failed, using memory fallback:', error)
      return memorySet(key, value, ttl)
    }
  },
  del: async (key: string): Promise<boolean> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        return memoryDel(key)
      }
      return await client.del(key) > 0
    } catch (error) {
      console.warn('Redis del failed, using memory fallback:', error)
      return memoryDel(key)
    }
  },
  incr: async (key: string): Promise<number> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        return memoryIncr(key)
      }
      return await client.incr(key)
    } catch (error) {
      console.warn('Redis incr failed, using memory fallback:', error)
      return memoryIncr(key)
    }
  },
  expire: async (key: string, ttl: number): Promise<boolean> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        const item = memoryStore.get(key)
        if (item) {
          item.expiry = Date.now() + ttl * 1000
          return true
        }
        return false
      }
      return await client.expire(key, ttl) === 1
    } catch (error) {
      console.warn('Redis expire failed:', error)
      return false
    }
  },
  lpush: async (key: string, value: string): Promise<number> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        const list = memoryStore.get(key)?.value ? JSON.parse(memoryStore.get(key)!.value) : []
        list.unshift(value)
        memoryStore.set(key, { value: JSON.stringify(list), expiry: null })
        return list.length
      }
      return await client.lpush(key, value)
    } catch (error) {
      console.warn('Redis lpush failed:', error)
      return 0
    }
  },
  lpop: async (key: string): Promise<string | null> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        const list = memoryStore.get(key)?.value ? JSON.parse(memoryStore.get(key)!.value) : []
        const item = list.shift()
        memoryStore.set(key, { value: JSON.stringify(list), expiry: null })
        return item || null
      }
      return await client.lpop(key)
    } catch (error) {
      console.warn('Redis lpop failed:', error)
      return null
    }
  },
  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        const list = memoryStore.get(key)?.value ? JSON.parse(memoryStore.get(key)!.value) : []
        return list.slice(start, stop === -1 ? undefined : stop + 1)
      }
      return await client.lrange(key, start, stop)
    } catch (error) {
      console.warn('Redis lrange failed:', error)
      return []
    }
  },
  llen: async (key: string): Promise<number> => {
    try {
      const client = getRedis()
      if (!client || !isRedisConnected) {
        const list = memoryStore.get(key)?.value ? JSON.parse(memoryStore.get(key)!.value) : []
        return list.length
      }
      return await client.llen(key)
    } catch (error) {
      console.warn('Redis llen failed:', error)
      return 0
    }
  },
}

export default redisApi

// Helper functions for ticket locking
export const TICKET_LOCK_TTL = 60 // 60 seconds lock TTL
export const CART_LOCK_TTL = 600 // 10 minutes cart TTL

export const lockTicket = async (ticketId: string, userId: string): Promise<boolean> => {
  const lockKey = `lock:ticket:${ticketId}`
  const lockValue = `${userId}:${Date.now()}`
  
  // Check if lock exists first
  const existing = await redisApi.get(lockKey)
  if (existing) {
    return false
  }
  
  // SETNX - only set if not exists
  const result = await redisApi.set(lockKey, lockValue, 'EX', TICKET_LOCK_TTL)
  return result
}

export const unlockTicket = async (ticketId: string, userId: string): Promise<boolean> => {
  const lockKey = `lock:ticket:${ticketId}`
  const lockValue = await redisApi.get(lockKey)
  
  // Only unlock if the lock belongs to this user
  if (lockValue && lockValue.startsWith(userId)) {
    await redisApi.del(lockKey)
    return true
  }
  return false
}

export const checkTicketLock = async (ticketId: string): Promise<string | null> => {
  const lockKey = `lock:ticket:${ticketId}`
  return await redisApi.get(lockKey)
}

// Queue functions
export const addToBookingQueue = async (userId: string, ticketId: string, quantity: number): Promise<number> => {
  const queueKey = 'queue:booking'
  const queueItem = JSON.stringify({
    userId,
    ticketId,
    quantity,
    timestamp: Date.now(),
  })
  
  // Add to end of queue
  await redisApi.lpush(queueKey, queueItem)
  
  // Get position
  const position = await redisApi.llen(queueKey)
  return position
}

export const getQueuePosition = async (userId: string): Promise<number | null> => {
  const queueKey = 'queue:booking'
  const items = await redisApi.lrange(queueKey, 0, -1)
  
  for (let i = 0; i < items.length; i++) {
    const item = JSON.parse(items[i])
    if (item.userId === userId) {
      return i + 1
    }
  }
  return null
}

export const popFromQueue = async (): Promise<{ userId: string; ticketId: string; quantity: number } | null> => {
  const queueKey = 'queue:booking'
  const item = await redisApi.lpop(queueKey)
  
  if (!item) return null
  return JSON.parse(item)
}

export const getQueueLength = async (): Promise<number> => {
  const queueKey = 'queue:booking'
  return await redisApi.llen(queueKey)
}

// Rate limiting
export const checkRateLimit = async (userId: string, action: string, limit: number, windowSeconds: number): Promise<boolean> => {
  const key = `ratelimit:${action}:${userId}`
  const current = await redisApi.incr(key)
  
  if (current === 1) {
    await redisApi.expire(key, windowSeconds)
  }
  
  return current <= limit
}

// Ticket stock cache functions
export const getTicketStock = async (ticketId: string): Promise<number | null> => {
  const key = `stock:ticket:${ticketId}`
  const stock = await redisApi.get(key)
  return stock ? parseInt(stock, 10) : null
}

export const setTicketStock = async (ticketId: string, stock: number, ttl: number = 300): Promise<void> => {
  const key = `stock:ticket:${ticketId}`
  await redisApi.setex(key, ttl, stock.toString())
}

export const decrementTicketStock = async (ticketId: string, quantity: number): Promise<number> => {
  const key = `stock:ticket:${ticketId}`
  const current = await redisApi.get(key)
  const newValue = current ? parseInt(current) - quantity : 0
  await redisApi.set(key, newValue.toString())
  return newValue
}

export const incrementTicketStock = async (ticketId: string, quantity: number): Promise<number> => {
  const key = `stock:ticket:${ticketId}`
  const current = await redisApi.get(key)
  const newValue = current ? parseInt(current) + quantity : quantity
  await redisApi.set(key, newValue.toString())
  return newValue
}

// Sync stock from database to Redis (for initialization)
export const syncTicketStockToRedis = async (ticketId: string, dbStock: number): Promise<void> => {
  await setTicketStock(ticketId, dbStock, 3600) // 1 hour cache
}