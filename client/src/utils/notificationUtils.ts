// Notification utilities for browser title and sound alerts

let originalTitle = document.title;
let titleInterval: number | null = null;
let isBlinking = false;

// Create and cache the notification sound
const notificationSound = new Audio();
notificationSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGa657yRPwsUXrPp66hVFAo+ldn0xHQnBSh+y/DglEILFF607e2rWRQLPJHX88p3KgYnfsvw4JRCC0dSqu23ZxsJM4nU8cl0KwYnfsnw4ZVCDERRpuw0XBsKMYrV8sp1KwYngMnw4JRCDERRpe02XBwKL4rT8sp1KwYngMnv4JRCDERRpe02XBwKL4rT8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCC0dTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv4JRCDEdTp+02XBwKMIrU8sl1KwYmfsnv3pNCCw==';
notificationSound.volume = 0.5;

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
 * Play notification sound
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
 * Check if the page is currently visible/focused
 */
export const isPageVisible = (): boolean => {
  return !document.hidden && document.hasFocus();
};

/**
 * Handle new message notification (both title and sound)
 */
export const handleNewMessageNotification = (messageText: string = 'New message', senderId: string, currentUserId: string, doNotDisturb: boolean = false) => {
  // Don't notify for own messages
  if (senderId === currentUserId) return;
  
  // Check if Do Not Disturb is enabled
  if (doNotDisturb) return;
  
  // Only notify if page is not visible/focused
  if (!isPageVisible()) {
    startTitleNotification(messageText);
    playNotificationSound();
  }
};

/**
 * Reset notifications when user returns to page
 */
export const resetNotifications = () => {
  stopTitleNotification();
};
