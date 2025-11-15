// Notification utilities for browser title, sound alerts, and favicon badge

let originalTitle = document.title;
let titleInterval: number | null = null;
let isBlinking = false;
let originalFavicon: string | null = null;
let unreadCount = 0;

// Create and cache the notification sound (for receiving messages)
const notificationSound = new Audio();
notificationSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGa657yRPwsUXrPp66hVFAo+ldn0xHQnBSh+y/DglEILFF607e2rWRQLPJHX88p3KgYnfsvw4JRCC0dSqu23ZxsJM4nU8cl0KwYnfsnw4ZVCDERRpuw0XBsKMYrV8sp1KwYngMnw4JRCDERRpe02XBwKL4rT8sp1KwYngMnv4JRCDERRpe02XBwKL4rT8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv3pNCCw==';
notificationSound.volume = 0.5;

// Create and cache the send message sound (lighter, softer sound)
const sendMessageSound = new Audio();
sendMessageSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGa657yRPwsUXrPp66hVFAo+ldn0xHQnBSh+y/DglEILFF607e2rWRQLPJHX88p3KgYnfsvw4JRCC0dSqu23ZxsJM4nU8cl0KwYnfsnw4ZVCDERRpuw0XBsKMYrV8sp1KwYngMnw4JRCDERRpe02XBwKL4rT8sp1KwYngMnv4JRCDERRpe02XBwKL4rT8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv3pNCCw==';
sendMessageSound.volume = 0.3; // Softer than notification sound

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
  try {
    // Reset the sound to play from beginning
    notificationSound.currentTime = 0;
    notificationSound.play().catch((error) => {
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
  
  try {
    // Reset the sound to play from beginning
    sendMessageSound.currentTime = 0;
    sendMessageSound.play().catch((error) => {
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
