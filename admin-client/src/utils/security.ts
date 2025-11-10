/**
 * Frontend Security Utilities for Admin Dashboard
 * Implements client-side security best practices
 */

/**
 * XSS Protection - Sanitize user input
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate and sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
}

/**
 * CSP (Content Security Policy) validation
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'netcifyadmin.netlify.app',
      'social-app-5hge.onrender.com',
      'netcify.netlify.app'
    ];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Rate Limiting - Client-side request throttling
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(time => now - time < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const apiRateLimiter = new RateLimiter(60000, 30); // 30 requests per minute
export const loginRateLimiter = new RateLimiter(900000, 5); // 5 attempts per 15 minutes

/**
 * Session Management
 */
export class SecureSessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute
  private static lastActivity: number = Date.now();
  private static checkInterval: NodeJS.Timeout | null = null;

  static init(onSessionExpired: () => void): void {
    this.updateActivity();
    
    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });

    // Check session periodically
    this.checkInterval = setInterval(() => {
      if (Date.now() - this.lastActivity > this.SESSION_TIMEOUT) {
        this.cleanup();
        onSessionExpired();
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  static updateActivity(): void {
    this.lastActivity = Date.now();
  }

  static cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  static getRemainingTime(): number {
    return Math.max(0, this.SESSION_TIMEOUT - (Date.now() - this.lastActivity));
  }
}

/**
 * Token Security
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Secure Storage with encryption
 */
export class SecureStorage {
  private static readonly SALT = 'admin-dashboard-salt';

  private static simpleEncrypt(data: string): string {
    // Simple obfuscation (for production, use a proper encryption library)
    return btoa(encodeURIComponent(data));
  }

  private static simpleDecrypt(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string): void {
    try {
      const encrypted = this.simpleEncrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  static getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return this.simpleDecrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

/**
 * Input Validation
 */
export const validators = {
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  username: (username: string): boolean => {
    // 3-20 characters, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
  },

  password: (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  },

  noSpecialChars: (input: string): boolean => {
    const regex = /^[a-zA-Z0-9\s-_.,!?@]+$/;
    return regex.test(input);
  }
};

/**
 * CSRF Protection
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Audit Logging
 */
export class AuditLogger {
  private static logs: Array<{
    timestamp: string;
    action: string;
    details: any;
    userId?: string;
  }> = [];

  static log(action: string, details: any = {}, userId?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      userId
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
    
    console.log(`[AUDIT] ${action}:`, details);
  }

  static getLogs(): typeof AuditLogger.logs {
    return [...this.logs];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Security Headers Validator
 */
export function validateSecurityHeaders(response: Response): boolean {
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'strict-transport-security'
  ];

  const missingHeaders = requiredHeaders.filter(
    header => !response.headers.has(header)
  );

  if (missingHeaders.length > 0) {
    console.warn('Missing security headers:', missingHeaders);
    return false;
  }

  return true;
}

/**
 * Prevent Clickjacking
 */
export function preventClickjacking(): void {
  if (window.top !== window.self) {
    window.top!.location.href = window.self.location.href;
  }
}

// Initialize clickjacking protection
if (typeof window !== 'undefined') {
  preventClickjacking();
}
