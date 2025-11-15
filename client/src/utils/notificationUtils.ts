// Notification utilities for browser title, sound alerts, and favicon badge

let originalTitle = document.title;
let titleInterval: number | null = null;
let isBlinking = false;
let originalFavicon: string | null = null;
let unreadCount = 0;

// Sound settings from database
let messageNotificationSound = 'stwime_up';
let senderNotificationSound = 'pop';
let cachedNotificationAudio: HTMLAudioElement | null = null;
let cachedSendAudio: HTMLAudioElement | null = null;

// Fetch sound settings from the database
const fetchSoundSettings = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/site`);
    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        if (data.settings.messageNotificationSound) {
          messageNotificationSound = data.settings.messageNotificationSound;
          console.log('🔔 Loaded receiver notification sound:', messageNotificationSound);
          // Clear cache so new sound will be loaded next time
          cachedNotificationAudio = null;
        }
        if (data.settings.senderNotificationSound) {
          senderNotificationSound = data.settings.senderNotificationSound;
          console.log('📤 Loaded sender notification sound:', senderNotificationSound);
          // Clear cache so new sound will be loaded next time
          cachedSendAudio = null;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch sound settings:', error);
  }
};

// Fetch settings on module load
fetchSoundSettings();

// Refresh settings every 30 seconds to pick up changes
setInterval(fetchSoundSettings, 30000);

// Get notification sound (creates and caches Audio object)
const getNotificationSound = (): HTMLAudioElement => {
  if (!cachedNotificationAudio || cachedNotificationAudio.src !== `/sounds/notifications/${messageNotificationSound}.mp3`) {
    cachedNotificationAudio = new Audio(`/sounds/notifications/${messageNotificationSound}.mp3`);
    cachedNotificationAudio.volume = 0.5;
    console.log('🔊 Loaded notification sound:', messageNotificationSound);
  }
  return cachedNotificationAudio;
};

// Get send message sound (creates and caches Audio object)
const getSendMessageSound = (): HTMLAudioElement => {
  const soundPath = `/sounds/sender/${senderNotificationSound}.mp3`;
  const fullPath = window.location.origin + soundPath;
  
  console.log('🔍 Checking sender sound:');
  console.log('  - Setting from DB:', senderNotificationSound);
  console.log('  - Sound path:', soundPath);
  console.log('  - Full URL:', fullPath);
  
  if (cachedSendAudio) {
    console.log('  - Cached src:', cachedSendAudio.src);
    console.log('  - Match:', cachedSendAudio.src === fullPath);
  }
  
  if (!cachedSendAudio || cachedSendAudio.src !== fullPath) {
    console.log('📤 Creating new sender sound:', senderNotificationSound);
    cachedSendAudio = new Audio(soundPath);
    cachedSendAudio.volume = 0.4;
  } else {
    console.log('♻️ Reusing cached sender sound');
  }
  
  return cachedSendAudio;
};

/**
 * Create a canvas-based favicon with a notification badge
 */
const createBadgedFavicon = (count: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Draw red circle background
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw notification icon (bell)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔔', 16, 16);
  
  // If count is provided and > 0, add badge
  if (count > 0) {
    const badgeText = count > 99 ? '99+' : count.toString();
    const badgeSize = badgeText.length > 2 ? 14 : 12;
    
    // Draw badge background
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(24, 8, badgeSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw badge border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 8, badgeSize / 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw badge number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${badgeSize - 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 24, 8);
  }
  
  return canvas.toDataURL('image/png');
};

/**
 * Update the favicon to show notification badge
 */
const updateFavicon = (showBadge: boolean = false, count: number = 0) => {
  // Save original favicon if not saved yet
  if (!originalFavicon) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      originalFavicon = link.href;
    }
  }
  
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  
  if (showBadge) {
    link.href = createBadgedFavicon(count);
  } else if (originalFavicon) {
    link.href = originalFavicon;
  }
};

/**
 * Start blinking the browser title to indicate new message
 */
export const startTitleNotification = (messageText: string = 'New message') => {
  if (isBlinking) return;
  
  isBlinking = true;
  originalTitle = document.title;
  
  let showingAlert = true;
  titleInterval = window.setInterval(() => {
    document.title = showingAlert ? `🔔 ${messageText}` : originalTitle;
    showingAlert = !showingAlert;
  }, 1000);
};

/**
 * Stop blinking the browser title
 */
export const stopTitleNotification = () => {
  if (!isBlinking) return;
  
  isBlinking = false;
  if (titleInterval !== null) {
    clearInterval(titleInterval);
    titleInterval = null;
  }
  document.title = originalTitle;
};

/**
 * Play notification sound (for receiving messages)
 */
export const playNotificationSound = () => {
  // Don't play sound if set to "none"
  if (messageNotificationSound === 'none') return;
  
  try {
    const sound = getNotificationSound();
    // Reset the sound to play from beginning
    sound.currentTime = 0;
    sound.play().catch((error: any) => {
      console.log('Could not play notification sound:', error);
    });
  } catch (error) {
    console.log('Error playing notification sound:', error);
  }
};

/**
 * Play send message sound (for sending messages)
 */
export const playSendMessageSound = (doNotDisturb: boolean = false) => {
  // Don't play sound if Do Not Disturb is enabled
  if (doNotDisturb) return;
  
  // Don't play sound if set to "none"
  if (senderNotificationSound === 'none') return;
  
  try {
    const sound = getSendMessageSound();
    // Reset the sound to play from beginning
    sound.currentTime = 0;
    sound.play().catch((error: any) => {
      console.log('Could not play send message sound:', error);
    });
  } catch (error) {
    console.log('Error playing send message sound:', error);
  }
};

/**
 * Check if the page is currently visible/focused
 */
export const isPageVisible = (): boolean => {
  return !document.hidden && document.hasFocus();
};

/**
 * Increment unread message count and update favicon badge
 */
export const incrementUnreadCount = () => {
  unreadCount++;
  updateFavicon(true, unreadCount);
};

/**
 * Reset unread count and restore original favicon
 */
export const resetUnreadCount = () => {
  unreadCount = 0;
  updateFavicon(false, 0);
};

/**
 * Get current unread count
 */
export const getUnreadCount = (): number => {
  return unreadCount;
};

/**
 * Handle new message notification (title, sound, and favicon badge)
 */
export const handleNewMessageNotification = (messageText: string = 'New message', senderId: string, currentUserId: string, doNotDisturb: boolean = false) => {
  // Don't notify for own messages
  if (senderId === currentUserId) return;
  
  // Check if Do Not Disturb is enabled
  if (doNotDisturb) return;
  
  // Increment unread count and update favicon badge
  incrementUnreadCount();
  
  // Always play sound for new messages
  playNotificationSound();
  
  // Only blink title if page is not visible/focused
  if (!isPageVisible()) {
    startTitleNotification(messageText);
  }
};

/**
 * Reset notifications when user returns to page
 */
export const resetNotifications = () => {
  stopTitleNotification();
  resetUnreadCount();
};
