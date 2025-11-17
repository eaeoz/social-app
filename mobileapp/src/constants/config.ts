// API Configuration
// Your backend server details:
// - Local address: localhost:4000 (on your PC)
// - Network address: 192.168.1.252:4000 (from other devices)
// - iPad successfully reached /health endpoint! ✅
export const API_URL = 'http://192.168.1.252:4000/api';
export const SOCKET_URL = 'http://192.168.1.252:4000';

// Appwrite Configuration
export const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6901b7f00006bdd6e48d';

// App Configuration
export const APP_NAME = 'Netcify';

// WebSocket Configuration
export const SOCKET_CONFIG = {
  transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
  autoConnect: false, // We'll connect manually after auth
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  upgrade: true,
  rememberUpgrade: true,
};

// Pagination
export const MESSAGES_PER_PAGE = 50;
export const USERS_PER_PAGE = 50;

// Cache Duration (in milliseconds)
export const CACHE_DURATION = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  ROOMS: 10 * 60 * 1000, // 10 minutes
  MESSAGES: 2 * 60 * 1000, // 2 minutes
};

// Typing Indicator Timeout
export const TYPING_TIMEOUT = 3000; // 3 seconds

// Activity Heartbeat Interval
export const ACTIVITY_INTERVAL = 30000; // 30 seconds

// Notification Settings
export const NOTIFICATION_SOUND_ENABLED = true;
export const NOTIFICATION_VIBRATION_ENABLED = true;

// Image Upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

// User Search
export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 300;
