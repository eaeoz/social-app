import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const TTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
const CHECK_PERIOD = parseInt(process.env.CACHE_CHECK_PERIOD) || 600; // 10 minutes default

// Initialize node-cache
const cache = new NodeCache({
  stdTTL: TTL,
  checkperiod: CHECK_PERIOD,
  useClones: false
});

// User sessions cache
export const userSessions = {
  set: (userId, sessionData) => {
    cache.set(`session:${userId}`, sessionData);
  },
  get: (userId) => {
    return cache.get(`session:${userId}`);
  },
  delete: (userId) => {
    cache.del(`session:${userId}`);
  },
  getAll: () => {
    const keys = cache.keys().filter(key => key.startsWith('session:'));
    const sessions = {};
    keys.forEach(key => {
      const userId = key.replace('session:', '');
      sessions[userId] = cache.get(key);
    });
    return sessions;
  }
};

// Active socket connections cache
export const activeConnections = {
  set: (socketId, userId) => {
    cache.set(`connection:${socketId}`, userId);
  },
  get: (socketId) => {
    return cache.get(`connection:${socketId}`);
  },
  delete: (socketId) => {
    cache.del(`connection:${socketId}`);
  },
  getUserBySocket: (socketId) => {
    return cache.get(`connection:${socketId}`);
  },
  getSocketByUser: (userId) => {
    const keys = cache.keys().filter(key => key.startsWith('connection:'));
    for (const key of keys) {
      const storedUserId = cache.get(key);
      if (storedUserId === userId) {
        return key.replace('connection:', '');
      }
    }
    return null;
  }
};

// Online users cache
export const onlineUsers = {
  add: (userId) => {
    let users = cache.get('online:users') || [];
    if (!users.includes(userId)) {
      users.push(userId);
      cache.set('online:users', users);
    }
  },
  remove: (userId) => {
    let users = cache.get('online:users') || [];
    users = users.filter(id => id !== userId);
    cache.set('online:users', users);
  },
  getAll: () => {
    return cache.get('online:users') || [];
  },
  isOnline: (userId) => {
    const users = cache.get('online:users') || [];
    return users.includes(userId);
  }
};

// Room participants cache
export const roomParticipants = {
  add: (roomId, userId) => {
    let participants = cache.get(`room:${roomId}`) || [];
    if (!participants.includes(userId)) {
      participants.push(userId);
      cache.set(`room:${roomId}`, participants);
    }
  },
  remove: (roomId, userId) => {
    let participants = cache.get(`room:${roomId}`) || [];
    participants = participants.filter(id => id !== userId);
    cache.set(`room:${roomId}`, participants);
  },
  get: (roomId) => {
    return cache.get(`room:${roomId}`) || [];
  },
  clear: (roomId) => {
    cache.del(`room:${roomId}`);
  }
};

// Typing indicators cache (short TTL)
export const typingIndicators = {
  set: (targetId, userId, isTyping) => {
    const key = `typing:${targetId}:${userId}`;
    if (isTyping) {
      cache.set(key, true, 10); // 10 seconds TTL
    } else {
      cache.del(key);
    }
  },
  get: (targetId) => {
    const keys = cache.keys().filter(key => key.startsWith(`typing:${targetId}:`));
    return keys.map(key => key.split(':')[2]);
  },
  clear: (targetId, userId) => {
    cache.del(`typing:${targetId}:${userId}`);
  }
};

// Cache statistics
export function getCacheStats() {
  return cache.getStats();
}

// Clear all cache
export function clearAllCache() {
  cache.flushAll();
  console.log('🧹 All cache cleared');
}

// Cache events
cache.on('expired', (key, value) => {
  console.log(`⏰ Cache key expired: ${key}`);
});

cache.on('flush', () => {
  console.log('🧹 Cache flushed');
});

console.log('✅ Cache system initialized');
console.log(`   TTL: ${TTL}s, Check Period: ${CHECK_PERIOD}s`);

export default cache;
