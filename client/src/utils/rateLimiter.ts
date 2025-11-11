/**
 * Rate Limiter Utility
 * Tracks message sending rate in localStorage and manages rate limit warnings
 */

interface MessageTimestamp {
  timestamp: number;
}

const STORAGE_KEY = 'message_rate_limiter';
const TIME_WINDOW = 60000; // 1 minute in milliseconds

/**
 * Get message timestamps from localStorage
 */
function getMessageTimestamps(): MessageTimestamp[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save message timestamps to localStorage
 */
function saveMessageTimestamps(timestamps: MessageTimestamp[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
  } catch (error) {
    console.error('Failed to save rate limiter data:', error);
  }
}

/**
 * Clean up old timestamps (older than 1 minute)
 */
function cleanOldTimestamps(timestamps: MessageTimestamp[]): MessageTimestamp[] {
  const now = Date.now();
  return timestamps.filter(t => now - t.timestamp < TIME_WINDOW);
}

/**
 * Check if user can send a message based on rate limit
 * @param rateLimit - Maximum messages allowed per minute
 * @returns boolean indicating if user can send a message
 */
export function canSendMessage(rateLimit: number): boolean {
  let timestamps = getMessageTimestamps();
  timestamps = cleanOldTimestamps(timestamps);
  
  const count = timestamps.length;
  return count < rateLimit;
}

/**
 * Record a message send
 */
export function recordMessageSent(): void {
  let timestamps = getMessageTimestamps();
  timestamps = cleanOldTimestamps(timestamps);
  timestamps.push({ timestamp: Date.now() });
  saveMessageTimestamps(timestamps);
}

/**
 * Get seconds until rate limit resets
 */
export function getSecondsUntilReset(): number {
  let timestamps = getMessageTimestamps();
  timestamps = cleanOldTimestamps(timestamps);
  
  if (timestamps.length === 0) return 0;
  
  const oldest = timestamps[0].timestamp;
  const now = Date.now();
  const elapsed = now - oldest;
  const remaining = TIME_WINDOW - elapsed;
  
  return Math.ceil(remaining / 1000);
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimitData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
